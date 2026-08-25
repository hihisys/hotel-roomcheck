<?php
/* ===== 에이전시 부계정 로그인 연동 (2026-07-17) =====
   외부(사내) 시스템의 인증 API를 서버 사이드에서 호출한다.
   POST {AGENCY_API_BASE}{AGENCY_API_PATH}  body: {login_id, password}

   환경 변수 (설정값):
     AGENCY_API_BASE    필수. 예: https://our-domain.example.com  (미설정 시 기능 비활성 503)
     AGENCY_API_PATH    기본 /api2/agency-sub-accounts/login
     AGENCY_API_MODE    json(기본) | form  — form은 application/x-www-form-urlencoded 전송
     AGENCY_API_TIMEOUT 초 단위, 기본 10

   보안 규칙: password는 어떤 경우에도 로그·응답·DB에 남기지 않는다. */
require_once __DIR__ . '/lib.php';

/* 외부 인증 API 호출. 반환:
   ['ok'=>true,  'data'=>array]                          — HTTP 200 + success===true
   ['ok'=>false, 'error'=>string, 'status'=>int|null]    — 그 외 전부 */
function agencyAuthenticate(string $loginId, #[\SensitiveParameter] string $password): array {
  $base = env('AGENCY_API_BASE');
  if (!$base) return ['ok' => false, 'error' => 'not_configured', 'status' => null];
  $url = rtrim($base, '/') . env('AGENCY_API_PATH', '/api2/agency-sub-accounts/login');

  $mode = env('AGENCY_API_MODE', 'json');
  $payload = ['login_id' => $loginId, 'password' => $password];
  if ($mode === 'form') {                    // JSON POST가 어려운 환경용 대체 모드
    $body = http_build_query($payload);
    $contentType = 'application/x-www-form-urlencoded';
  } else {
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $contentType = 'application/json';
  }

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => ['Content-Type: ' . $contentType, 'Accept: application/json'],
    CURLOPT_USERAGENT => env('AGENCY_API_UA', 'RoomcheckServer/1.0'), // cafe24 보안모듈이 UA 없으면 406 차단
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => (int)env('AGENCY_API_TIMEOUT', '10'),
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
  ]);
  $res = curl_exec($ch);
  $errno = curl_errno($ch);
  $http = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  curl_close($ch);
  unset($body, $payload);                    // 평문 비밀번호 참조 제거

  if ($res === false || $errno !== 0) {      // 네트워크 오류·타임아웃 (password 로그 금지)
    error_log("agency-login upstream unreachable: curl errno=$errno login_id=$loginId");
    return ['ok' => false, 'error' => 'unreachable', 'status' => null];
  }

  $j = json_decode($res, true);

  if ($http === 401) {                       // 인증 실패 (아이디/비밀번호 불일치)
    return ['ok' => false, 'error' => 'bad_credentials', 'status' => 401,
            'message' => is_array($j) ? ($j['message'] ?? null) : null];
  }
  // 성공 판정은 HTTP 200 && success===true 둘 다 만족할 때만
  if ($http === 200 && is_array($j) && ($j['success'] ?? null) === true
      && is_array($j['data'] ?? null) && isset($j['data']['idx'])) {
    return ['ok' => true, 'data' => $j['data']];
  }

  error_log("agency-login upstream bad response: http=$http login_id=$loginId");
  return ['ok' => false, 'error' => 'bad_response', 'status' => $http];
}

