<?php
/* ===== 공용 헬퍼: 세션, 응답, 권한 ===== */
require_once __DIR__ . '/db.php';

/* ── DB 세션 핸들러 (2026-08-30) ──────────────────────────────────
   세션을 컨테이너 로컬 파일이 아니라 DB 에 저장한다. 이유는 db.php 의
   sessions 테이블 주석 참조. 만료는 30일 고정 — 요청마다 달라지는
   gc_maxlifetime 을 그대로 쓰면 자동로그인(30일) 세션을 짧은 세션의
   기준으로 지워 버린다. */
final class DbSessionHandler implements SessionHandlerInterface {
  private const KEEP_SEC = 2592000;   // 30일
  public function open(string $path, string $name): bool { return true; }
  public function close(): bool { return true; }
  public function read(string $sid): string {
    try {
      $st = db()->prepare("SELECT data FROM sessions WHERE sid=?");
      $st->execute([$sid]);
      $r = $st->fetch();
      return $r ? (string)$r['data'] : '';
    } catch (Throwable $e) { error_log('session read: ' . $e->getMessage()); return ''; }
  }
  public function write(string $sid, string $data): bool {
    try {
      $pdo = db();
      $sql = isMySQL($pdo)
        ? "INSERT INTO sessions (sid,data,updated_at) VALUES (?,?,?)
           ON DUPLICATE KEY UPDATE data=VALUES(data), updated_at=VALUES(updated_at)"
        : "INSERT INTO sessions (sid,data,updated_at) VALUES (?,?,?)
           ON CONFLICT(sid) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at";
      $pdo->prepare($sql)->execute([$sid, $data, nowMs()]);
      return true;
    } catch (Throwable $e) { error_log('session write: ' . $e->getMessage()); return false; }
  }
  public function destroy(string $sid): bool {
    try { db()->prepare("DELETE FROM sessions WHERE sid=?")->execute([$sid]); } catch (Throwable $e) {}
    return true;
  }
  #[\ReturnTypeWillChange]
  public function gc(int $maxLife) {
    try {
      $cut = nowMs() - self::KEEP_SEC * 1000;
      db()->prepare("DELETE FROM sessions WHERE updated_at < ?")->execute([$cut]);
    } catch (Throwable $e) {}
    return 1;
  }
}
function startSession(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;
  /* DB 세션 (2026-08-30). 실패하면 기본 파일 세션으로 떨어진다 — 로컬 개발이나
     DB 일시 장애에도 로그인 화면 자체는 뜨게 하기 위함이다. */
  try { session_set_save_handler(new DbSessionHandler(), true); }
  catch (Throwable $e) { error_log('session handler: ' . $e->getMessage()); }
  $secure = (($_SERVER['HTTPS'] ?? '') !== '' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
  $remember = (($_COOKIE['rc_remember'] ?? '') === '1'); // 자동 로그인 시 세션 30일 유지
  if ($remember) ini_set('session.gc_maxlifetime', '2592000');
  session_set_cookie_params(['lifetime' => $remember ? 2592000 : 0, 'path' => '/',
    'httponly' => true, 'samesite' => 'Lax', 'secure' => $secure]);
  session_name('rc_session');
  session_start();
}
/* 자동 로그인(remember-me) 쿠키 설정/해제 — 로그인/로그아웃 시 호출 (2026-07-18) */
function setRememberCookie(bool $on): void {
  $secure = (($_SERVER['HTTPS'] ?? '') !== '' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
  $opt = ['path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => $secure];
  setcookie('rc_remember', $on ? '1' : '', ['expires' => $on ? time() + 2592000 : time() - 3600] + $opt);
  if (session_status() === PHP_SESSION_ACTIVE) { // 현재 세션 쿠키 만료도 즉시 반영
    setcookie(session_name(), session_id(), ['expires' => $on ? time() + 2592000 : 0] + $opt);
  }
}
function jsonOut($data, int $code = 200): never {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}
function jsonIn(): array {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw ?: 'null', true);
  return is_array($j) ? $j : [];
}
function currentUser(): ?array {
  startSession();
  $uid = $_SESSION['uid'] ?? null;
  if (!$uid) return null;
  $st = db()->prepare("SELECT id,name,email,role,status,lang,telegram_chat_id,notif_read_at,phone,nickname,bank_account,agency_idx,agency_parent_idx,agency_kind,agency_login_id,off_days,region FROM users WHERE id=?");
  $st->execute([$uid]);
  $u = $st->fetch();
  return $u ?: null;
}
function requireApproved(): array {
  $u = currentUser();
  if (!$u) jsonOut(['error' => 'unauthenticated'], 401);
  if ($u['status'] !== 'approved') jsonOut(['error' => 'pending'], 403);
  return $u;
}
function requireAdmin(): array {
  $u = requireApproved();
  if ($u['role'] !== 'admin') jsonOut(['error' => 'forbidden'], 403);
  return $u;
}
/* off_days JSON 컬럼 디코드 공용 헬퍼 (2026-07-21):
   dates=최종 확정 휴무일 목록, weekdays=반복 요일(미사용 예약 필드),
   work_overrides=기본 휴무일(토/일/공휴일)인데 "근무로 지정"한 날짜 — 휴일 등록 UI의 기본값 로직에 사용 */
function decodeOffDays($j): array {
  $o = json_decode((string)$j, true);
  return [
    'dates' => array_values((array)($o['dates'] ?? [])),
    'weekdays' => array_map('intval', (array)($o['weekdays'] ?? [])),
    'work_overrides' => array_values((array)($o['work_overrides'] ?? [])),
  ];
}
function publicUser(?array $u): ?array {
  if (!$u) return null;
  $out = ['id' => (int)$u['id'], 'name' => $u['name'], 'email' => $u['email'],
    'role' => $u['role'], 'status' => $u['status'], 'lang' => $u['lang'],
    'tg' => !empty($u['telegram_chat_id']),
    'phone' => $u['phone'] ?? '', 'nickname' => $u['nickname'] ?? '', 'bank_account' => $u['bank_account'] ?? '', 'region' => $u['region'] ?? null,
    'super' => (strtolower((string)($u['email'] ?? '')) === strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local'))),
    'ext' => !empty($u['agency_idx']),
    'off_days' => decodeOffDays($u['off_days'] ?? '')];
  // 에이전시 부계정으로 로그인한 세션이면 인증 정보 노출 (비밀번호 관련 값 없음)
  if (!empty($_SESSION['agency'])) $out['agency'] = $_SESSION['agency'];
  return $out;
}
/* 요청 payload에서 표시용 요약 추출 */
function reqNoStr(array $p): string { $pfx = !empty($p['direct']) ? 'D-' : 'A-'; $n = (int)($p['no'] ?? 0); return $pfx . strtoupper(str_pad(base_convert((string)$n, 10, 36), 5, '0', STR_PAD_LEFT)); }
function reqHotels(array $p): string {
  $names = array_map(fn($r) => $r['hotel'] ?: '-', $p['rows'] ?? []);
  return implode(' · ', array_slice($names, 0, 4));
}
function reqDates(array $p): string {
  $rows = $p['rows'] ?? [];
  if (!$rows) return '';
  return ($p['startDate'] ?? '') . ' ~';
}
/* 미처리 판정: 확인자 기준(요청됨 또는 부분답변), 요청자 기준(견적 요청됨 미발송) */
function isPendingForChecker(array $p): bool {
  if (!empty($p['direct'])) return false;
  if (($p['status'] ?? '') === 'requested') return true;
  return ($p['status'] ?? '') === 'answered' && empty($p['answerComplete']);
}
function isPendingForRequester(array $p): bool {
  return !empty($p['quoteRequested']) && empty($p['quoteSent']);
}
/* ── 관할권역 (2026-08-24, 2026-08-27 개정) ────────────────────────────
   직원의 region 은 단일 지역이 아니라 권역이다 (profile.html 참조).

     khaolak 「카오락 + 푸켓」 = 카오락 · 푸켓 · 크라비 · 사무이 · 방콕
     bangkok 「방콕 + 파타야」 = 방콕 · 파타야

   ⚠️ 방콕은 두 권역 모두에 속한다 (2026-08-27, 사용자 결정).
      방콕 호텔이 들어간 요청은 양쪽 담당자에게 모두 보이고 알림도 양쪽에 간다.
      그래서 한 지역이 권역 하나가 아니라 여럿을 돌려준다 — regionZone() 이
      문자열 하나를 돌려주던 것을 regionZones() 배열로 바꾼 이유다.

   표에 없는 지역(치앙마이 등)은 「카오락 + 푸켓」 담당이 맡는다 (사용자 결정 4번).

   전에는 요청에 region 을 넣는 코드가 없어 $p['region'] 이 늘 비었고,
   그 결과 직원이 '본인이 만든 요청'만 보였다. 이제 payload 를 읽을 때마다
   행에서 직접 계산하므로 예전에 저장된 요청도 그대로 살아난다. */
/* 권역 코드 (2026-08-30: krabi → khaolak 로 이름 변경).
   「카오락 + 푸켓」 권역인데 코드가 krabi 라 크라비 한 지역만 뜻하는 것처럼 보였다.
   값 이름만 바꾼 것이고 뜻은 그대로다. 예전에 저장된 'krabi' 는 지역명 크라비로
   해석되어 결국 같은 권역이 되므로 그대로 두어도 동작한다 (db.php 에서 일괄 변환). */
const ZONE_DEFAULT = 'khaolak';
function regionZones(?string $region): array {
  $r = strtolower(trim((string)$region));
  $r = str_replace([' ', '-', '_'], '', $r);
  static $map = [
    'phuket'   => ['khaolak'],            '푸켓'   => ['khaolak'],
    'khaolak'  => ['khaolak'],            '카오락' => ['khaolak'],
    'krabi'    => ['khaolak'],            '크라비' => ['khaolak'],
    'samui'    => ['khaolak'],            '사무이' => ['khaolak'],
    'kohsamui' => ['khaolak'],            '코사무이' => ['khaolak'],
    'bangkok'  => ['khaolak', 'bangkok'], '방콕'   => ['khaolak', 'bangkok'],
    'pattaya'  => ['bangkok'],          '파타야' => ['bangkok'],
  ];
  if ($r === '' || $r === '전체' || $r === 'all') return [];   // 지역 미지정 → 권역 없음
  return $map[$r] ?? [ZONE_DEFAULT];                          // 표에 없으면 카오락+푸켓 담당
}
/* 예전 이름 — 한 지역이 여러 권역에 속할 수 있게 되면서 배열이 기준이 되었다.
   남아 있는 호출부를 위해 첫 권역만 돌려준다. 새 코드는 regionZones() 를 쓴다. */
function regionZone(?string $region): string {
  $z = regionZones($region);
  return $z ? $z[0] : '';
}
/* 요청 한 건이 걸쳐 있는 권역 전부. 기본 호텔과 추가 호텔을 함께 본다
   (다중호텔 숙박이면 카오락→방콕처럼 두 권역에 걸칠 수 있다). */
function requestZones(array $p): array {
  $zones = [];
  foreach (($p['rows'] ?? []) as $row) {
    if (!is_array($row)) continue;
    foreach (regionZones($row['region'] ?? null) as $z) $zones[$z] = true;
    foreach (($row['checkRequests'] ?? []) as $c) {
      if (!is_array($c)) continue;
      foreach (regionZones($c['region'] ?? null) as $z) $zones[$z] = true;
    }
  }
  if (!$zones) $zones[ZONE_DEFAULT] = true;   /* 어느 행에도 지역이 없으면 기본 담당에게 */
  return array_keys($zones);
}
/* 이 사용자가 이 요청을 볼 수 있는 권역인가.
   관할지역을 정하지 않은 직원은 제한 없이 전부 본다. */
/* 직원의 region 에는 권역 코드(khaolak | bangkok)가 들어간다 (admin.html 의 선택값).
   예전에는 지역명('푸켓' 등)이 저장된 적이 있어 그 값도 권역으로 바꿔 준다.
   ⚠️ 'bangkok' 은 권역 코드로 먼저 해석한다 — 지역명 '방콕'은 두 권역에 걸치지만,
      권역 코드 'bangkok'(방콕+파타야 담당)은 카오락 요청을 받으면 안 된다.
      regionZones('bangkok') 를 그대로 쓰면 ['khaolak','bangkok'] 이 되어
      방콕 담당에게 카오락 요청까지 가 버린다 (2026-08-30 사용자 지적). */
function userZones(?string $region): array {
  $r = strtolower(trim((string)$region));
  if ($r === '' || $r === '전체' || $r === 'all') return [];   // 제한 없음
  if (in_array($r, ['khaolak', 'bangkok'], true)) return [$r];   // 권역 코드
  return regionZones($r);                                      // 예전 지역명
}
/* 입력받은 관할권역 값을 정식 코드로 다듬는다 (2026-08-30).
   예전 화면이 캐시되어 'krabi' 를 보내는 경우가 있어 그대로 받아 khaolak 으로 바꾼다.
   빈 값·모르는 값은 '' (제한 없음)을 돌려주고, 호출부에서 오류로 처리할지 정한다. */
function normZone($v): string {
  $r = strtolower(trim((string)$v));
  if ($r === '' || $r === '전체' || $r === 'all') return '';
  if ($r === 'khaolak' || $r === 'krabi' || $r === '카오락' || $r === '크라비') return 'khaolak';
  if ($r === 'bangkok' || $r === '방콕') return 'bangkok';
  return '';
}
/* 이 사용자의 관할권역이 주어진 권역들과 겹치는가. 관할 미설정이면 전부 해당. */
function zoneMatch(?string $userRegion, array $zones): bool {
  $mine = userZones($userRegion);
  if (!$mine) return true;
  return (bool)array_intersect($mine, $zones);
}
function zoneVisible(?string $userRegion, array $p): bool {
  return zoneMatch($userRegion, requestZones($p));
}

/* 권한 기반 요청 필터링 (2026-07-22, 2026-08-27 개정)
   - 최고관리자(super): 전체 요청
   - 관리자·직원(admin/sreq/schk): 본인 관할권역에 걸친 요청 + 본인이 등록한 것
                                   (관할지역을 정하지 않았으면 전부)
   - 에이전트: 모든 요청 (지역 제한 없음)

   2026-08-27 — 전에는 일반 관리자가 sreq/schk 목록에 들어가지 못해
   '본인이 등록한 것'만 보였다. 관리자도 직원과 같은 규칙을 따르게 고쳤다 (사용자 결정 3번). */
function allRequests(PDO $pdo, ?array $currentUser = null, bool $withMeta = false): array {
  $out = [];
  $isSuperAdmin = $currentUser && $currentUser['role'] === 'admin' &&
                  (strtolower((string)($currentUser['email'] ?? '')) === strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local')));
  $userRegion = $currentUser['region'] ?? null;
  $userId = (int)($currentUser['id'] ?? 0);
  $userRole = $currentUser['role'] ?? '';

  /* 사용자를 넘기지 않은 호출은 시스템 내부용(통계·다이제스트)이라 전체를 돌려준다.
     2026-08-30 — 권한 필터를 넣으면서 $currentUser 가 null 이면 어느 갈래에도
     걸리지 않아 항상 빈 배열이 됐다. 그래서 관리자 통계가 늘 0 으로 보였고
     텔레그램 다이제스트도 집계가 비었다. 필터가 필요한 호출은 $currentUser 를 넘긴다. */
  $systemCall = ($currentUser === null);

  // 최고관리자는 모든 요청 조회 가능, 에이전트도 지역 제한 없음
  /* $withMeta: 통계용. 요청 행에 저장된 에이전시 정보와 등록자 역할을 함께 돌려준다.
     payload(JSON) 안의 값은 화면 입력이라 비어 있을 수 있는데, 이 컬럼들은 저장 시점에
     서버가 세션에서 찍은 값이라 믿을 수 있다 (2026-08-30). */
  $meta = $withMeta ? ", r.agency_name, r.agency_parent_name, u.role AS creator_role" : "";
  $join = $withMeta ? " LEFT JOIN users u ON u.id = r.created_by" : "";
  if ($systemCall || $isSuperAdmin || $userRole === 'agent') {
    $query = "SELECT r.payload$meta FROM requests r$join WHERE r.deleted=0";
  } else {
    // 일반 직원: 본인 지역 또는 본인이 요청한 것
    $query = "SELECT r.payload, r.created_by$meta FROM requests r$join WHERE r.deleted=0";
  }

  $st = $pdo->query($query);
  foreach ($st->fetchAll() as $r) {
    $p = json_decode($r['payload'], true);
    if (!$p) continue;
    if ($withMeta) {
      $p['_agency']       = trim((string)($r['agency_name'] ?? ''));         // 에이전시 부계정 = 담당자
      $p['_agencyParent'] = trim((string)($r['agency_parent_name'] ?? ''));  // 소속 회사 = 에이전트
      $p['_creatorRole']  = (string)($r['creator_role'] ?? '');
    }

    // 시스템 호출·최고관리자·에이전트: 모든 요청 포함
    if ($systemCall || $isSuperAdmin || $userRole === 'agent') {
      $out[] = $p;
      continue;
    }

    // 관리자·직원: 본인이 등록한 것은 관할지역과 무관하게 항상 포함
    $createdBy = (int)($r['created_by'] ?? 0);
    if ($createdBy > 0 && $createdBy === $userId) {
      $out[] = $p;
      continue;
    }

    // 관리자·직원: 본인 관할권역에 걸친 요청만 포함 (관할지역 미설정이면 전부)
    if (in_array($userRole, ['admin', 'sreq', 'schk'], true)) {
      if (zoneVisible($userRegion, $p)) {
        $out[] = $p;
      }
    }
  }

  return $out;
}
