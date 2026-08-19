<?php
/* 프론트 컨트롤러 — /api/* 는 라우터로, 나머지는 정적 파일 */
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (str_starts_with($uri, '/api/')) {
  require __DIR__ . '/../src/router.php';
  route(substr($uri, 5), $_SERVER['REQUEST_METHOD'] ?? 'GET');
}

/* PHP 내장 서버(개발)에서 정적 파일 직접 서빙 */
if (PHP_SAPI === 'cli-server') {
  $file = __DIR__ . $uri;
  if ($uri !== '/' && is_file($file)) return false;
  $index = __DIR__ . '/index.html';
  if ($uri === '/' && is_file($index)) { header('Content-Type: text/html; charset=utf-8'); readfile($index); exit; }
  http_response_code(404); echo 'Not Found'; exit;
}

/* Apache 등에서는 정적 파일이 먼저 매칭되므로 여기 오면 index.html */
$index = __DIR__ . '/index.html';
if (is_file($index)) { header('Content-Type: text/html; charset=utf-8'); readfile($index); exit; }
http_response_code(404); echo 'Not Found';
