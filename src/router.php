<?php
/* ===== API 라우터 ===== */
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/events.php';
require_once __DIR__ . '/digest.php';
require_once __DIR__ . '/agency.php';
require_once __DIR__ . '/hotel.php';

/* 통계 집계 헬퍼 (2026-07-18): 이름별 건수 누적 */
function statBump(array &$arr, string $key, bool $confirmed, bool $quoteSent, bool $contracted): void {
  if (!isset($arr[$key])) $arr[$key] = ['requests' => 0, 'confirmed' => 0, 'quoteSent' => 0, 'contracted' => 0];
  $arr[$key]['requests']++;
  if ($confirmed) $arr[$key]['confirmed']++;
  if ($quoteSent) $arr[$key]['quoteSent']++;
  if ($contracted) $arr[$key]['contracted']++;
}
/* 통계 기간 헬퍼 (2026-08-02, [013]) — 요청 생성 시각(createdAt, ms) 기준 */
function inStatRange(array $p, ?int $fromMs, ?int $toMs): bool {
  $t = (int)($p['createdAt'] ?? 0);
  if ($t <= 0) return true;                 // 시각이 없으면 제외하지 않는다
  if ($fromMs !== null && $t < $fromMs) return false;
  if ($toMs !== null && $t > $toMs) return false;
  return true;
}
/* from/to(YYYY-MM-DD) → [시작 ms, 끝 ms] · 끝은 그날 23:59:59.999 */
function statRangeMs(?string $from, ?string $to): array {
  $ok = fn($d) => is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d);
  $f = $ok($from) ? strtotime($from . ' 00:00:00') * 1000 : null;
  $t = $ok($to) ? (strtotime($to . ' 23:59:59') * 1000 + 999) : null;
  return [$f, $t];
}
/* 휴무일 입력값 정규화 (2026-07-21): YYYY-MM-DD 문자열만 통과, 정렬·중복제거 */
function normDates(array $in): array {
  $out = [];
  foreach ($in as $d) {
    $d = trim((string)$d);
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) $out[$d] = true;
  }
  $out = array_keys($out); sort($out);
  return $out;
}

