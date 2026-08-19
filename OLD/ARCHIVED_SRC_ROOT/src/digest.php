<?php
/* ===== 예약 다이제스트 (방콕시간, 평일) =====
   morning  09:00  어제까지 생긴 미처리 건 (없으면 발송 안 함)
   reminder 16:00  현재 미처리 건 (없으면 발송 안 함)
   summary  17:30  오늘 한 일 정리 (항상 발송)                     */
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/telegram.php';

function bkk(): DateTimeImmutable { return new DateTimeImmutable('now', new DateTimeZone('Asia/Bangkok')); }
function bkkDayStartMs(): int { return bkk()->setTime(0, 0)->getTimestamp() * 1000; }
function isWeekendBkk(): bool { return in_array((int)bkk()->format('N'), [6, 7], true); }

function pendingList(PDO $pdo, string $role, ?int $beforeMs = null): array {
  $out = [];
  foreach (allRequests($pdo) as $p) {
    $pending = $role === 'schk' ? isPendingForChecker($p) : isPendingForRequester($p);
    if (!$pending) continue;
    if ($beforeMs !== null && ($p['createdAt'] ?? 0) >= $beforeMs) continue;
    $out[] = reqNoStr($p) . ' ' . reqHotels($p);
  }
  return $out;
}
function fmtList(array $items, int $max = 8): string {
  if (!$items) return '';
  $l = array_slice($items, 0, $max);
  $s = "\n• " . implode("\n• ", $l);
  if (count($items) > $max) $s .= "\n… +" . (count($items) - $max);
  return $s;
}
function runDigest(PDO $pdo, string $job): array {
  if (isWeekendBkk()) return ['skipped' => 'weekend'];
  $sent = 0;
  $users = $pdo->query("SELECT id,role,lang,telegram_chat_id,off_days FROM users
    WHERE status='approved' AND telegram_chat_id IS NOT NULL AND role IN ('sreq','schk')")->fetchAll();
  foreach ($users as $u) {
    if (isOffDayToday($u['off_days'] ?? null)) continue; // skip on off-day
    $role = $u['role']; $lang = $u['lang'] ?: 'ko';
    if ($job === 'morning') {
      $items = pendingList($pdo, $role, bkkDayStartMs()); // 오늘 이전에 생긴 미처리
      if (!$items) continue;                              // 할 일 없으면 발송 안 함
      $txt = tgT($lang, 'morning', ['n' => count($items), 'list' => trim(fmtList($items))]);
    } elseif ($job === 'reminder') {
      $items = pendingList($pdo, $role);
      if (!$items) continue;                              // 할 일 없으면 발송 안 함
      $txt = tgT($lang, 'reminder', ['n' => count($items), 'list' => trim(fmtList($items))]);
    } elseif ($job === 'summary') {
      $day = bkkDayStartMs();
      $doneToday = 0; $newToday = 0;
      foreach (allRequests($pdo) as $p) {
        if (($p['answeredAt'] ?? 0) >= $day) $doneToday++;
        if (($p['createdAt'] ?? 0) >= $day && empty($p['direct'])) $newToday++;
      }
      $items = pendingList($pdo, $role);
      $txt = tgT($lang, 'summary', ['done' => $doneToday, 'new' => $newToday,
        'pending' => count($items), 'list' => fmtList($items, 5)]);
    } else {
      return ['error' => 'unknown job'];
    }
    if (tgSend($u['telegram_chat_id'], $txt)) $sent++;
  }
  return ['job' => $job, 'sent' => $sent];
}
