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
function agencyAuthPost(string $url, string $loginId, #[\SensitiveParameter] string $password, string $mode): array {
  $payload = ['login_id' => $loginId, 'password' => $password];
  if ($mode === 'form') {                    // JSON POST가 어려운 환경용 대체 모드 (요구사항 6)
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
    CURLOPT_SSL_VERIFYPEER => true,          // 인증 정보를 보내므로 인증서 검증 필수
    CURLOPT_SSL_VERIFYHOST => 2,
  ]);
  $res = curl_exec($ch);
  $errno = curl_errno($ch);
  $http = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  curl_close($ch);
  unset($body, $payload, $password);         // 평문 비밀번호 참조 즉시 제거 (요구사항 5)

  if ($res === false || $errno !== 0) return ['http' => 0, 'errno' => $errno, 'json' => null];
  return ['http' => $http, 'errno' => 0, 'json' => json_decode($res, true)];
}

function agencyAuthenticate(string $loginId, #[\SensitiveParameter] string $password): array {
  $base = env('AGENCY_API_BASE');
  if (!$base) return ['ok' => false, 'error' => 'not_configured', 'status' => null];
  $url = rtrim($base, '/') . env('AGENCY_API_PATH', '/api2/agency-sub-accounts/login');

  $mode = env('AGENCY_API_MODE', 'json');
  $r = agencyAuthPost($url, $loginId, $password, $mode);

  /* JSON을 받지 못하는 서버(400/406/415)면 폼 전송으로 1회 자동 재시도 (요구사항 6) */
  if ($mode !== 'form' && in_array($r['http'], [400, 406, 415], true)) {
    error_log("agency-login retry as form: http={$r['http']} login_id=$loginId");
    $r = agencyAuthPost($url, $loginId, $password, 'form');
  }
  unset($password);                          // 평문 비밀번호 참조 제거 (로그·응답에 남기지 않음)

  $http = $r['http'];
  $j = $r['json'];

  if ($http === 0) {                         // 네트워크 오류·타임아웃 (password 로그 금지)
    error_log("agency-login upstream unreachable: curl errno={$r['errno']} login_id=$loginId");
    return ['ok' => false, 'error' => 'unreachable', 'status' => null];
  }

  if ($http === 401) {                       // 인증 실패 (아이디/비밀번호 불일치) — 요구사항 4
    return ['ok' => false, 'error' => 'bad_credentials', 'status' => 401,
            'message' => is_array($j) ? ($j['message'] ?? null) : null];
  }

  /* 성공 판정: HTTP 200 && success===true && data.idx 존재 — 셋 다 만족할 때만 (요구사항 2) */
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
    'kind' => (string)($d['kind'] ?? ''),
    'login_id' => (string)($d['login_id'] ?? $loginId),
    'nickname' => (string)($d['nickname'] ?? ''),
  ];
  $name = trim((string)($d['name'] ?? '')) ?: $agency['login_id'];

  // 로컬 사용자 자동 생성/갱신 (role=agent, 승인 상태) — 비밀번호는 저장하지 않음
  $st = $pdo->prepare("SELECT * FROM users WHERE agency_idx=?");
  $st->execute([$idx]);
  $u = $st->fetch();
  if (!$u) {
    $email = "agency-$idx@agency.local";      // 이메일 로그인 불가한 합성 주소
    /* 2026-08-01 변경: 너바나 인증에 성공한 부계정(=등록된 부계정)은 승인 없이 바로 로그인 */
    $pdo->prepare("INSERT INTO users (name,email,pass_hash,role,status,lang,created_at,
        agency_idx,agency_parent_idx,agency_kind,agency_login_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      ->execute([$name, $email, '!agency-external-auth', 'agent', 'approved', 'ko', nowMs(),
        $idx, $agency['parent_idx'], $agency['kind'], $agency['login_id']]);
    $st->execute([$idx]);
    $u = $st->fetch();
  } else {
    if ($u['status'] === 'rejected') jsonOut(['error' => 'rejected'], 403);  // 관리자가 중지한 계정
    /* 이전 승인 대기 정책으로 '대기'가 된 계정도 너바나 인증 성공 시 자동 승인 (2026-08-01) */
    if ($u['status'] === 'pending') { $pdo->prepare("UPDATE users SET status='approved' WHERE id=?")->execute([$u['id']]); $u['status'] = 'approved'; }
    $pdo->prepare("UPDATE users SET name=?, agency_parent_idx=?, agency_kind=?, agency_login_id=? WHERE id=?")
        ->execute([$name, $agency['parent_idx'], $agency['kind'], $agency['login_id'], $u['id']]);
  }

  session_regenerate_id(true);
  $_SESSION['uid'] = (int)$u['id'];
  $_SESSION['agency'] = $agency;              // idx / parent_idx / kind 세션 보관
  setRememberCookie(true);                    // 2026-08-07: 부계정도 로그인 유지 기본 (알림 링크 재로그인 방지)
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
/* ===== 너바나 부계정 목록 연동 (2026-08-01 최종) =====
   너바나 측 목록 API가 아직 열리지 않아, 경로가 확정되면 재배포 없이 자동 연결되도록 설계한다.
     1) env(AGENCY_SUBS_PATH)가 있으면 그 경로를 최우선 사용
     2) 없으면 후보 경로를 순차 탐색하고, 성공한 경로를 meta(subs_path)에 캐시
     3) 전부 404면 60초간 재탐색을 건너뛴다 (meta: subs_path_miss_at)
   응답 필드명이 달라도 화면이 동일하게 동작하도록 서버에서 정규화한다. */
function agencySubsCandidates(): array {
  $env = trim((string)env('AGENCY_SUBS_PATH', ''));
  $list = ['/api2/agency-sub-accounts', '/api2/agency-sub-accounts/list', '/api2/sub-accounts', '/api2/agency-subaccounts'];
  if ($env !== '') array_unshift($list, $env);
  return array_values(array_unique($list));
}

/* 외부 호출 1회 — ['http'=>int(0=네트워크오류), 'json'=>?array] */
function agencySubsCall(string $url, array $payload): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
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
  if ($res === false || $errno !== 0) return ['http' => 0, 'json' => null];
  return ['http' => $http, 'json' => json_decode($res, true)];
}