/* POST api/agency-login 라우트 본체 */
function agencyLoginRoute(PDO $pdo, array $in): void {
  startSession();
  $loginId = trim((string)($in['login_id'] ?? ''));
  $password = (string)($in['password'] ?? '');
  if ($loginId === '' || $password === '') jsonOut(['error' => 'invalid_input'], 422);

  $r = agencyAuthenticate($loginId, $password);
  unset($password, $in);

  if (!$r['ok']) {
    switch ($r['error']) {
      case 'bad_credentials': jsonOut(['error' => 'bad_credentials'], 401);       // 401 → 로그인 실패 표시
      case 'not_configured':  jsonOut(['error' => 'agency_disabled'], 503);       // 설정값 미등록
      case 'unreachable':     jsonOut(['error' => 'agency_unreachable'], 502);    // 네트워크/타임아웃
      default:                jsonOut(['error' => 'agency_bad_response'], 502);   // 200이지만 success!==true 등
    }
  }

  $d = $r['data'];
  $idx = (int)$d['idx'];
  $agency = [                                 // 세션에 저장할 인증 정보 (요구사항 3)
    'idx' => $idx,
    'parent_idx' => isset($d['parent_idx']) ? (int)$d['parent_idx'] : null,
    'parent_agent_name' => trim((string)($d['parent_agent_name'] ?? '')),
    'kind' => (string)($d['kind'] ?? ''),
    'login_id' => (string)($d['login_id'] ?? $loginId),
    'nickname' => (string)($d['nickname'] ?? ''),
  ];
  $name = trim((string)($d['name'] ?? '')) ?: $agency['login_id'];
  $agency['name'] = $name;

  // 로컬 사용자 자동 생성/갱신 (role=agent, 승인 상태) — 비밀번호는 저장하지 않음
  $st = $pdo->prepare("SELECT * FROM users WHERE agency_idx=?");
  $st->execute([$idx]);
  $u = $st->fetch();
  if (!$u) {
    $email = "agency-$idx@agency.local";      // 이메일 로그인 불가한 합성 주소
    $pdo->prepare("INSERT INTO users (name,email,pass_hash,role,status,lang,created_at,
        agency_idx,agency_parent_idx,agency_kind,agency_login_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      ->execute([$name, $email, '!agency-external-auth', 'agent', 'approved', 'ko', nowMs(),
        $idx, $agency['parent_idx'], $agency['kind'], $agency['login_id']]);
    $st->execute([$idx]);
    $u = $st->fetch();
  } else {
    if ($u['status'] === 'rejected') jsonOut(['error' => 'rejected'], 403);  // 관리자가 중지한 계정
    $pdo->prepare("UPDATE users SET name=?, agency_parent_idx=?, agency_kind=?, agency_login_id=? WHERE id=?")
        ->execute([$name, $agency['parent_idx'], $agency['kind'], $agency['login_id'], $u['id']]);
  }

  session_regenerate_id(true);
  $_SESSION['uid'] = (int)$u['id'];
  $_SESSION['agency'] = $agency;              // 부계정·소속 에이전시 식별값과 이름을 세션에 보관
  $u['name'] = $name;
  jsonOut(['ok' => true, 'user' => publicUser($u)]);
}

/* ===== 에이전시 목록/상세 조회 API (2026-07-22) ===== */

/* 외부 에이전시 목록 조회 API 호출
   POST {AGENCY_API_BASE}/api2/agencies
   Request: {type, active, search}
   Response: {success, message, status, data: [{idx, mode, level, parents, name, phone, email, ...}]}
*/
function agencyListRequest(?string $type = null, ?string $active = null, ?string $search = null): array {
  $base = env('AGENCY_API_BASE');
  if (!$base) return ['ok' => false, 'error' => 'not_configured'];

  $url = rtrim($base, '/') . '/api2/agencies';
  $payload = [];
  if ($type !== null) $payload['type'] = $type;
  if ($active !== null) $payload['active'] = $active;
  if ($search !== null) $payload['search'] = $search;

  $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_USERAGENT => env('AGENCY_API_UA', 'RoomcheckServer/1.0'),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => (int)env('AGENCY_API_TIMEOUT', '10'),
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
  ]);
  $res = curl_exec($ch);
  $errno = curl_errno($ch);
  $http = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  curl_close($ch);

  if ($res === false || $errno !== 0) {
    error_log("agency-list curl error: errno=$errno");
    return ['ok' => false, 'error' => 'unreachable', 'http' => null];
  }

  $j = json_decode($res, true);
  if ($http === 200 && is_array($j) && ($j['success'] ?? null) === true && is_array($j['data'] ?? null)) {
    return ['ok' => true, 'data' => $j['data']];
  }

  error_log("agency-list upstream error: http=$http");
  return ['ok' => false, 'error' => 'bad_response', 'http' => $http];
}

/* 외부 에이전시 상세 조회 API 호출
   POST {AGENCY_API_BASE}/api2/agencies/{idx}
   Request: {}
   Response: {success, message, status, data: {agency, managers, bank_accounts, contracts}}
*/
function agencyDetailRequest(int $idx): array {
  $base = env('AGENCY_API_BASE');
  if (!$base) return ['ok' => false, 'error' => 'not_configured'];

  $url = rtrim($base, '/') . '/api2/agencies/' . $idx;
  $body = json_encode([], JSON_UNESCAPED_UNICODE);

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_USERAGENT => env('AGENCY_API_UA', 'RoomcheckServer/1.0'),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => (int)env('AGENCY_API_TIMEOUT', '10'),
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
  ]);
  $res = curl_exec($ch);
  $errno = curl_errno($ch);
  $http = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  curl_close($ch);

  if ($res === false || $errno !== 0) {
    error_log("agency-detail curl error: errno=$errno idx=$idx");
    return ['ok' => false, 'error' => 'unreachable', 'http' => null];
  }

  $j = json_decode($res, true);

  // 404: 에이전시 없음
  if ($http === 404) {
    return ['ok' => false, 'error' => 'not_found', 'http' => 404];
  }

  // 200 + success=true 성공
  if ($http === 200 && is_array($j) && ($j['success'] ?? null) === true && is_array($j['data'] ?? null)) {
    return ['ok' => true, 'data' => $j['data']];
  }

  error_log("agency-detail upstream error: http=$http idx=$idx");
  return ['ok' => false, 'error' => 'bad_response', 'http' => $http];
}
