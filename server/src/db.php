<?php
/* ===== DB 연결 + 스키마 (SQLite 개발 / MySQL 운영) ===== */
/* .env 로더 — getenv()만으로는 php -S나 공유호스팅에서 값을 넣기 번거롭다.
   server/.env 가 있으면 한 번만 읽어 환경변수로 올린다. 이미 설정된 값은 덮지 않는다. */
function loadDotEnv(): void {
  static $done = false;
  if ($done) return;
  $done = true;
  $f = __DIR__ . '/../.env';
  if (!is_readable($f)) return;
  foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    $line = trim($line);
    if ($line === '' || $line[0] === '#') continue;
    $eq = strpos($line, '=');
    if ($eq === false) continue;
    $k = trim(substr($line, 0, $eq));
    $v = trim(substr($line, $eq + 1));
    if ($k === '' || getenv($k) !== false) continue;
    if (strlen($v) > 1 && (($v[0] === '"' && str_ends_with($v, '"')) || ($v[0] === "'" && str_ends_with($v, "'")))) {
      $v = substr($v, 1, -1);
    }
    putenv("$k=$v");
  }
}
function env(string $k, ?string $d = null): ?string {
  loadDotEnv();
  $v = getenv($k);
  return ($v === false || $v === '') ? $d : $v;
}
function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $dsn = env('DB_DSN', 'sqlite:' . __DIR__ . '/../data/roomcheck.sqlite');
  $pdo = new PDO($dsn, env('DB_USER'), env('DB_PASS'), [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  if (str_starts_with($dsn, 'sqlite:')) $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;');
  migrate($pdo);
  return $pdo;
}
function isMySQL(PDO $pdo): bool { return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql'; }

function migrate(PDO $pdo): void {
  $my = isMySQL($pdo);
  $AI = $my ? 'BIGINT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  $TXT = $my ? 'LONGTEXT' : 'TEXT';
  $pdo->exec("CREATE TABLE IF NOT EXISTS users (
    id $AI,
    name VARCHAR(80) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    pass_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL,               -- agent | sreq | schk | admin
    status VARCHAR(10) NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
    lang VARCHAR(5) NOT NULL DEFAULT 'ko',
    telegram_chat_id VARCHAR(40) NULL,
    tg_link_code VARCHAR(40) NULL,
    notif_read_at BIGINT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  )");
  $pdo->exec("CREATE TABLE IF NOT EXISTS requests (
    id BIGINT PRIMARY KEY,                   -- 클라이언트 생성 id (Date.now())
    no INT NOT NULL,
    payload $TXT NOT NULL,                   -- 전체 요청 JSON
    deleted TINYINT NOT NULL DEFAULT 0,
    created_by BIGINT NULL,                  -- 요청 생성자 ID (2026-07-22)
    updated_at BIGINT NOT NULL,
    updated_by BIGINT NULL
  )");
  $pdo->exec("CREATE TABLE IF NOT EXISTS meta (
    k VARCHAR(40) PRIMARY KEY,
    v $TXT NOT NULL
  )");
  $pdo->exec("CREATE TABLE IF NOT EXISTS notifications (
    id $AI,
    role VARCHAR(10) NOT NULL,               -- 대상 역할
    exclude_user BIGINT NULL,                -- 행동 당사자 (본인 제외)
    type VARCHAR(30) NOT NULL,
    req_no VARCHAR(12) NULL,
    params $TXT NULL,
    created_at BIGINT NOT NULL
  )");
  /* 공유 링크 (2026-08-26)
     「링크 복사」가 요청 전체를 base64 로 URL 에 밀어 넣어 2,000자가 넘었다 — 카톡에 못 붙인다.
     복사하는 순간의 내용을 여기 저장하고 짧은 코드만 주소에 담는다.
     payload 는 그때의 스냅샷이라 나중에 요청이 바뀌어도 링크 내용은 그대로다
     (견적을 보낸 뒤 금액이 바뀌면 분쟁이 되므로 고정이 맞다).
     code 형식: 20260826-A0001E-K3F9 (날짜 · 요청번호 · 랜덤 4자)
       날짜·번호는 링크만 봐도 무슨 요청인지 알라고, 뒤 4자는 번호를 바꿔 남의 요청을
       열어보지 못하게 하려고 붙인다. */
  $pdo->exec("CREATE TABLE IF NOT EXISTS shares (
    code VARCHAR(48) PRIMARY KEY,            -- 20260826-A0001E-K3F9
    req_no VARCHAR(12) NULL,                 -- 사람이 알아볼 요청번호
    payload $TXT NOT NULL,                   -- 복사 시점 요청 JSON (스냅샷, 변경하지 않는다)
    created_by BIGINT NULL,
    created_at BIGINT NOT NULL
  )");

  /* 요청을 넣은 에이전시 (2026-08-25)
     니르바나 부계정/에이전시를 요청 행에 직접 남긴다. payload(JSON) 안을 뒤지지 않고
     조회·집계할 수 있고, 이름은 저장 시점 스냅샷이라 담당자가 이직하거나 회사명이
     바뀌어도 과거 기록이 흔들리지 않는다.
     parent 는 니르바나 API 의 parent_idx (부계정의 상위 = 소속 에이전시)를 그대로 쓴다. */
  ensureColumn($pdo, 'requests', 'agency_idx',         'BIGINT NULL');
  ensureColumn($pdo, 'requests', 'agency_name',        'VARCHAR(120) NULL');
  ensureColumn($pdo, 'requests', 'agency_parent_idx',  'BIGINT NULL');
  ensureColumn($pdo, 'requests', 'agency_parent_name', 'VARCHAR(190) NULL');

  /* 알림 관할권역 (2026-08-24): 어느 권역의 요청인지. NULL 이면 권역 무관 */
  ensureColumn($pdo, 'notifications', 'zone', 'VARCHAR(20) NULL');

  /* 에이전시 부계정 연동 컬럼 (2026-07-17): 외부 인증 사용자 식별 */
  ensureColumn($pdo, 'users', 'agency_idx', 'BIGINT NULL');
  ensureColumn($pdo, 'users', 'agency_parent_idx', 'BIGINT NULL');
  ensureColumn($pdo, 'users', 'agency_kind', 'VARCHAR(20) NULL');
  ensureColumn($pdo, 'users', 'agency_login_id', 'VARCHAR(120) NULL');
  ensureColumn($pdo, 'users', 'phone', 'VARCHAR(40) NULL'); // 회원정보 연락처 (2026-07-17)
  /* 회원정보 추가 필드 (2026-07-17): 닉네임·은행 계좌 */
  ensureColumn($pdo, 'users', 'nickname', 'VARCHAR(80) NULL');
  ensureColumn($pdo, 'users', 'bank_account', 'VARCHAR(255) NULL');
  ensureColumn($pdo, 'users', 'orig_role', 'VARCHAR(10) NULL'); // 관리자 승격 전 원래 역할 (해제 시 복원)
  ensureColumn($pdo, 'users', 'off_days', 'LONGTEXT NULL'); // 휴무일 JSON {"dates":["YYYY-MM-DD"],"weekdays":[0..6]} (2026-07-18)
  ensureColumn($pdo, 'users', 'region', 'VARCHAR(20) NULL'); // 관할지역 (2026-07-22): 'krabi' | 'bangkok' | null
  ensureColumn($pdo, 'requests', 'created_by', 'BIGINT NULL'); // 요청 생성자 ID (2026-07-22, 지역 필터링용)
  // 최초 관리자 계정 + env 변경 시 아이디·비밀번호 동기화 (2026-07-17)
  $adminEmail = env('ADMIN_EMAIL', 'admin@nirvana.local');
  $admin = $pdo->query("SELECT id,email FROM users WHERE role='admin' ORDER BY id LIMIT 1")->fetch();
  if (!$admin) {
    $st = $pdo->prepare("INSERT INTO users (name,email,pass_hash,role,status,lang,created_at) VALUES (?,?,?,?,?,?,?)");
    $st->execute(['관리자', $adminEmail,
      password_hash(env('ADMIN_PASSWORD', 'nirvana1234!'), PASSWORD_DEFAULT),
      'admin', 'approved', 'ko', (int)(microtime(true) * 1000)]);
  } elseif ($admin['email'] !== $adminEmail) {
    $pdo->prepare("UPDATE users SET email=?, pass_hash=? WHERE id=?")
        ->execute([$adminEmail, password_hash(env('ADMIN_PASSWORD', 'nirvana1234!'), PASSWORD_DEFAULT), $admin['id']]);
  }
}
/* 컬럼이 없으면 추가 (SQLite/MySQL 공용, 이미 있으면 무시) */
function ensureColumn(PDO $pdo, string $table, string $col, string $ddl): void {
  try { $pdo->exec("ALTER TABLE $table ADD COLUMN $col $ddl"); }
  catch (PDOException $e) { /* duplicate column → 이미 적용됨 */ }
}
function metaGet(PDO $pdo, string $k, $default) {
  $st = $pdo->prepare("SELECT v FROM meta WHERE k=?"); $st->execute([$k]);
  $r = $st->fetch();
  return $r ? json_decode($r['v'], true) : $default;
}
function metaSet(PDO $pdo, string $k, $v): void {
  $j = json_encode($v, JSON_UNESCAPED_UNICODE);
  if (isMySQL($pdo)) {
    $st = $pdo->prepare("INSERT INTO meta (k,v) VALUES (?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)");
  } else {
    $st = $pdo->prepare("INSERT INTO meta (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v");
  }
  $st->execute([$k, $j]);
}
function bumpRev(PDO $pdo): int {
  $rev = (int)metaGet($pdo, 'rev', 0) + 1;
  metaSet($pdo, 'rev', $rev);
  return $rev;
}
function nowMs(): int { return (int)(microtime(true) * 1000); }
/* 휴무일 판정 — 방콕 기준 오늘이 이 사용자의 쉬는날인가 (2026-07-18)
   off_days JSON: {"dates":["2026-07-20"],"weekdays":[0,6]} (weekday 0=일 … 6=토) */
function isOffDayToday(?string $offJson): bool {
  if (!$offJson) return false;
  $o = json_decode($offJson, true);
  if (!is_array($o)) return false;
  $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Bangkok'));
  if (in_array($now->format('Y-m-d'), (array)($o['dates'] ?? []), true)) return true;
  $wd = (int)$now->format('w'); // 0(일)~6(토)
  foreach ((array)($o['weekdays'] ?? []) as $w) if ((int)$w === $wd) return true;
  return false;
}