/* 부계정 레코드 정규화 — 외부 필드명이 어떻게 오든 동일한 형태로 변환 */
function normalizeSubAccount(array $x): array {
  $g = function (array $keys, $def = '') use ($x) {
    foreach ($keys as $k) {
      if (array_key_exists($k, $x) && $x[$k] !== null && $x[$k] !== '') return $x[$k];
    }
    return $def;
  };
  $active = $g(['active', 'active_yn', 'use_yn'], null);
  if ($active === null || $active === '') {          // del_yn 계열은 의미가 반대
    $del = $x['del_yn'] ?? $x['AG_DEL_YN'] ?? $x['delete_yn'] ?? null;
    $active = ($del !== null) ? (strtoupper((string)$del) === 'Y' ? 'N' : 'Y') : 'Y';
  }
  return [
    'idx'         => (int)$g(['idx', 'uid', 'sub_idx', 'seq', 'no'], 0),
    'parent_idx'  => (int)$g(['parent_idx', 'parents', 'parent', 'ag_idx', 'agency_idx', 'parent_agent_idx'], 0),
    'parent_name' => (string)$g(['parent_name', 'parent_agent', 'parentAgent', 'agency_name'], ''),
    'login_id'    => (string)$g(['login_id', 'loginId', 'id', 'user_id', 'account'], ''),
    'name'        => (string)$g(['name', 'mname', 'user_name'], ''),
    'nickname'    => (string)$g(['nickname', 'callname', 'nick'], ''),
    'position'    => (string)$g(['position', 'rank', 'title'], ''),
    'department'  => (string)$g(['department', 'dept', 'team'], ''),
    'phone'       => (string)$g(['phone', 'tel', 'tel_number', 'mobile'], ''),
    'email'       => (string)$g(['email', 'mail'], ''),
    'kakao'       => (string)$g(['kakao', 'kakao_id', 'kakaotalk'], ''),
    'kind'        => (string)$g(['kind', 'type', 'mode'], ''),
    'active'      => strtoupper((string)$active) === 'N' ? 'N' : 'Y',
  ];
}

/* 응답 본문에서 배열 목록 추출 — data가 배열이 아니라 {list:[...]} 형태여도 처리 */
function agencySubsExtract($data): array {
  if (is_array($data) && array_is_list($data)) return $data;
  if (is_array($data)) {
    foreach (['list', 'items', 'rows', 'sub_accounts', 'subs', 'data', 'accounts'] as $k) {
      if (isset($data[$k]) && is_array($data[$k]) && array_is_list($data[$k])) return $data[$k];
    }
  }
  return [];
}

/* 부계정 목록 조회 — ['ok'=>true,'data'=>[정규화된 목록],'path'=>사용경로] | ['ok'=>false,'error'=>...] */
function agencySubAccountsRequest(?int $parentIdx = null, ?PDO $pdo = null): array {
  $base = env('AGENCY_API_BASE');
  if (!$base) return ['ok' => false, 'error' => 'not_configured'];

  $payload = [];
  if ($parentIdx) $payload['parent_idx'] = $parentIdx;

  $cands = agencySubsCandidates();
  if ($pdo) {
    $known = (string)metaGet($pdo, 'subs_path', '');
    if ($known !== '') {
      array_unshift($cands, $known);                 // 이전에 성공한 경로 우선
    } else {
      $missAt = (int)metaGet($pdo, 'subs_path_miss_at', 0);
      if ($missAt && (nowMs() - $missAt) < 60000) return ['ok' => false, 'error' => 'not_found'];
    }
    $cands = array_values(array_unique($cands));
  }

  $lastErr = 'not_found';
  foreach ($cands as $path) {
    $r = agencySubsCall(rtrim($base, '/') . $path, $payload);
    if ($r['http'] === 0) { $lastErr = 'unreachable'; break; }   // 네트워크 오류면 추가 탐색 무의미
    if ($r['http'] === 200 && is_array($r['json']) && ($r['json']['success'] ?? null) === true) {
      $subs = [];
      foreach (agencySubsExtract($r['json']['data'] ?? []) as $x) {
        if (is_array($x)) $subs[] = normalizeSubAccount($x);
      }
      if ($pdo) { metaSet($pdo, 'subs_path', $path); metaSet($pdo, 'subs_path_miss_at', 0); }
      return ['ok' => true, 'data' => $subs, 'path' => $path];
    }
    if ($r['http'] !== 404) $lastErr = 'bad_response';
  }
  if ($pdo) {
    metaSet($pdo, 'subs_path', '');                  // 캐시된 경로가 죽었으면 해제
    if ($lastErr === 'not_found') metaSet($pdo, 'subs_path_miss_at', nowMs());
  }
  return ['ok' => false, 'error' => $lastErr];
}

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
