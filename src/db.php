<?php
/* ===== DB 연결 + 스키마 (SQLite 개발 / MySQL 운영) ===== */
function env(string $k, ?string $d = null): ?string {
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
  /* 마이그레이션 1회 실행 가드 (2026-07-31): 스키마 버전이 같으면 매 요청 DDL 수십 개 실행을 건너뜀
     ⚠️ migrate()에 컬럼/테이블을 추가하면 아래 버전 문자열을 반드시 올릴 것 */
  $SCHEMA_VER = '2026-07-31b'; /* quote_samples 테이블 추가 */
  $need = true;
  try {
    $st = $pdo->query("SELECT v FROM meta WHERE k='schema_ver'");
    if ($st && $st->fetchColumn() === json_encode($SCHEMA_VER)) $need = false;
  } catch (Throwable $e) { /* meta 테이블 없음 → 최초 실행 */ }
  if ($need) { migrate($pdo); metaSet($pdo, 'schema_ver', $SCHEMA_VER); }
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
  /* 견적서 샘플 (2026-07-31): 요청자 전체 공유, 투어 종류·로케이션으로 검색 */
  $pdo->exec("CREATE TABLE IF NOT EXISTS quote_samples (
    id $AI,
    name VARCHAR(200) NOT NULL,
    tour_type VARCHAR(60) NULL,
    location VARCHAR(60) NULL,
    hotels $TXT NULL,                        -- 표시용 호텔 요약
    payload $TXT NOT NULL,                   -- 요청+견적 스냅샷 JSON
    created_by BIGINT NULL,
    created_name VARCHAR(120) NULL,
    created_at BIGINT NOT NULL
  )");
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
  ensureColumn($pdo, 'users', 'agent_company', 'VARCHAR(120) NULL'); // 부계정 소속 에이전시(회사) — 이직 시 회원정보에서 변경 (2026-07-30)
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