function route(string $path, string $method): void {
  $pdo = db();
  $in = jsonIn();

  /* ---------- 인증 ---------- */
  if ($path === 'register' && $method === 'POST') {
    if (env('REGISTER_OPEN', '') !== '1') jsonOut(['error' => 'register_closed'], 403); // 회원가입 준비중 (env REGISTER_OPEN=1로 개방)
    $name = trim($in['name'] ?? ''); $email = strtolower(trim($in['email'] ?? ''));
    $pw = $in['password'] ?? ''; $role = $in['role'] ?? ''; $lang = $in['lang'] ?? 'ko';
    if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pw) < 6) jsonOut(['error' => 'invalid_input'], 422);
    if (!in_array($role, ['agent', 'sreq', 'schk'], true)) jsonOut(['error' => 'invalid_role'], 422);
    $allowed = ['agent' => ['ko'], 'sreq' => ['en', 'ko'], 'schk' => ['th', 'en']][$role];
    if (!in_array($lang, $allowed, true)) $lang = $allowed[0];
    try {
      $st = $pdo->prepare("INSERT INTO users (name,email,pass_hash,role,status,lang,created_at) VALUES (?,?,?,?, 'pending', ?,?)");
      $st->execute([$name, $email, password_hash($pw, PASSWORD_DEFAULT), $role, $lang, nowMs()]);
    } catch (PDOException $e) { jsonOut(['error' => 'email_exists'], 409); }
    jsonOut(['ok' => true, 'pending' => true]);
  }
  if ($path === 'login' && $method === 'POST') {
    startSession();
    /* 2026-07-30: 부계정이 이 사이트 전용 비밀번호를 설정한 경우 부계정 아이디로도 로컬 로그인 허용 */
    $loginId = strtolower(trim($in['email'] ?? ''));
    $st = $pdo->prepare("SELECT * FROM users WHERE email=? OR (agency_login_id IS NOT NULL AND lower(agency_login_id)=?)");
    $st->execute([$loginId, $loginId]);
    $u = $st->fetch();
    if (!$u || !password_verify($in['password'] ?? '', $u['pass_hash'])) jsonOut(['error' => 'bad_credentials'], 401);
    if ($u['status'] === 'rejected') jsonOut(['error' => 'rejected'], 403);
    if ($u['status'] !== 'approved') jsonOut(['error' => 'pending'], 403);
    session_regenerate_id(true);
    $_SESSION['uid'] = (int)$u['id'];
    unset($_SESSION['agency']);
    setRememberCookie(!empty($in['remember'])); // 자동 로그인 (2026-07-18)
    jsonOut(['ok' => true, 'user' => publicUser($u)]);
  }
  /* 에이전시 부계정 로그인 — 외부 인증 API를 서버 사이드에서 호출 (agency.php) */
  if ($path === 'agency-login' && $method === 'POST') {
    agencyLoginRoute($pdo, $in);
  }
  if ($path === 'logout' && $method === 'POST') { startSession(); session_destroy(); setRememberCookie(false); jsonOut(['ok' => true]); }
  if ($path === 'me' && $method === 'GET') jsonOut(['user' => publicUser(currentUser())]);
  if ($path === 'me' && $method === 'PATCH') {
    $u = requireApproved();
    if (isset($in['lang'])) {
      $allowed = ['agent' => ['ko'], 'sreq' => ['en', 'ko'], 'schk' => ['th', 'en'], 'admin' => ['ko']][$u['role']];
      if (in_array($in['lang'], $allowed, true)) {
        $pdo->prepare("UPDATE users SET lang=? WHERE id=?")->execute([$in['lang'], $u['id']]);
      }
    }
    /* 회원정보 (2026-07-17): 이름은 변경 불가. 연락처는 전체, 이메일·비밀번호는 이메일 계정만 */
    if (isset($in['phone'])) {
      $p = trim((string)$in['phone']);
      if (mb_strlen($p) > 40) jsonOut(['error' => 'invalid_phone'], 422);
      $pdo->prepare("UPDATE users SET phone=? WHERE id=?")->execute([$p, $u['id']]);
    }
    if (isset($in['nickname'])) {
      $nick = trim((string)$in['nickname']);
      if (mb_strlen($nick) > 80) jsonOut(['error' => 'invalid_nickname'], 422);
      $pdo->prepare("UPDATE users SET nickname=? WHERE id=?")->execute([$nick ?: null, $u['id']]);
    }
    if (isset($in['bank_account'])) {
      $bank = trim((string)$in['bank_account']);
      if (mb_strlen($bank) > 255) jsonOut(['error' => 'invalid_bank_account'], 422);
      $pdo->prepare("UPDATE users SET bank_account=? WHERE id=?")->execute([$bank ?: null, $u['id']]);
    }
    /* 소속 에이전시(회사) — 부계정/에이전트가 이직 시 변경 (2026-07-30) */
    if (isset($in['agent_company']) && $u['role'] === 'agent') {
      $ac = trim((string)$in['agent_company']);
      if (mb_strlen($ac) > 120) jsonOut(['error' => 'invalid_agent_company'], 422);
      $pdo->prepare("UPDATE users SET agent_company=? WHERE id=?")->execute([$ac ?: null, $u['id']]);
    }
    /* 관할지역 수정 (2026-08-01 변경): 관리자만 저장 가능 — 직원(sreq/schk)은 본인 지역 변경 불가, 관리자 페이지에서 설정 */
    if (isset($in['region']) && $u['role'] === 'admin') {
      $region = $in['region'] ?: null;
      if ($region && !in_array($region, ['krabi', 'bangkok'], true)) $region = null;
      $pdo->prepare("UPDATE users SET region=? WHERE id=?")->execute([$region, $u['id']]);
    }
    if (isset($in['name']) && $u['role'] === 'admin') {  // 관리자만 본인 이름(한글이름) 수정 가능 (2026-07-18)
      $nm = trim((string)$in['name']);
      if ($nm === '' || mb_strlen($nm) > 80) jsonOut(['error' => 'invalid_name'], 422);
      $pdo->prepare("UPDATE users SET name=? WHERE id=?")->execute([$nm, $u['id']]);
    }
    if (isset($in['email'])) {
      if (!empty($u['agency_idx'])) jsonOut(['error' => 'external_account'], 403);
      $em = strtolower(trim((string)$in['email']));
      if (!filter_var($em, FILTER_VALIDATE_EMAIL)) jsonOut(['error' => 'invalid_email'], 422);
      try { $pdo->prepare("UPDATE users SET email=? WHERE id=?")->execute([$em, $u['id']]); }
      catch (PDOException $e) { jsonOut(['error' => 'email_exists'], 409); }
    }
    if (!empty($in['new_password'])) {
      if (strlen((string)$in['new_password']) < 6) jsonOut(['error' => 'weak_password'], 422);
      $st = $pdo->prepare("SELECT pass_hash,agency_login_id FROM users WHERE id=?");
      $st->execute([$u['id']]);
      $row = $st->fetch();
      $curOk = $row && password_verify((string)($in['cur_password'] ?? ''), (string)$row['pass_hash']);
      /* 부계정 (2026-07-30): 로컬 비밀번호 미설정(또는 불일치) 상태면 현재 비밀번호를 너바나 외부 인증으로 검증
         → 최초 변경 시 너바나 발급 비밀번호로 본인 확인 후 이 사이트 전용 비밀번호 저장 */
      if (!$curOk && !empty($u['agency_idx']) && !empty($row['agency_login_id'])) {
        $chk = agencyAuthenticate((string)$row['agency_login_id'], (string)($in['cur_password'] ?? ''));
        $curOk = !empty($chk['ok']);
      }
      if (!$curOk) jsonOut(['error' => 'bad_password'], 403);
      $pdo->prepare("UPDATE users SET pass_hash=? WHERE id=?")
          ->execute([password_hash((string)$in['new_password'], PASSWORD_DEFAULT), $u['id']]);
    }
    jsonOut(['ok' => true, 'user' => publicUser(currentUser())]);
  }

  if ($path === 'agents' && $method === 'GET') {
    requireApproved();
    /* 2026-08-01: 소속 회사·부계정 정보 포함 — 요청자 화면에서 '에이전트(회사)'와 '담당자(부계정)'를 구분해
       표시하고, 담당자 선택이 실제 부계정 계정과 연결되어야 웹 알림이 전달되기 때문 */
    $rows = $pdo->query("SELECT name, nickname, agent_company, agency_idx, agency_parent_idx, agency_login_id
      FROM users WHERE role='agent' AND status='approved' ORDER BY name")->fetchAll();
    $out2 = [];
    foreach ($rows as $r) {
      $out2[] = [
        'name' => $r['name'],
        'nickname' => $r['nickname'] ?? '',
        'company' => $r['agent_company'] ?? '',
        'idx' => (int)($r['agency_idx'] ?? 0),
        'parent_idx' => (int)($r['agency_parent_idx'] ?? 0),
        'login_id' => $r['agency_login_id'] ?? '',
        'sub' => !empty($r['agency_idx']),          // 부계정 계정 여부
      ];
    }
    jsonOut(['agents' => $out2]);
  }
  /* ---------- 상태 폴링 ---------- */
  if ($path === 'state' && $method === 'GET') {
    $u = requireApproved();
    $rev = (int)metaGet($pdo, 'rev', 0);
    $since = (int)($_GET['rev'] ?? -1);
    $out = ['rev' => $rev];
    if ($since !== $rev) {
      $out['requests'] = allRequests($pdo, $u);  // 2026-07-22: 권한 기반 필터링
      foreach ($out['requests'] as &$_rr) { if (isset($_rr['ws']) && is_array($_rr['ws']) && count($_rr['ws'])===0) $_rr['ws'] = new stdClass(); } unset($_rr);
      $out['phones'] = metaGet($pdo, 'phones', new stdClass());
      $out['fullbook'] = metaGet($pdo, 'fullbook', new stdClass());
      $out['seq'] = (int)metaGet($pdo, 'seq', 0);
      $out['seqA'] = (int)metaGet($pdo, 'seqA', 0);
      $out['seqD'] = (int)metaGet($pdo, 'seqD', 0);
    }
    // 닉네임 맵 (2026-08-01): 이름→닉네임 — 화면의 nickOf() 표시용 (지금까지 서버가 내려주지 않아 닉네임이 안 보이던 문제 수정)
    $nk = [];
    foreach ($pdo->query("SELECT name,nickname FROM users WHERE nickname IS NOT NULL AND nickname<>''")->fetchAll() as $nu) {
      $nk[$nu['name']] = $nu['nickname'];
    }
    $out['nicks'] = $nk;
    // 알림 (역할 대상, 본인 행동 제외, 2026-07-30)
    //  - 최고관리자(ADMIN_EMAIL): 모든 역할의 알림을 본인 행동 포함 전체 열람
    //  - 일반 관리자(요청자→관리자 승격): 기본 요청자로 처리 — 요청자(sreq) 알림 수신
    $isSuper = strtolower((string)($u['email'] ?? '')) === strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local'));
    if (($u['role'] ?? '') === 'admin' && $isSuper) {
      $st = $pdo->prepare("SELECT type,req_no,params,MAX(created_at) AS created_at FROM notifications
        GROUP BY type,req_no,params ORDER BY MAX(id) DESC LIMIT 20");
      $st->execute();
    } else {
      $notifRole = (($u['role'] ?? '') === 'admin') ? 'sreq' : $u['role'];
      /* 2026-08-01: 지역 배정 직원은 본인 지역(존) 알림만 — 알림에 지역이 없거나 본인이 지역 미배정이면 전체 표시.
         대상 사용자 수만큼 행이 쌓이므로 동일 알림은 GROUP BY로 1건만 표시 (중복 표시 수정) */
      $st = $pdo->prepare("SELECT type,req_no,params,MAX(created_at) AS created_at FROM notifications
        WHERE role=? AND (exclude_user IS NULL OR exclude_user<>?) AND (region IS NULL OR ? IS NULL OR region=?)
        GROUP BY type,req_no,params ORDER BY MAX(id) DESC LIMIT 20");
      $st->execute([$notifRole, $u['id'], $u['region'] ?? null, $u['region'] ?? null]);
    }
    $items = [];
    $unread = 0;
    foreach ($st->fetchAll() as $n) {
      $it = ['type' => $n['type'], 'no' => $n['req_no'], 'p' => json_decode($n['params'] ?: '{}', true), 'at' => (int)$n['created_at']];
      if ((int)$n['created_at'] > (int)$u['notif_read_at']) { $it['new'] = true; $unread++; }
      $items[] = $it;
    }
    $out['notifs'] = ['unread' => $unread, 'items' => $items];
    jsonOut($out);
  }

  /* ---------- 데이터 동기화 ---------- */
  if ($path === 'sync' && $method === 'POST') {
    $u = requireApproved();
    $fixes = [];
    $changed = false;
    foreach (($in['requests'] ?? []) as $req) {
      if (!is_array($req) || empty($req['id'])) continue;
      $id = (int)$req['id'];
      $st = $pdo->prepare("SELECT payload FROM requests WHERE id=? AND deleted=0");
      $st->execute([$id]);
      $row = $st->fetch();
      $old = $row ? json_decode($row['payload'], true) : null;
      if ($old === null) {
        // 새 요청: no 중복 방지 (서버가 최종 결정), 요청 생성자 저장 (2026-07-22)
        $seqKey = !empty($req['direct']) ? 'seqD' : 'seqA';
        $seq = (int)metaGet($pdo, $seqKey, 0) + 1;
        metaSet($pdo, $seqKey, $seq);
        if (empty($req['no']) || $req['no'] != $seq) { $req['no'] = $seq; $fixes[] = ['id' => $id, 'no' => $seq]; }
        $pdo->prepare("INSERT INTO requests (id,no,payload,deleted,created_by,updated_at,updated_by) VALUES (?,?,?,0,?,?,?)")
            ->execute([$id, (int)$req['no'], json_encode($req, JSON_UNESCAPED_UNICODE), $u['id'], nowMs(), $u['id']]);
      } else {
        /* 동시 편집 안전장치 (2026-07-20, 2026-07-31 SQLite 호환 수정):
           - MySQL: 명명 잠금(GET_LOCK)으로 같은 요청의 동시 UPDATE를 직렬화
           - SQLite: GET_LOCK이 없어 500 오류로 답변 저장이 통째로 실패하던 치명 버그 → 트랜잭션으로 직렬화
           - ws는 필드 단위로 병합해, 다른 기기가 보낸 오래된(빈) payload가 확인자의 답변을 지우지 못하게 함
           - status는 뒤로 가지 않음(answered → requested 강등 방지) */
        $isMyLock = isMySQL($pdo);
        if ($isMyLock) $pdo->prepare("SELECT GET_LOCK(?, 5)")->execute(["rc_" . $id]);
        else if (!$pdo->inTransaction()) $pdo->beginTransaction();
        try {
          $st2 = $pdo->prepare("SELECT payload FROM requests WHERE id=? AND deleted=0");
          $st2->execute([$id]);
          $cr = $st2->fetch();
          $cur = $cr ? json_decode($cr['payload'], true) : $old;
          $curWs = (is_array($cur) && isset($cur['ws']) && is_array($cur['ws'])) ? $cur['ws'] : [];
          $newWs = (isset($req['ws']) && is_array($req['ws'])) ? $req['ws'] : [];
          // 필드 단위 병합: 들어온 값의 필드가 우선, 들어오지 않은 필드는 서버 값 유지. 서버에만 있는 키도 보존.
          $merged = [];
          foreach ($newWs as $k => $v) {
            $merged[$k] = (isset($curWs[$k]) && is_array($curWs[$k]) && is_array($v)) ? ($v + $curWs[$k]) : $v;
          }
          $req['ws'] = $merged + $curWs;
          // status 강등 방지
          $rank = ['requested' => 1, 'answered' => 2];
          $oldStatus = is_array($cur) ? ($cur['status'] ?? '') : '';
          $newStatus = $req['status'] ?? '';
          if (($rank[$oldStatus] ?? 0) > ($rank[$newStatus] ?? 0)) {
            $req['status'] = $oldStatus;
            foreach (['answeredAt', 'answerComplete', 'manager'] as $f) {
              if (is_array($cur) && array_key_exists($f, $cur)) $req[$f] = $cur[$f];
            }
          }
          $pdo->prepare("UPDATE requests SET no=?, payload=?, updated_at=?, updated_by=? WHERE id=?")
              ->execute([(int)$req['no'], json_encode($req, JSON_UNESCAPED_UNICODE), nowMs(), $u['id'], $id]);
          if (!$isMyLock && $pdo->inTransaction()) $pdo->commit();
        } catch (Throwable $e) {
          if (!$isMyLock && $pdo->inTransaction()) $pdo->rollBack();
          throw $e;
        } finally {
          if ($isMyLock) $pdo->prepare("SELECT RELEASE_LOCK(?)")->execute(["rc_" . $id]);
        }
      }
      detectEvents($pdo, $old, $req, $u);
      $changed = true;
    }
    if (isset($in['phones']) && is_array($in['phones'])) { metaSet($pdo, 'phones', $in['phones']); $changed = true; }
    if (isset($in['fullbook']) && is_array($in['fullbook'])) { metaSet($pdo, 'fullbook', $in['fullbook']); $changed = true; }
    $rev = $changed ? bumpRev($pdo) : (int)metaGet($pdo, 'rev', 0);
    jsonOut(['ok' => true, 'rev' => $rev, 'fixes' => $fixes]);
  }
  if ($path === 'delete' && $method === 'POST') {
    $u = requireApproved();
    $ids = array_filter(array_map('intval', $in['ids'] ?? []));
    if ($ids) {
      $ph = implode(',', array_fill(0, count($ids), '?'));
      $pdo->prepare("UPDATE requests SET deleted=1, updated_at=? WHERE id IN ($ph)")
          ->execute(array_merge([nowMs()], $ids));
      bumpRev($pdo);
    }
    jsonOut(['ok' => true]);
  }
  if ($path === 'notif-read' && $method === 'POST') {
    $u = requireApproved();
    $pdo->prepare("UPDATE users SET notif_read_at=? WHERE id=?")->execute([nowMs(), $u['id']]);
    jsonOut(['ok' => true]);
  }

  /* ---------- 텔레그램 ---------- */
  if ($path === 'tg-link' && $method === 'GET') {
    $u = requireApproved();
    if (!in_array($u['role'], ['sreq', 'schk'], true)) jsonOut(['error' => 'role_not_allowed'], 403);
    $code = bin2hex(random_bytes(8));
    $pdo->prepare("UPDATE users SET tg_link_code=? WHERE id=?")->execute([$code, $u['id']]);
    $bot = env('TELEGRAM_BOT_USERNAME', '');
    jsonOut(['code' => $code, 'url' => $bot ? "https://t.me/$bot?start=$code" : null, 'linked' => !empty($u['telegram_chat_id'])]);
  }
  if ($path === 'tg-webhook' && $method === 'POST') {
    if (env('TELEGRAM_WEBHOOK_SECRET') &&
        ($_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] ?? '') !== env('TELEGRAM_WEBHOOK_SECRET')) jsonOut(['ok' => true]);
    $msg = $in['message'] ?? null;
    if ($msg && preg_match('/^\/start\s+([a-f0-9]{16})/', $msg['text'] ?? '', $m)) {
      $st = $pdo->prepare("SELECT id,name,lang FROM users WHERE tg_link_code=?");
      $st->execute([$m[1]]);
      if ($usr = $st->fetch()) {
        $chat = (string)($msg['chat']['id'] ?? '');
        $pdo->prepare("UPDATE users SET telegram_chat_id=?, tg_link_code=NULL WHERE id=?")->execute([$chat, $usr['id']]);
        tgSend($chat, tgT($usr['lang'] ?: 'ko', 'linked', ['name' => $usr['name']]));
      }
    }
    jsonOut(['ok' => true]);
  }

  /* ---------- 예약 다이제스트 (Cloud Scheduler 호출) ---------- */
  if ($path === 'cron' && in_array($method, ['GET', 'POST'], true)) {
    if (($_GET['key'] ?? '') !== env('CRON_KEY', 'change-me')) jsonOut(['error' => 'forbidden'], 403);
    jsonOut(runDigest($pdo, $_GET['job'] ?? ''));
  }

  /* ---------- 관리자 ---------- */
  if ($path === 'admin/users' && $method === 'GET') {
    requireAdmin();
    // 2026-07-30: 부계정 회원 정보(닉네임·연락처·계좌·부계정 아이디)도 회원 관리에 표시
    $rows = $pdo->query("SELECT id,name,email,role,status,lang,telegram_chat_id,off_days,created_at,phone,nickname,bank_account,agency_idx,agency_parent_idx,agency_login_id,agent_company,region FROM users ORDER BY status='pending' DESC, id DESC")->fetchAll(); /* 2026-08-01: region 포함 (관리지역 표시·설정) */
    $superEmail = strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local'));
    foreach ($rows as &$r) {
      $r['tg'] = !empty($r['telegram_chat_id']);
      $r['super'] = (strtolower((string)$r['email']) === $superEmail);
      $r['off_days'] = decodeOffDays($r['off_days'] ?? '');
      $r['ext'] = !empty($r['agency_idx']);
      unset($r['telegram_chat_id']);
    }
    jsonOut(['users' => $rows]);
  }
  /* 직원 계정 발행 (2026-07-17, 2026-07-22 지역 추가): 관리자가 아이디(이메일 또는 영문 아이디)·비밀번호를 발행, 즉시 승인 상태 */
  if ($path === 'admin/create-user' && $method === 'POST') {
    requireAdmin();
    $name = trim($in['name'] ?? '');
    $id = strtolower(trim($in['email'] ?? ''));
    $pw = (string)($in['password'] ?? '');
    $role = $in['role'] ?? '';
    // 에이전트 또는 직원 (2026-07-22)
    if ($role === 'agent') {
      if (!$name) jsonOut(['error' => 'invalid_input'], 422);
      $lang = $in['lang'] ?? 'ko';
      if (!in_array($lang, ['ko', 'en', 'th'], true)) $lang = 'ko';
      $email = "agent-" . bin2hex(random_bytes(8)) . "@agency.local";
      try {
        $pdo->prepare("INSERT INTO users (name,email,pass_hash,role,status,lang,created_at) VALUES (?,?,?,?, 'pending', ?,?)")
            ->execute([$name, $email, '!agent-external-auth', $role, $lang, nowMs()]);
      } catch (PDOException $e) { jsonOut(['error' => 'error'], 500); }
      jsonOut(['ok' => true]);
    } else {
      // 직원: sreq 또는 schk (2026-07-22 지역 추가)
      $okId = str_contains($id, '@')
        ? (bool)filter_var($id, FILTER_VALIDATE_EMAIL)
        : (bool)preg_match('/^[a-z0-9._-]{4,60}$/', $id);
      if (!$name || !$okId || strlen($pw) < 6) jsonOut(['error' => 'invalid_input'], 422);
      if (!in_array($role, ['sreq', 'schk'], true)) jsonOut(['error' => 'invalid_role'], 422);
      $lang = ['sreq' => 'en', 'schk' => 'th'][$role];
      $reqLang = $in['lang'] ?? '';
      $allowedLang = ['sreq' => ['en', 'ko'], 'schk' => ['th', 'en']][$role] ?? [$lang];
      if (in_array($reqLang, $allowedLang, true)) $lang = $reqLang;
      // 지역 유효성 검증 (2026-07-22)
      $region = $in['region'] ?? null;
      if ($region && !in_array($region, ['krabi', 'bangkok'], true)) $region = null;
      try {
        $pdo->prepare("INSERT INTO users (name,email,pass_hash,role,status,lang,region,created_at) VALUES (?,?,?,?, 'approved', ?,?,?)")
            ->execute([$name, $id, password_hash($pw, PASSWORD_DEFAULT), $role, $lang, $region, nowMs()]);
      } catch (PDOException $e) { jsonOut(['error' => 'email_exists'], 409); }
      jsonOut(['ok' => true]);
    }
  }
  /* 부계정 목록 조회 (2026-08-01): 너바나 부계정 목록 API 프록시 — 관리자 전용.
     외부 API가 아직 없으면 {ok:false, error:'not_found'} 반환 → 화면은 로그인한 부계정만 표시(예비 동작) */
  if ($path === 'admin/agency-sub-accounts' && $method === 'GET') {
    requireAdmin();
    $pidx = (int)($_GET['parent_idx'] ?? 0);
    if (!empty($_GET['force'])) { metaSet($pdo, 'subs_path_miss_at', 0); }  // 새로고침 시 즉시 재탐색
    $r = agencySubAccountsRequest($pidx ?: null, $pdo);
    if ($r['ok']) jsonOut(['ok' => true, 'subs' => $r['data'], 'path' => $r['path'] ?? '']);
    jsonOut(['ok' => false, 'error' => $r['error']]);
  }
  /* 에이전시 담당자 승인/중지/삭제 (2026-08-01): 관리자가 담당자별 로컬 상태 설정.
     너바나 원본은 변경하지 않고 이 사이트에서의 표시·이용만 제한하며,
     같은 에이전시의 로그인 부계정(이름/닉네임 일치)도 함께 승인/중지/삭제 처리 */
  if ($path === 'admin/manager-override' && $method === 'POST') {
    requireAdmin();
    $aidx = (int)($in['agency_idx'] ?? 0);
    $mn = trim((string)($in['mname'] ?? ''));
    $stv = (string)($in['status'] ?? '');
    if (!$aidx || $mn === '' || ($stv !== '' && !in_array($stv, ['blocked', 'deleted'], true))) jsonOut(['error' => 'invalid'], 422);
    $pdo->prepare("DELETE FROM manager_overrides WHERE agency_idx=? AND mname=?")->execute([$aidx, $mn]);
    if ($stv !== '') $pdo->prepare("INSERT INTO manager_overrides (agency_idx,mname,status,created_at) VALUES (?,?,?,?)")->execute([$aidx, $mn, $stv, nowMs()]);
    $us = $pdo->prepare("SELECT id FROM users WHERE role='agent' AND (agency_idx=? OR agency_parent_idx=?) AND (name=? OR nickname=?)");
    $us->execute([$aidx, $aidx, $mn, $mn]);
    foreach ($us->fetchAll() as $uu) {
      if ($stv === 'deleted') $pdo->prepare("DELETE FROM users WHERE id=? AND role='agent'")->execute([$uu['id']]);
      else $pdo->prepare("UPDATE users SET status=? WHERE id=?")->execute([$stv === 'blocked' ? 'rejected' : 'approved', $uu['id']]);
    }
    jsonOut(['ok' => true]);
  }
  /* 직원 관리지역 설정 (2026-08-01): 관리자가 직원(sreq/schk)의 관할지역을 지정 — 직원 본인은 변경 불가 */
  if ($path === 'admin/setregion' && $method === 'POST') {
    requireAdmin();
    $id = (int)($in['id'] ?? 0);
    $region = $in['region'] ?? null;
    if ($region && !in_array($region, ['krabi', 'bangkok'], true)) jsonOut(['error' => 'invalid_region'], 422);
    if (!$id) jsonOut(['error' => 'invalid'], 422);
    $st = $pdo->prepare("SELECT role FROM users WHERE id=?"); $st->execute([$id]);
    $t = $st->fetch();
    if (!$t) jsonOut(['error' => 'not_found'], 404);
    if (!in_array($t['role'], ['sreq', 'schk', 'admin'], true)) jsonOut(['error' => 'not_staff'], 403);
    $pdo->prepare("UPDATE users SET region=? WHERE id=?")->execute([$region ?: null, $id]);
    jsonOut(['ok' => true]);
  }
  if ($path === 'admin/setrole' && $method === 'POST') {
    requireAdmin();
    $id = (int)($in['id'] ?? 0);
    $to = $in['to'] ?? '';
    if (!$id || !in_array($to, ['sreq', 'schk'], true)) jsonOut(['error' => 'invalid'], 422);
    $st = $pdo->prepare("SELECT role FROM users WHERE id=?"); $st->execute([$id]);
    $t = $st->fetch();
    if (!$t) jsonOut(['error' => 'not_found'], 404);
    if (!in_array($t['role'], ['sreq', 'schk'], true)) jsonOut(['error' => 'not_staff'], 403);
    $pdo->prepare("UPDATE users SET role=? WHERE id=? AND role IN ('sreq','schk')")->execute([$to, $id]);
    jsonOut(['ok' => true]);
  }
  if ($path === 'admin/decide' && $method === 'POST') {
    $admin = requireAdmin();
    $id = (int)($in['id'] ?? 0);
    $action = $in['action'] ?? '';
    if (!$id || !in_array($action, ['approve', 'reject', 'delete', 'promote', 'demote'], true)) jsonOut(['error' => 'invalid'], 422);
    if ($id === (int)$admin['id']) jsonOut(['error' => 'self'], 422);
    $superEmail = strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local'));
    $isSuper = strtolower((string)$admin['email']) === $superEmail;
    // 대상 사용자 확인
    $st = $pdo->prepare("SELECT id,role,email FROM users WHERE id=?"); $st->execute([$id]);
    $target = $st->fetch();
    if (!$target) jsonOut(['error' => 'not_found'], 404);
    // 최고관리자 계정은 누구도 변경/삭제 불가
    if (strtolower((string)$target['email']) === $superEmail) jsonOut(['error' => 'protected'], 403);
    // 관리자 승격/해제는 최고관리자만 가능 (2026-07-18)
    if ($action === 'promote' || $action === 'demote') {
      if (!$isSuper) jsonOut(['error' => 'forbidden'], 403);
      if ($action === 'promote') {
        if ($target['role'] !== 'admin')
          $pdo->prepare("UPDATE users SET orig_role=role, role='admin', status='approved' WHERE id=?")->execute([$id]);
      } else { // demote
        if ($target['role'] === 'admin')
          $pdo->prepare("UPDATE users SET role=COALESCE(NULLIF(orig_role,''),'sreq'), orig_role=NULL WHERE id=?")->execute([$id]);
      }
      jsonOut(['ok' => true]);
    }
    // 일반 관리자는 다른 관리자를 승인/거절/삭제할 수 없음 (관리자 관리는 최고관리자만)
    if ($target['role'] === 'admin' && !$isSuper) jsonOut(['error' => 'forbidden'], 403);
    if ($action === 'delete') $pdo->prepare("DELETE FROM users WHERE id=? AND role<>'admin'")->execute([$id]);
    else $pdo->prepare("UPDATE users SET status=? WHERE id=? AND role<>'admin'")
             ->execute([$action === 'approve' ? 'approved' : 'rejected', $id]);
    jsonOut(['ok' => true]);
  }
  /* 직원 휴무일 저장 (2026-07-18, 2026-07-21 확장): 관리자가 임의 직원의 휴무일을 등록/수정.
     dates=최종 확정 휴무일, work_overrides=기본 휴무일(토/일/공휴일)을 근무로 되돌린 날짜 */
  if ($path === 'admin/offdays' && $method === 'POST') {
    requireAdmin();
    $id = (int)($in['id'] ?? 0);
    if (!$id) jsonOut(['error' => 'invalid'], 422);
    $st = $pdo->prepare("SELECT id FROM users WHERE id=?"); $st->execute([$id]);
    if (!$st->fetch()) jsonOut(['error' => 'not_found'], 404);
    $dates = normDates((array)($in['dates'] ?? []));
    $workOvr = normDates((array)($in['work_overrides'] ?? []));
    $weekdays = [];
    foreach ((array)($in['weekdays'] ?? []) as $w) {
      $w = (int)$w;
      if ($w >= 0 && $w <= 6) $weekdays[$w] = true;
    }
    $weekdays = array_map('intval', array_keys($weekdays)); sort($weekdays);
    $pdo->prepare("UPDATE users SET off_days=? WHERE id=?")
        ->execute([json_encode(['dates' => $dates, 'weekdays' => $weekdays, 'work_overrides' => $workOvr], JSON_UNESCAPED_UNICODE), $id]);
    jsonOut(['ok' => true, 'off_days' => ['dates' => $dates, 'weekdays' => $weekdays, 'work_overrides' => $workOvr]]);
  }
  /* 관리자가 임의 직원의 텔레그램 연결 링크 발급 (2026-07-22): 본인이 아니라 관리자가 대신
     생성해서 그 링크를 직원에게 전달(카톡/문자 등)하는 용도. 코드/웹훅 매칭 로직은 본인용 tg-link와 동일. */
  if ($path === 'admin/tg-link' && $method === 'POST') {
    requireAdmin();
    $id = (int)($in['id'] ?? 0);
    if (!$id) jsonOut(['error' => 'invalid'], 422);
    $st = $pdo->prepare("SELECT id,role,telegram_chat_id FROM users WHERE id=?"); $st->execute([$id]);
    $target = $st->fetch();
    if (!$target) jsonOut(['error' => 'not_found'], 404);
    if (!in_array($target['role'], ['sreq', 'schk'], true)) jsonOut(['error' => 'role_not_allowed'], 422);
    $code = bin2hex(random_bytes(8));
    $pdo->prepare("UPDATE users SET tg_link_code=? WHERE id=?")->execute([$code, $id]);
    $bot = env('TELEGRAM_BOT_USERNAME', '');
    jsonOut(['ok' => true, 'code' => $code, 'url' => $bot ? "https://t.me/$bot?start=$code" : null, 'linked' => !empty($target['telegram_chat_id'])]);
  }
  /* 관리자가 임의 직원의 텔레그램 연결 해제 (2026-07-22): 직원이 폰/텔레그램 계정을 바꾼 경우 등 재연결이 필요할 때 사용 */
  if ($path === 'admin/tg-reset' && $method === 'POST') {
    requireAdmin();
    $id = (int)($in['id'] ?? 0);
    if (!$id) jsonOut(['error' => 'invalid'], 422);
    $st = $pdo->prepare("SELECT id FROM users WHERE id=?"); $st->execute([$id]);
    if (!$st->fetch()) jsonOut(['error' => 'not_found'], 404);
    $pdo->prepare("UPDATE users SET telegram_chat_id=NULL, tg_link_code=NULL WHERE id=?")->execute([$id]);
    jsonOut(['ok' => true]);
  }
  /* 관리자 통계 (2026-07-18, 2026-08-02 [013] 개편)
     - from/to 로 기간 집계 (없으면 전체 기간 — 기존 동작 유지)
     - 에이전트: 에이전시별 합계 + 소속 담당자 목록(화면에서 펼침)
     - 담당자: 전체 에이전시 담당자를 한 목록으로
     - 요청자: 요청 등록자 기준
     - 확인자: 요청은 전 직원이 함께 받으므로 '전체 중 몇 건을 처리했는지'(처리 건수)만 집계 */
  if ($path === 'admin/stats' && $method === 'GET') {
    $u = requireAdmin();
    [$fromMs, $toMs] = statRangeMs($_GET['from'] ?? null, $_GET['to'] ?? null);
    $byAgency = []; $byAgentMgr = []; $byRequester = []; $byChecker = [];
    $tot = ['requests' => 0, 'confirmed' => 0, 'quoteSent' => 0, 'contracted' => 0];
    /* 에이전트 탭은 실제 에이전시만 집계 (2026-07-31): 내부 직원·관리자 이름이 agent에 들어간 건 제외
       (관리자·직원이 등록한 건은 요청자 탭에서 집계됨) */
    $staffNames = [];
    foreach ($pdo->query("SELECT name,nickname FROM users WHERE role IN ('admin','sreq','schk')")->fetchAll() as $su) {
      foreach (['name', 'nickname'] as $f) { $v = trim((string)($su[$f] ?? '')); if ($v !== '') $staffNames[$v] = true; }
    }
    // 2026-07-30 버그 수정: 사용자 정보 없이 호출하면 지역 필터에 걸려 항상 0건이 되던 문제 → 관리자 정보 전달
    foreach (allRequests($pdo, $u) as $p) {
      if (!inStatRange($p, $fromMs, $toMs)) continue;
      $answered = (($p['status'] ?? '') === 'answered');
      $confirmed = $answered && !empty($p['answerComplete']); // 확인자 답변 완료 = 확정
      $quoteSent = !empty($p['quoteSent']);
      $contracted = !empty($p['contractedAt']);
      $tot['requests']++;
      if ($confirmed) $tot['confirmed']++;
      if ($quoteSent) $tot['quoteSent']++;
      if ($contracted) $tot['contracted']++;
      $none = '(미지정)';
      $agName = trim((string)($p['agent'] ?? ''));
      $mgName = trim((string)($p['agentManager'] ?? ''));
      /* 에이전시 → 담당자 2단 집계 (2026-08-02 [013]) */
      if ($agName !== '' && empty($staffNames[$agName])) {
        if (!isset($byAgency[$agName])) $byAgency[$agName] = ['tot' => ['requests'=>0,'confirmed'=>0,'quoteSent'=>0,'contracted'=>0], 'm' => []];
        statBump($byAgency[$agName]['tot'], '_', $confirmed, $quoteSent, $contracted); // 아래에서 형태 정리
        statBump($byAgency[$agName]['m'], $mgName !== '' ? $mgName : $none, $confirmed, $quoteSent, $contracted);
      }
      statBump($byAgentMgr, $mgName !== '' ? $mgName : $none, $confirmed, $quoteSent, $contracted);
      statBump($byRequester, trim((string)($p['registrant'] ?? '')) ?: $none, $confirmed, $quoteSent, $contracted);
      /* 확인자: 답변을 등록한 사람의 처리 건수 */
      if ($answered) {
        $ck = trim((string)($p['manager'] ?? '')) ?: $none;
        if (!isset($byChecker[$ck])) $byChecker[$ck] = 0;
        $byChecker[$ck]++;
      }
    }
    $fmt = function (array $arr): array {
      $out = [];
      foreach ($arr as $k => $v) $out[] = array_merge(['name' => $k], $v);
      usort($out, fn($a, $b) => ($b['requests'] <=> $a['requests']) ?: ($b['confirmed'] <=> $a['confirmed']));
      return $out;
    };
    /* 에이전시 출력: 합계 + 담당자 배열 */
    $agenciesOut = [];
    foreach ($byAgency as $name => $v) {
      $t = $v['tot']['_'];
      $agenciesOut[] = ['name' => $name, 'requests' => $t['requests'], 'confirmed' => $t['confirmed'],
        'quoteSent' => $t['quoteSent'], 'contracted' => $t['contracted'], 'managers' => $fmt($v['m'])];
    }
    usort($agenciesOut, fn($a, $b) => ($b['requests'] <=> $a['requests']) ?: ($b['confirmed'] <=> $a['confirmed']));
    /* 확인자 출력: 처리 건수 + 전체 대비 비중 */
    $checkersOut = [];
    foreach ($byChecker as $name => $n) $checkersOut[] = ['name' => $name, 'done' => $n];
    usort($checkersOut, fn($a, $b) => $b['done'] <=> $a['done']);
    jsonOut([
      'total' => $tot,
      'from' => $_GET['from'] ?? null, 'to' => $_GET['to'] ?? null,
      'agencies' => $agenciesOut,
      'agentMgrs' => $fmt($byAgentMgr),
      'requesters' => $fmt($byRequester),
      'checkers' => $checkersOut,
    ]);
  }

  /* 직원 업무 통계 (2026-08-02, [014]): 요청자·확인자가 "회사 전체 업무 중 내가 얼마나 처리했는지"를 본다.
     - 대상: 승인된 요청자·확인자·(최고관리자 제외) 관리자
     - 반환: 구간 전체 요청 수 + 사람별 처리(답변 등록) 건수. 금액·에이전시 실적은 내려보내지 않는다. */
  if ($path === 'mystats' && $method === 'GET') {
    $u = requireApproved();
    if (!in_array($u['role'], ['sreq', 'schk', 'admin'], true)) jsonOut(['error' => 'forbidden'], 403);
    [$fromMs, $toMs] = statRangeMs($_GET['from'] ?? null, $_GET['to'] ?? null);
    $total = 0; $byChecker = [];
    foreach (allRequests($pdo, $u) as $p) {
      if (!inStatRange($p, $fromMs, $toMs)) continue;
      $total++;
      if (($p['status'] ?? '') === 'answered') {
        $ck = trim((string)($p['manager'] ?? ''));
        if ($ck === '') continue;
        if (!isset($byChecker[$ck])) $byChecker[$ck] = 0;
        $byChecker[$ck]++;
      }
    }
    $rows = [];
    foreach ($byChecker as $name => $n) $rows[] = ['name' => $name, 'done' => $n];
    usort($rows, fn($a, $b) => $b['done'] <=> $a['done']);
    $me = trim((string)($u['nickname'] ?? '')) ?: trim((string)($u['name'] ?? ''));
    jsonOut(['ok' => true, 'from' => $_GET['from'] ?? null, 'to' => $_GET['to'] ?? null,
      'total' => $total, 'me' => $me, 'staff' => $rows]);
  }
  /* 본인 휴무일 자가 등록 (2026-07-19, 2026-07-21 확장, 2026-07-22 추가관리자 허용): 요청자·확인자,
     그리고 승격된(원래 직원이었던) 추가 관리자가 스스로 등록/취소. 최종관리자(super)는 대상 아님. 본인 계정만 수정.
     dates=최종 확정 휴무일, work_overrides=기본 휴무일(토/일/공휴일)을 근무로 되돌린 날짜 */
  if ($path === 'my-offdays' && $method === 'POST') {
    $u = requireApproved();
    $superEmail = strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local'));
    $isSuperUser = strtolower((string)$u['email']) === $superEmail;
    $allowed = in_array($u['role'], ['sreq', 'schk'], true) || ($u['role'] === 'admin' && !$isSuperUser);
    if (!$allowed) jsonOut(['error' => 'forbidden'], 403);
    $dates = normDates((array)($in['dates'] ?? []));
    $workOvr = normDates((array)($in['work_overrides'] ?? []));
    $weekdays = [];
    foreach ((array)($in['weekdays'] ?? []) as $w) {
      $w = (int)$w;
      if ($w >= 0 && $w <= 6) $weekdays[$w] = true;
    }
    $weekdays = array_map('intval', array_keys($weekdays)); sort($weekdays);
    $pdo->prepare("UPDATE users SET off_days=? WHERE id=?")
        ->execute([json_encode(['dates' => $dates, 'weekdays' => $weekdays, 'work_overrides' => $workOvr], JSON_UNESCAPED_UNICODE), $u['id']]);
    jsonOut(['ok' => true, 'off_days' => ['dates' => $dates, 'weekdays' => $weekdays, 'work_overrides' => $workOvr]]);
  }

  /* 휴일 근무자 공유 조회 (2026-08-02, [011]): 직원끼리 "이 휴일에 누가 근무하는지" 확인.
     - 대상: 승인된 요청자·확인자·(최고관리자를 제외한) 관리자. 에이전트는 접근 불가.
     - 반환: 각 직원의 표시 이름/닉네임과 요청 구간에 포함된 '휴무일' 목록만.
       휴일(주말·공휴일) 판정은 클라이언트가 이미 갖고 있는 공휴일표로 하므로 서버는 날짜만 넘긴다.
       → "휴무일 목록에 없으면 그날은 근무" 로 클라이언트가 계산한다.
     - 개인 사유·연락처 등 다른 정보는 내려보내지 않는다. 구간은 최대 120일로 제한. */
  if ($path === 'workdays' && $method === 'GET') {
    $u = requireApproved();
    if (!in_array($u['role'], ['sreq', 'schk', 'admin'], true)) jsonOut(['error' => 'forbidden'], 403);
    $from = trim((string)($_GET['from'] ?? ''));
    $to   = trim((string)($_GET['to'] ?? ''));
    $isDate = fn($s) => (bool)preg_match('/^\d{4}-\d{2}-\d{2}$/', $s);
    if (!$isDate($from) || !$isDate($to) || $to < $from) jsonOut(['error' => 'bad_range'], 400);
    if ((strtotime($to) - strtotime($from)) > 120 * 86400) jsonOut(['error' => 'range_too_wide'], 400);
    $superEmail = strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local'));
    $st = $pdo->prepare("SELECT id,name,nickname,email,role,off_days FROM users WHERE status='approved' AND role IN ('sreq','schk','admin') ORDER BY id");
    $st->execute();
    $staff = [];
    foreach ($st->fetchAll() as $r) {
      if ($r['role'] === 'admin' && strtolower((string)$r['email']) === $superEmail) continue; // 최고관리자는 근무표 대상 아님
      $od = decodeOffDays($r['off_days'] ?? '');
      $off = [];
      foreach ($od['dates'] as $d) { if (is_string($d) && $d >= $from && $d <= $to) $off[] = $d; }
      sort($off);
      $staff[] = [
        'id'   => (int)$r['id'],
        'name' => (string)$r['name'],
        'nick' => (string)($r['nickname'] ?? ''),
        'role' => $r['role'],
        'me'   => ((int)$r['id'] === (int)$u['id']),
        'off'  => array_values(array_unique($off)),
      ];
    }
    jsonOut(['ok' => true, 'from' => $from, 'to' => $to, 'staff' => $staff]);
  }

  /* ===== 견적서 샘플 (2026-07-31): 요청자 전체 공유 ===== */
  if ($path === 'quote-samples' && $method === 'GET') {
    requireApproved();
    $type = trim((string)($_GET['type'] ?? '')); $loc = trim((string)($_GET['location'] ?? '')); $q = trim((string)($_GET['search'] ?? ''));
    $sql = "SELECT id,name,tour_type,location,hotels,created_by,created_name,created_at FROM quote_samples WHERE 1=1"; $args = [];
    if ($type !== '') { $sql .= " AND tour_type=?"; $args[] = $type; }
    if ($loc !== '') { $sql .= " AND location=?"; $args[] = $loc; }
    if ($q !== '') { $sql .= " AND (name LIKE ? OR hotels LIKE ?)"; $args[] = "%$q%"; $args[] = "%$q%"; }
    $sql .= " ORDER BY id DESC LIMIT 200";
    $st = $pdo->prepare($sql); $st->execute($args);
    jsonOut(['ok' => true, 'samples' => $st->fetchAll()]);
  }
  if ($path === 'quote-samples' && $method === 'POST') {
    $u = requireApproved();
    if (!in_array($u['role'], ['sreq', 'admin'], true)) jsonOut(['error' => 'forbidden'], 403);
    $name = trim((string)($in['name'] ?? ''));
    if ($name === '' || mb_strlen($name) > 200) jsonOut(['error' => 'invalid_name'], 422);
    $payload = $in['payload'] ?? null;
    if (!is_array($payload)) jsonOut(['error' => 'invalid_payload'], 422);
    $st = $pdo->prepare("INSERT INTO quote_samples (name,tour_type,location,hotels,payload,created_by,created_name,created_at) VALUES (?,?,?,?,?,?,?,?)");
    $st->execute([$name, trim((string)($in['tour_type'] ?? '')) ?: null, trim((string)($in['location'] ?? '')) ?: null,
      mb_substr(trim((string)($in['hotels'] ?? '')), 0, 500) ?: null,
      json_encode($payload, JSON_UNESCAPED_UNICODE), (int)$u['id'], ($u['nickname'] ?: $u['name']), nowMs()]);
    jsonOut(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
  }
  if (preg_match('#^quote-samples/(\d+)$#', $path, $mSmp)) {
    $u = requireApproved(); $sid = (int)$mSmp[1];
    if ($method === 'GET') {
      $st = $pdo->prepare("SELECT * FROM quote_samples WHERE id=?"); $st->execute([$sid]); $r = $st->fetch();
      if (!$r) jsonOut(['error' => 'not_found'], 404);
      $r['payload'] = json_decode((string)$r['payload'], true);
      jsonOut(['ok' => true, 'sample' => $r]);
    }
    if ($method === 'DELETE') {
      $st = $pdo->prepare("SELECT created_by FROM quote_samples WHERE id=?"); $st->execute([$sid]); $r = $st->fetch();
      if (!$r) jsonOut(['error' => 'not_found'], 404);
      if ((int)$r['created_by'] !== (int)$u['id'] && $u['role'] !== 'admin') jsonOut(['error' => 'forbidden'], 403);
      $pdo->prepare("DELETE FROM quote_samples WHERE id=?")->execute([$sid]);
      jsonOut(['ok' => true]);
    }
  }

  /* ===== 외부 에이전시 API 연동 (2026-07-22) ===== */
  // 에이전시 목록 조회: GET /api/agencies?type=...&active=...&search=...
  if ($path === 'agencies' && $method === 'GET') {
    $u = requireApproved(); // 로그인한 사용자만
    $type = $_GET['type'] ?? null;
    $active = $_GET['active'] ?? null;
    $search = $_GET['search'] ?? null;
    $r = agencyListRequest($type, $active, $search);
    if ($r['ok']) {
      jsonOut(['ok' => true, 'agencies' => $r['data']]);
    } else {
      $code = match($r['error']) {
        'not_configured' => 503,
        'unreachable' => 502,
        default => 500
      };
      jsonOut(['error' => $r['error']], $code);
    }
  }

  // 에이전시 상세 조회: GET /api/agencies/{idx}
  if (str_starts_with($path, 'agencies/') && $method === 'GET') {
    $u = requireApproved();
    $idx = (int)substr($path, 9); // "agencies/" 이후
    if ($idx <= 0) jsonOut(['error' => 'invalid_id'], 400);
    $r = agencyDetailRequest($idx);
    if ($r['ok']) {
      /* 담당자 로컬 상태 병합 (2026-08-01): 관리자에겐 상태 표시, 일반 사용자에겐 중지/삭제 담당자 숨김 */
      $ag = $r['data'];
      try {
        $ov = $pdo->prepare("SELECT mname,status FROM manager_overrides WHERE agency_idx=?");
        $ov->execute([$idx]);
        $map = [];
        foreach ($ov->fetchAll() as $o) $map[trim((string)$o['mname'])] = $o['status'];
        if ($map) {
          $isAdminUser = (($u['role'] ?? '') === 'admin');
          $ms = [];
          foreach ((array)($ag['managers'] ?? []) as $m) {
            $lst = $map[trim((string)($m['mname'] ?? ''))] ?? null;
            if (!$isAdminUser && $lst) continue;
            if ($lst) $m['local_status'] = $lst;
            $ms[] = $m;
          }
          $ag['managers'] = $ms;
        }
      } catch (Throwable $e) {}
      jsonOut(['ok' => true, 'agency' => $ag]);
    } else {
      $code = match($r['error']) {
        'not_found' => 404,
        'not_configured' => 503,
        'unreachable' => 502,
        default => 500
      };
      jsonOut(['error' => $r['error']], $code);
    }
  }

  /* ===== 외부 호텔 API 연동 (2026-07-22) ===== */
  // 호텔 목록 조회: GET /api/hotels?active=Y&area=...&search=...
  if ($path === 'hotels' && $method === 'GET') {
    $u = requireApproved();
    $active = $_GET['active'] ?? null;
    $area = $_GET['area'] ?? null;
    $search = $_GET['search'] ?? null;
    $r = hotelListRequest($active, $area, $search);
    if ($r['ok']) {
      jsonOut(['ok' => true, 'hotels' => $r['data']]);
    } else {
      $code = match($r['error']) {
        'not_configured' => 503,
        'unreachable' => 502,
        default => 500
      };
      jsonOut(['error' => $r['error']], $code);
    }
  }

  // 호텔 상세 조회: GET /api/hotels/{idx}
  if (str_starts_with($path, 'hotels/') && $method === 'GET') {
    $u = requireApproved();
    $idx = (int)substr($path, 7); // "hotels/" 이후
    if ($idx <= 0) jsonOut(['error' => 'invalid_id'], 400);
    $r = hotelDetailRequest($idx);
    if ($r['ok']) {
      jsonOut(['ok' => true, 'hotel' => $r['data']]);
    } else {
      $code = match($r['error']) {
        'not_found' => 404,
        'not_configured' => 503,
        'unreachable' => 502,
        default => 500
      };
      jsonOut(['error' => $r['error']], $code);
    }
  }

  jsonOut(['error' => 'not_found', 'path' => $path], 404);
}
