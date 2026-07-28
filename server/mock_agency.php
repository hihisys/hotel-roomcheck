<?php
/* 목(mock) 에이전시 인증 API 서버 — 테스트 전용
   php -S 127.0.0.1:8020 mock_agency.php */
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
header('Content-Type: application/json; charset=utf-8');

if ($uri !== '/api2/agency-sub-accounts/login' || $_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(404); echo json_encode(['success'=>false,'message'=>'not found','status'=>404]); exit;
}

/* JSON 또는 form-urlencoded 둘 다 수용 */
$ct = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
if (str_contains($ct, 'application/json')) {
  $in = json_decode(file_get_contents('php://input') ?: 'null', true) ?: [];
  $via = 'json';
} else {
  $in = $_POST;
  $via = 'form';
}
$id = $in['login_id'] ?? ''; $pw = $in['password'] ?? '';

if ($id === 'slow_id') { sleep(6); }                       // 타임아웃 시나리오
if ($id === 'broken_id') { http_response_code(200); echo 'THIS IS NOT JSON'; exit; }
if ($id === 'weird_id') {                                  // 200이지만 success:false
  echo json_encode(['success'=>false,'message'=>'점검 중입니다.','status'=>200]); exit;
}
if ($id === 'agent001' && $pw === 'secretpw123') {
  echo json_encode(['success'=>true,'message'=>'Authentication successful.','status'=>200,
    'data'=>['idx'=>123,'login_id'=>'agent001','name'=>'홍길동','nickname'=>'닉네임','kind'=>'travel','parent_idx'=>10,'via'=>$via]],
    JSON_UNESCAPED_UNICODE);
  exit;
}
http_response_code(401);
echo json_encode(['success'=>false,'message'=>'아이디 또는 비밀번호가 일치하지 않습니다.','status'=>401], JSON_UNESCAPED_UNICODE);
