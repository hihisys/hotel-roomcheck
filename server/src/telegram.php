<?php
/* ===== 텔레그램 전송 (요청자·확인자 전용) ===== */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/lib.php';   // userZones() / zoneMatch()

function tgApiBase(): ?string {
  $tok = env('TELEGRAM_BOT_TOKEN');
  if (!$tok) return null;
  return rtrim(env('TELEGRAM_API', 'https://api.telegram.org'), '/') . '/bot' . $tok;
}
function tgSend(string $chatId, string $text): bool {
  $base = tgApiBase();
  if (!$base || !$chatId) return false;
  $ch = curl_init($base . '/sendMessage');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query(['chat_id' => $chatId, 'text' => $text, 'parse_mode' => 'HTML']),
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6,
  ]);
  $res = curl_exec($ch);
  curl_close($ch);
  if ($res === false) { error_log('telegram send failed: ' . $chatId); return false; }
  return true;
}
/* 역할 대상 전원에게 전송 (승인 + chat_id 연결된 sreq/schk만)
   $zones 를 주면 그 권역 담당자에게만 보낸다 (관할 미설정 직원은 항상 받는다).
   2026-08-30 — 전에는 권역을 전혀 보지 않아 카오락 요청이 방콕+파타야 담당에게도
   갔다. 인앱 알림에는 zone 이 들어 있는데 텔레그램만 빠져 있었다. */
function tgSendRole(PDO $pdo, string $role, callable $textForLang, ?int $excludeUser = null, ?array $zones = null, ?string $reqNo = null): void {
  /* 2026-08-30 — 관리자(admin)도 확인자와 같은 알림을 받는다 (사용자 결정).
     니르바나 관리자들이 실제로 룸체크를 처리하는데 역할이 admin 이라
     텔레그램이 한 건도 가지 않고 있었다. 관할권역이 비면 전 지역을 받는다. */
  if (!in_array($role, ['sreq', 'schk', 'admin'], true)) return;
  $st = $pdo->prepare("SELECT id,lang,region,telegram_chat_id,off_days FROM users WHERE role=? AND status='approved' AND telegram_chat_id IS NOT NULL");
  $st->execute([$role]);
  foreach ($st->fetchAll() as $u) {
    if ($excludeUser && (int)$u['id'] === $excludeUser) continue;
    if (isOffDayToday($u['off_days'] ?? null)) continue; // skip on off-day
    if ($zones !== null && !zoneMatch($u['region'] ?? null, $zones)) continue; // 관할권역 밖
    $lang = $u['lang'] ?: 'ko';
    tgSend($u['telegram_chat_id'], $textForLang($lang) . tgOpenLink($role, $lang, $reqNo));
  }
}
/* 「요청 바로 열기」 링크 (2026-08-07 도입 → 저장소 통합 때 유실 → 2026-08-30 복원)
   알림만 보고 어느 요청인지 찾아 들어가야 해서 불편하다는 이야기가 나왔다.
   클릭하면 역할별 페이지의 #req=번호 로 들어가 해당 요청이 자동으로 열린다.
   SITE_URL 이 없으면 링크를 붙이지 않는다 (로컬 개발). */
function tgOpenLink(string $role, string $lang, ?string $reqNo): string {
  if (!$reqNo) return '';
  $site = rtrim((string)env('SITE_URL', ''), '/');
  if ($site === '') return '';
  $page = ($role === 'schk') ? 'check.html' : 'request.html';
  $lbl = ['ko' => '🔗 요청 바로 열기', 'en' => '🔗 Open request', 'th' => '🔗 เปิดคำขอ'][$lang] ?? '🔗 Open request';
  return "\n" . '<a href="' . $site . '/' . $page . '#req=' . rawurlencode($reqNo) . '">' . $lbl . '</a>';
}
/* 텔레그램 서버측 문구 (ko/en/th) */
function tgT(string $lang, string $key, array $p = []): string {
  static $L = [
    'ko' => [
      'linked' => "✅ 룸체크 알림이 연결되었습니다, {name}님!",
      'new_request' => "🔔 새 룸체크 요청 {no}\n{hotels}\n{dates}",
      'answered' => "✅ 룸체크 답변 도착 {no}\n{hotels}",
      'partial' => "🟡 부분 답변 {no} ({n}/{t}) — 나머지 호텔 확인이 필요합니다",
      'quote_requested' => "💬 견적 요청 {no} — 견적서를 작성해주세요",
      'morning' => "🌅 [아침 브리핑] 어제까지 처리하지 못한 일 {n}건\n{list}",
      'reminder' => "⏰ [마감 리마인드] 오늘 아직 처리하지 못한 일 {n}건\n{list}",
      'summary' => "📊 [일일 정리]\n오늘 답변 완료: {done}건\n오늘 새 요청: {new}건\n남은 미처리: {pending}건{list}",
    ],
    'en' => [
      'linked' => "✅ Room check notifications linked, {name}!",
      'new_request' => "🔔 New room check {no}\n{hotels}\n{dates}",
      'answered' => "✅ Answer received {no}\n{hotels}",
      'partial' => "🟡 Partial answer {no} ({n}/{t}) — remaining hotels need checking",
      'quote_requested' => "💬 Quote requested {no} — please prepare the quote",
      'morning' => "🌅 [Morning brief] {n} item(s) left from yesterday\n{list}",
      'reminder' => "⏰ [EOD reminder] {n} item(s) still open today\n{list}",
      'summary' => "📊 [Daily summary]\nAnswered today: {done}\nNew requests today: {new}\nStill open: {pending}{list}",
    ],
    'th' => [
      'linked' => "✅ เชื่อมต่อการแจ้งเตือน Room Check แล้ว คุณ {name}!",
      'new_request' => "🔔 คำขอเช็คห้องใหม่ {no}\n{hotels}\n{dates}",
      'answered' => "✅ ได้รับคำตอบแล้ว {no}\n{hotels}",
      'partial' => "🟡 คำตอบบางส่วน {no} ({n}/{t}) — ยังมีโรงแรมที่ต้องตรวจสอบ",
      'quote_requested' => "💬 มีการขอใบเสนอราคา {no}",
      'morning' => "🌅 [สรุปเช้า] งานค้างจากเมื่อวาน {n} รายการ\n{list}",
      'reminder' => "⏰ [เตือนก่อนเลิกงาน] งานที่ยังไม่เสร็จวันนี้ {n} รายการ\n{list}",
      'summary' => "📊 [สรุปประจำวัน]\nตอบแล้ววันนี้: {done}\nคำขอใหม่วันนี้: {new}\nยังค้าง: {pending}{list}",
    ],
  ];
  $s = $L[$lang][$key] ?? $L['ko'][$key] ?? $key;
  foreach ($p as $k => $v) $s = str_replace('{' . $k . '}', (string)$v, $s);
  return $s;
}
