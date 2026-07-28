<?php
/* ===== 호텔 목록/상세 조회 API (2026-07-22) ===== */
require_once __DIR__ . '/lib.php';

/* 외부 호텔 목록 조회 API 호출
   POST {HOTEL_API_BASE}/api2/hotels
   Request: {active, area, search}
   Response: {success, message, status, data: [{idx, name, main_hotel_yn, ...}]}
   정렬: main_hotel_yn='Y' 우선, 그 안에서는 name ABC순
*/
function hotelListRequest(?string $active = null, ?string $area = null, ?string $search = null): array {
  $base = env('HOTEL_API_BASE');
  if (!$base) return ['ok' => false, 'error' => 'not_configured'];

  $url = rtrim($base, '/') . '/api2/hotels';
  $payload = [];
  if ($active !== null) $payload['active'] = $active;
  if ($area !== null) $payload['area'] = $area;
  if ($search !== null) $payload['search'] = $search;

  $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_USERAGENT => env('HOTEL_API_UA', 'RoomcheckServer/1.0'),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => (int)env('HOTEL_API_TIMEOUT', '10'),
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
    error_log("hotel-list curl error: errno=$errno");
    return ['ok' => false, 'error' => 'unreachable', 'http' => null];
  }

  $j = json_decode($res, true);
  if ($http === 200 && is_array($j) && ($j['success'] ?? null) === true && is_array($j['data'] ?? null)) {
    return ['ok' => true, 'data' => $j['data']];
  }

  error_log("hotel-list upstream error: http=$http");
  return ['ok' => false, 'error' => 'bad_response', 'http' => $http];
}

/* 외부 호텔 상세 조회 API 호출
   POST {HOTEL_API_BASE}/api2/hotels/{idx}
   Request: {}
   Response: {success, message, status, data: {hotel, room_types, options, facilities}}
*/
function hotelDetailRequest(int $idx): array {
  $base = env('HOTEL_API_BASE');
  if (!$base) return ['ok' => false, 'error' => 'not_configured'];

  $url = rtrim($base, '/') . '/api2/hotels/' . $idx;
  $body = json_encode([], JSON_UNESCAPED_UNICODE);

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_USERAGENT => env('HOTEL_API_UA', 'RoomcheckServer/1.0'),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => (int)env('HOTEL_API_TIMEOUT', '10'),
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
    error_log("hotel-detail curl error: errno=$errno idx=$idx");
    return ['ok' => false, 'error' => 'unreachable', 'http' => null];
  }

  $j = json_decode($res, true);

  // 404: 호텔 없음
  if ($http === 404) {
    return ['ok' => false, 'error' => 'not_found', 'http' => 404];
  }

  // 200 + success=true 성공
  if ($http === 200 && is_array($j) && ($j['success'] ?? null) === true && is_array($j['data'] ?? null)) {
    return ['ok' => true, 'data' => $j['data']];
  }

  error_log("hotel-detail upstream error: http=$http idx=$idx");
  return ['ok' => false, 'error' => 'bad_response', 'http' => $http];
}
