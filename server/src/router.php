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
    $st = $pdo->prepare("SELECT * FROM users WHERE email=?");
    $st->execute([strtolower(trim($in['email'] ?? ''))]);
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
    /* 관할지역 수정 (2026-07-22): 직원(sreq/schk)과 관리자(admin)가 저장 가능, krabi 또는 bangkok */
    if (isset($in['region']) && in_array($u['role'], ['sreq', 'schk', 'admin'], true)) {
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
      if (!empty($u['agency_idx'])) jsonOut(['error' => 'external_account'], 403);
      $st = $pdo->prepare("SELECT pass_hash FROM users WHERE id=?");
      $st->execute([$u['id']]);
      $row = $st->fetch();
      if (!$row || !password_verify((string)($in['cur_password'] ?? ''), $row['pass_hash'])) jsonOut(['error' => 'bad_password'], 403);
      if (strlen((string)$in['new_password']) < 6) jsonOut(['error' => 'weak_password'], 422);
      $pdo->prepare("UPDATE users SET pass_hash=? WHERE id=?")
          ->execute([password_hash((string)$in['new_password'], PASSWORD_DEFAULT), $u['id']]);
    }
    jsonOut(['ok' => true, 'user' => publicUser(currentUser())]);
  }

  if ($path === 'agents' && $method === 'GET') {
    requireApproved();
    $rows = $pdo->query("SELECT name, nickname FROM users WHERE role='agent' AND status='approved' ORDER BY name")->fetchAll();
    jsonOut(['agents' => $rows]);
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
    // 알림 (역할 대상, 본인 행동 제외)
    /* 관할권역 필터 (2026-08-24): 권역을 정한 직원은 자기 권역 알림만.
       zone 이 NULL 인 알림(에이전트용 등)과 권역 미설정 직원은 제한 없음. */
    $nsql = "SELECT type,req_no,params,created_at,exclude_user FROM notifications
      WHERE role=? AND (exclude_user IS NULL OR exclude_user<>?)";
    $nargs = [$u['role'], $u['id']];
    if (!empty($u['region'])) { $nsql .= " AND (zone IS NULL OR zone=?)"; $nargs[] = $u['region']; }
    $nsql .= " ORDER BY id DESC LIMIT 20";
    $st = $pdo->prepare($nsql);
    $st->execute($nargs);
    /* 두 권역에 걸친 요청은 알림이 권역별로 들어 있다. 권역을 정하지 않은
       직원에게는 둘 다 걸리므로 같은 알림을 한 번만 보여 준다. */
    $seenNotif = [];
    $items = [];
    $unread = 0;
    foreach ($st->fetchAll() as $n) {
      $dupKey = $n['type'].'|'.($n['req_no'] ?? '').'|'.$n['created_at'];
      if (isset($seenNotif[$dupKey])) continue;
      $seenNotif[$dupKey] = true;
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
        /* 에이전시 정보를 요청 행에 남긴다 (2026-08-25) — 새 요청에만 채운다.
           에이전시 부계정의 직접 등록은 로그인 세션이 기준이다. 브라우저가 값을 바꿔도
           다른 부계정·회사로 저장되지 않는다. 직원의 대신 등록만 화면 선택값을 쓴다.
           이름은 저장 시점 스냅샷이라 이후 이직·개명이 있어도 그대로 남는다. */
        $sessionAgency = $_SESSION['agency'] ?? null;
        if (is_array($sessionAgency) && !empty($sessionAgency['idx'])) {
          $agIdx  = (int)$sessionAgency['idx'];
          $agName = trim((string)($sessionAgency['name'] ?? $u['name'] ?? ''));
          $paIdx  = isset($sessionAgency['parent_idx']) && $sessionAgency['parent_idx'] !== null
            ? (int)$sessionAgency['parent_idx'] : null;
          $paName = trim((string)($sessionAgency['parent_agent_name'] ?? ''));
        } else {
          $agIdx  = isset($req['agencyIdx'])       && $req['agencyIdx'] !== ''       ? (int)$req['agencyIdx'] : null;
          $agName = isset($req['agencyName'])      ? trim((string)$req['agencyName'])      : '';
          $paIdx  = isset($req['agencyParentIdx']) && $req['agencyParentIdx'] !== '' ? (int)$req['agencyParentIdx'] : null;
          $paName = isset($req['agencyParentName'])? trim((string)$req['agencyParentName']): '';
          if ($paName === '') $paName = trim((string)($req['agent'] ?? '')); /* 화면에서 고른 에이전트 이름 */
        }
        $pdo->prepare("INSERT INTO requests (id,no,payload,deleted,created_by,updated_at,updated_by,
              agency_idx,agency_name,agency_parent_idx,agency_parent_name) VALUES (?,?,?,0,?,?,?,?,?,?,?)")
            ->execute([$id, (int)$req['no'], json_encode($req, JSON_UNESCAPED_UNICODE), $u['id'], nowMs(), $u['id'],
              $agIdx, ($agName !== '' ? mb_substr($agName, 0, 120) : null),
              $paIdx, ($paName !== '' ? mb_substr($paName, 0, 190) : null)]);
      } else {
        /* 동시 편집 안전장치 (2026-07-20):
           - 명명 잠금(GET_LOCK)으로 같은 요청의 동시 UPDATE를 직렬화
           - ws는 필드 단위로 병합해, 다른 기기가 보낸 오래된(빈) payload가 확인자의 답변을 지우지 못하게 함
           - status는 뒤로 가지 않음(answered → requested 강등 방지) */
        $pdo->prepare("SELECT GET_LOCK(?, 5)")->execute(["rc_" . $id]);
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
        } finally {
          $pdo->prepare("SELECT RELEASE_LOCK(?)")->execute(["rc_" . $id]);
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
  /* ---------- 공유 링크 (2026-08-26) ----------
     「링크 복사」가 요청 전체를 URL 에 밀어 넣어 2,000자가 넘던 것을 짧은 코드로 바꾼다.
     저장하는 것은 복사 시점의 스냅샷이다 — 나중에 요청이 바뀌어도 링크는 그대로다. */
  if ($path === 'share' && $method === 'POST') {
    $u = requireApproved();
    $req = $in['req'] ?? null;
    if (!is_array($req) || !isset($req['id'])) jsonOut(['error' => 'bad_request'], 400);

    /* 요청번호는 사람이 읽으라고 넣는다. 코드에는 기호를 빼고 담는다 (A-0001E → A0001E) */
    $reqNo = reqNoStr($req);
    $noPart = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $reqNo));
    $day = (new DateTimeImmutable('now', new DateTimeZone('Asia/Bangkok')))->format('Ymd');

    /* 뒤 4자 — 번호를 바꿔 남의 요청을 열어보지 못하게. 헷갈리는 0·O·1·I 는 뺀다 */
    $alpha = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    $json = json_encode($req, JSON_UNESCAPED_UNICODE);
    $code = '';
    for ($try = 0; $try < 8; $try++) {
      $tail = '';
      for ($i = 0; $i < 4; $i++) $tail .= $alpha[random_int(0, strlen($alpha) - 1)];
      $cand = $day . '-' . $noPart . '-' . $tail;
      $hit = $pdo->prepare("SELECT 1 FROM shares WHERE code=?");
      $hit->execute([$cand]);
      if (!$hit->fetchColumn()) { $code = $cand; break; }
    }
    if ($code === '') jsonOut(['error' => 'code_collision'], 500);

    $pdo->prepare("INSERT INTO shares (code,req_no,payload,created_by,created_at) VALUES (?,?,?,?,?)")
        ->execute([$code, $reqNo, $json, $u['id'], nowMs()]);
    jsonOut(['ok' => true, 'code' => $code, 'reqNo' => $reqNo]);
  }
  /* 링크를 받은 사람은 로그인하지 않았을 수 있다 — 읽기는 인증을 요구하지 않는다.
     코드 뒤 4자를 모르면 열 수 없다는 것이 이 링크의 자물쇠다. */
  if ($path === 'share' && $method === 'GET') {
    $code = trim((string)($_GET['code'] ?? ''));
    if ($code === '' || !preg_match('/^[0-9]{8}-[A-Z0-9]{1,16}-[A-Z0-9]{4}$/', $code))
      jsonOut(['error' => 'bad_code'], 400);
    $st = $pdo->prepare("SELECT payload,req_no,created_at FROM shares WHERE code=?");
    $st->execute([$code]);
    $row = $st->fetch();
    if (!$row) jsonOut(['error' => 'not_found'], 404);
    jsonOut(['ok' => true, 'req' => json_decode($row['payload'], true),
             'reqNo' => $row['req_no'], 'createdAt' => (int)$row['created_at']]);
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
    /* agency_parent_name = 소속 에이전시 이름, agency_login_id = 니르바나 부계정 아이디 (2026-08-26)
       관리자 목록에서 「에이전트」 대신 회사명을 보여 주고, 합성 이메일 대신 실제 아이디를 쓰기 위함 */
    $rows = $pdo->query("SELECT id,name,email,role,status,lang,telegram_chat_id,off_days,created_at,
        agency_parent_name,agency_login_id FROM users ORDER BY status='pending' DESC, id DESC")->fetchAll();
    $superEmail = strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local'));
    foreach ($rows as &$r) {
      $r['tg'] = !empty($r['telegram_chat_id']);
      $r['super'] = (strtolower((string)$r['email']) === $superEmail);
      $r['off_days'] = decodeOffDays($r['off_days'] ?? '');
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
  /* 비밀번호 재발급 (2026-08-27)
     직원은 자기 비밀번호를 회원정보에서 직접 바꾼다. 그러다 잊으면 아무도 모른다 —
     저장된 것은 해시라 관리자도 원래 값을 볼 수 없다. 그래서 되돌리는 대신
     관리자가 임시 비밀번호를 새로 정해 전달하고, 직원이 다시 바꾸게 한다.
     에이전트(부계정)는 대상이 아니다 — 그쪽 비밀번호는 니르바나에서만 발급한다. */
  if ($path === 'admin/reset-password' && $method === 'POST') {
    $me = requireAdmin();
    $id = (int)($in['id'] ?? 0);
    $pw = (string)($in['password'] ?? '');
    if (!$id || strlen($pw) < 6) jsonOut(['error' => 'invalid_input'], 422);

    $st = $pdo->prepare("SELECT id,email,role,agency_idx FROM users WHERE id=?");
    $st->execute([$id]);
    $t = $st->fetch();
    if (!$t) jsonOut(['error' => 'not_found'], 404);

    /* 니르바나가 관리하는 계정은 손대지 않는다 */
    if ($t['role'] === 'agent' || !empty($t['agency_idx'])) jsonOut(['error' => 'external_account'], 403);
    if (!in_array($t['role'], ['sreq', 'schk', 'admin'], true)) jsonOut(['error' => 'not_staff'], 403);

    /* 최고관리자 계정은 본인만 바꿀 수 있다 */
    $superEmail = strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local'));
    $isSuperTarget = (strtolower((string)$t['email']) === $superEmail);
    if ($isSuperTarget && (int)$me['id'] !== (int)$t['id']) jsonOut(['error' => 'forbidden_super'], 403);

    $pdo->prepare("UPDATE users SET pass_hash=? WHERE id=?")
        ->execute([password_hash($pw, PASSWORD_DEFAULT), $id]);
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
  /* 관리자 통계 (2026-07-18): 요청 payload 집계. 확정 = 확인자 답변 완료 건 */
  if ($path === 'admin/stats' && $method === 'GET') {
    requireAdmin();
    $byAgent = []; $byAgentMgr = []; $byRequester = []; $byChecker = [];
    $tot = ['requests' => 0, 'confirmed' => 0, 'quoteSent' => 0, 'contracted' => 0];
    foreach (allRequests($pdo) as $p) {
      $answered = (($p['status'] ?? '') === 'answered');
      $confirmed = $answered && !empty($p['answerComplete']); // 확인자 답변 완료 = 확정
      $quoteSent = !empty($p['quoteSent']);
      $contracted = !empty($p['contractedAt']);
      $tot['requests']++;
      if ($confirmed) $tot['confirmed']++;
      if ($quoteSent) $tot['quoteSent']++;
      if ($contracted) $tot['contracted']++;
      $none = '(미지정)';
      statBump($byAgent, trim((string)($p['agent'] ?? '')) ?: $none, $confirmed, $quoteSent, $contracted);
      statBump($byAgentMgr, trim((string)($p['agentManager'] ?? '')) ?: $none, $confirmed, $quoteSent, $contracted);
      statBump($byRequester, trim((string)($p['registrant'] ?? '')) ?: $none, $confirmed, $quoteSent, $contracted);
      if ($answered) statBump($byChecker, trim((string)($p['manager'] ?? '')) ?: $none, $confirmed, $quoteSent, $contracted);
    }
    $fmt = function (array $arr): array {
      $out = [];
      foreach ($arr as $k => $v) $out[] = array_merge(['name' => $k], $v);
      usort($out, fn($a, $b) => ($b['confirmed'] <=> $a['confirmed']) ?: ($b['requests'] <=> $a['requests']));
      return $out;
    };
    jsonOut([
      'total' => $tot,
      'agents' => $fmt($byAgent),
      'agentMgrs' => $fmt($byAgentMgr),
      'requesters' => $fmt($byRequester),
      'checkers' => $fmt($byChecker),
    ]);
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
      jsonOut(['ok' => true, 'agency' => $r['data']]);
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
