<?php
/* ===== 공용 헬퍼: 세션, 응답, 권한 ===== */
require_once __DIR__ . '/db.php';

function startSession(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;
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
/* ── 관할권역 (2026-08-24) ──────────────────────────────────────────────
   직원의 region 은 단일 지역이 아니라 권역이다 (profile.html 참조).
     krabi   = 카오락 + 푸켓 + 크라비
     bangkok = 방콕 + 파타야
   호텔의 지역(rows[].region)에서 권역을 뽑아 낸다. 표에 없는 지역
   (사무이·치앙마이 등)은 푸켓·카오락 담당(krabi)이 맡는다.

   전에는 요청에 region 을 넣는 코드가 없어 $p['region'] 이 늘 비었고,
   그 결과 직원이 '본인이 만든 요청'만 보였다. 이제 payload 를 읽을 때마다
   행에서 직접 계산하므로 예전에 저장된 요청도 그대로 살아난다. */
const ZONE_DEFAULT = 'krabi';
function regionZone(?string $region): string {
  $r = strtolower(trim((string)$region));
  $r = str_replace([' ', '-', '_'], '', $r);
  static $map = [
    'phuket' => 'krabi',   '푸켓'   => 'krabi',
    'khaolak' => 'krabi',  '카오락' => 'krabi',
    'krabi' => 'krabi',    '크라비' => 'krabi',
    'bangkok' => 'bangkok','방콕'   => 'bangkok',
    'pattaya' => 'bangkok','파타야' => 'bangkok',
  ];
  if ($r === '' || $r === '전체' || $r === 'all') return '';   // 지역 미지정 → 권역 없음
  return $map[$r] ?? ZONE_DEFAULT;                            // 표에 없으면 krabi 담당
}
/* 요청 한 건이 걸쳐 있는 권역 전부. 기본 호텔과 추가 호텔을 함께 본다
   (다중호텔 숙박이면 카오락→방콕처럼 두 권역에 걸칠 수 있다). */
function requestZones(array $p): array {
  $zones = [];
  foreach (($p['rows'] ?? []) as $row) {
    if (!is_array($row)) continue;
    $z = regionZone($row['region'] ?? null);
    if ($z !== '') $zones[$z] = true;
    foreach (($row['checkRequests'] ?? []) as $c) {
      if (!is_array($c)) continue;
      $z = regionZone($c['region'] ?? null);
      if ($z !== '') $zones[$z] = true;
    }
  }
  if (!$zones) $zones[ZONE_DEFAULT] = true;   /* 어느 행에도 지역이 없으면 기본 담당에게 */
  return array_keys($zones);
}
/* 이 사용자가 이 요청을 볼 수 있는 권역인가.
   관할지역을 정하지 않은 직원은 제한 없이 전부 본다. */
function zoneVisible(?string $userRegion, array $p): bool {
  if (!$userRegion) return true;
  return in_array($userRegion, requestZones($p), true);
}

/* 권한 기반 요청 필터링 (2026-07-22): 현재 사용자가 볼 수 있는 요청만 반환
   - 최고관리자(super): 전체 요청
   - 일반 사용자: 본인 관할권역에 걸친 요청 + 본인이 요청한 것 (관할지역 미설정이면 전부)
   - 에이전트: 모든 요청 (지역 제한 없음) */
function allRequests(PDO $pdo, ?array $currentUser = null): array {
  $out = [];
  $isSuperAdmin = $currentUser && $currentUser['role'] === 'admin' &&
                  (strtolower((string)($currentUser['email'] ?? '')) === strtolower(env('ADMIN_EMAIL', 'admin@nirvana.local')));
  $userRegion = $currentUser['region'] ?? null;
  $userId = (int)($currentUser['id'] ?? 0);
  $userRole = $currentUser['role'] ?? '';

  // 최고관리자는 모든 요청 조회 가능, 에이전트도 지역 제한 없음
  if ($isSuperAdmin || $userRole === 'agent') {
    $query = "SELECT payload FROM requests WHERE deleted=0";
  } else {
    // 일반 직원: 본인 지역 또는 본인이 요청한 것
    $query = "SELECT payload, created_by FROM requests WHERE deleted=0";
  }

  $st = $pdo->query($query);
  foreach ($st->fetchAll() as $r) {
    $p = json_decode($r['payload'], true);
    if (!$p) continue;

    // 최고관리자나 에이전트: 모든 요청 포함
    if ($isSuperAdmin || $userRole === 'agent') {
      $out[] = $p;
      continue;
    }

    // 직원(sreq/schk): 본인이 요청한 것은 항상 포함
    $createdBy = (int)($r['created_by'] ?? 0);
    if ($createdBy > 0 && $createdBy === $userId) {
      $out[] = $p;
      continue;
    }

    // 직원: 본인 관할권역에 걸친 요청만 포함 (관할지역 미설정이면 전부)
    if (in_array($userRole, ['sreq', 'schk'], true)) {
      if (zoneVisible($userRegion, $p)) {
        $out[] = $p;
      }
    }
  }

  return $out;
}
