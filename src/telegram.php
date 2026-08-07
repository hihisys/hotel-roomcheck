<?php
/* ===== 텔레그램 전송 (요청자·확인자 전용) ===== */
require_once __DIR__ . '/db.php';

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
   2026-08-07 변경 (사용자 확정):
   - 최고관리자도 텔레그램 수신 (Hotel_01 채널 연결) — 종전 제외 규칙 폐지
   - 지역 존 필터: 관리지역(krabi/bangkok)이 있으면 해당 지역 요청만 수신, 지역 미지정(전체)은 모두 수신
   - 단, 본인이 등록한 요청($alwaysUserId=created_by)은 관리지역과 무관하게 수신 */
function tgSendRole(PDO $pdo, string $role, callable $textForLang, ?int $excludeUser = null, ?string $reqRegion = null, ?int $alwaysUserId = null, ?string $reqNo = null): void {
  if (!in_array($role, ['sreq', 'schk'], true)) return; // 텔레그램은 요청자·확인자만
  /* 2026-07-30: 일반 관리자(요청자→관리자 승격)는 요청자(sreq)로 취급해 함께 수신 */
  if ($role === 'sreq') {
    $st = $pdo->prepare("SELECT id,lang,telegram_chat_id,off_days,email,role,region FROM users WHERE role IN ('sreq','admin') AND status='approved' AND telegram_chat_id IS NOT NULL");
    $st->execute();
  } else {
    $st = $pdo->prepare("SELECT id,lang,telegram_chat_id,off_days,email,role,region FROM users WHERE role=? AND status='approved' AND telegram_chat_id IS NOT NULL");
    $st->execute([$role]);
  }
  foreach ($st->fetchAll() as $u) {
    if ($excludeUser && (int)$u['id'] === $excludeUser) continue;
    $ur = (string)($u['region'] ?? '');
    if ($ur !== '' && $reqRegion && $ur !== $reqRegion && (int)$u['id'] !== (int)$alwaysUserId) continue; // 지역 존 필터 + 본인 등록 건 예외
    if (isOffDayToday($u['off_days'] ?? null)) continue; // skip on off-day
    /* 2026-08-07 (사용자 확정): 역할별 허용 언어로 보정 — 요청자·관리자=한국어/영어, 확인자=태국어/영어.
       계정 언어가 허용 범위를 벗어나 저장돼 있어도 텔레그램 문구는 항상 역할에 맞는 언어로 나간다. */
    $allow = ($u['role'] === 'schk') ? ['th', 'en'] : ['ko', 'en'];
    $lang = $u['lang'] ?: '';
    if (!in_array($lang, $allow, true)) $lang = $allow[0];
    $text = $textForLang($lang);
    /* 2026-08-07: 요청 바로가기 링크 — 클릭 시 역할별 페이지(#req=번호)로 이동해 해당 요청 자동 열림 */
    $site = rtrim((string)env('SITE_URL', ''), '/');
    if ($reqNo && $site) {
      $page = ($u['role'] === 'schk') ? 'check.html' : 'request.html';
      $lbl = ['ko' => '🔗 요청 바로 열기', 'en' => '🔗 Open request', 'th' => '🔗 เปิดคำขอ'][$lang] ?? '🔗 Open request';
      $text .= "\n" . '<a href="' . $site . '/' . $page . '#req=' . rawurlencode($reqNo) . '">' . $lbl . '</a>';
    }
    tgSend($u['telegram_chat_id'], $text);
  }
}
/* 텔레그램 서버측 문구 (ko/en/th) */
function tgT(string $lang, string $key, array $p = []): string {
  static $L = [
    'ko' => [
      'linked' => "✅ 룸체크 알림이 연결되었습니다, {name}님!",
      'new_request' => "🔔 새 룸체크 요청 {no}\n{hotels}\n{dates}",
      'answered' => "✅ 룸체크 답변 도착 {no}\n{hotels}{mgr}",
      'partial' => "🟡 부분 답변 {no} ({n}/{t}) — 나머지 호텔 확인이 필요합니다{mgr}",
      'quote_requested' => "💬 견적 요청 {no} — 견적서를 작성해주세요",
      'morning' => "🌅 [아침 브리핑] 어제까지 처리하지 못한 일 {n}건\n{list}",
      'reminder' => "⏰ [마감 리마인드] 오늘 아직 처리하지 못한 일 {n}건\n{list}",
      'summary' => "📊 [일일 정리]\n오늘 답변 완료: {done}건\n오늘 새 요청: {new}건\n남은 미처리: {pending}건{list}",
    ],
    'en' => [
      'linked' => "✅ Room check notifications linked, {name}!",
      'new_request' => "🔔 New room check {no}\n{hotels}\n{dates}",
      'answered' => "✅ Answer received {no}\n{hotels}{mgr}",
      'partial' => "🟡 Partial answer {no} ({n}/{t}) — remaining hotels need checking{mgr}",
      'quote_requested' => "💬 Quote requested {no} — please prepare the quote",
      'morning' => "🌅 [Morning brief] {n} item(s) left from yesterday\n{list}",
      'reminder' => "⏰ [EOD reminder] {n} item(s) still open today\n{list}",
      'summary' => "📊 [Daily summary]\nAnswered today: {done}\nNew requests today: {new}\nStill open: {pending}{list}",
    ],
    'th' => [
      'linked' => "✅ เชื่อมต่อการแจ้งเตือน Room Check แล้ว คุณ {name}!",
      'new_request' => "🔔 คำขอเช็คห้องใหม่ {no}\n{hotels}\n{dates}",
      'answered' => "✅ ได้รับคำตอบแล้ว {no}\n{hotels}{mgr}",
      'partial' => "🟡 คำตอบบางส่วน {no} ({n}/{t}) — ยังมีโรงแรมที่ต้องตรวจสอบ{mgr}",
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
