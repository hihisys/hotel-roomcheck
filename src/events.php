<?php
/* ===== 이벤트 감지 → 인앱 알림 + 텔레그램 ===== */
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/telegram.php';

function notify(PDO $pdo, array $roles, ?int $actor, string $type, string $reqNo, array $params = []): void {
  $st = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at) VALUES (?,?,?,?,?,?)");
  foreach (array_unique($roles) as $role) {
    $st->execute([$role, $actor, $type, $reqNo, json_encode($params, JSON_UNESCAPED_UNICODE), nowMs()]);
    // 텔레그램 즉시 전송 (sreq/schk만 — tgSendRole 내부에서 필터)
    tgSendRole($pdo, $role, fn($lang) => tgT($lang, $type, array_merge($params, ['no' => $reqNo])), $actor);
  }
}

/* 요청 upsert 시 old/new payload를 비교해 이벤트 발생 (2026-07-22 지역 필터링 추가) */
function detectEvents(PDO $pdo, ?array $old, array $new, array $actor): void {
  $no = reqNoStr($new);
  $hotels = reqHotels($new);
  $role = $actor['role'];
  $uid = (int)$actor['id'];
  $reqRegion = $new['region'] ?? null;
  $createdBy = $old === null ? $uid : ((int)($new['created_by'] ?? 0) ?: $uid);

  // 1) 새 요청 (직접 등록 제외 → 확인자에게 / 에이전트가 만들면 요청자에게도)
  if ($old === null) {
    /* 견적서 에이전트 전송 (2026-07-31): 견적 발송 상태로 생성된 복제 요청 →
       확인자 새요청 알림 대신 에이전트에게 '견적 발송' 알림만 보냄 */
    if (!empty($new['quoteSent'])) {
      $st = $pdo->prepare("SELECT id FROM users WHERE role='agent' AND status='approved'");
      $st->execute(); $matched = $st->fetchAll();
      $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at) VALUES (?,?,?,?,?,?)");
      $payload = json_encode(['hotels' => $hotels, 'agent' => trim($new['agent'] ?? '')], JSON_UNESCAPED_UNICODE);
      foreach ($matched as $u2) $notifSt->execute(['agent', $uid, 'quote_sent', $no, $payload, nowMs()]);
      if (!$matched) $notifSt->execute(['agent', $uid, 'quote_sent', $no, $payload, nowMs()]);
      return;
    }
    $targets = ['schk'];
    if ($role === 'agent') $targets[] = 'sreq';
    // 지역 필터링: 해당 역할 중 본인 지역 + 최고관리자는 모두
    foreach ($targets as $targetRole) {
      $st = $pdo->prepare("SELECT id FROM users WHERE role=? AND status='approved' AND (role='admin' OR region IS NULL OR region=?)");
      $st->execute([$targetRole, $reqRegion]);
      $matched = $st->fetchAll();
      $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at) VALUES (?,?,?,?,?,?)");
      $payload = json_encode(['hotels' => $hotels, 'dates' => reqDates($new), 'agent' => $new['agent'] ?? ''], JSON_UNESCAPED_UNICODE);
      foreach ($matched as $u) $notifSt->execute([$targetRole, $uid, 'new_request', $no, $payload, nowMs()]);
      // 대상 사용자가 없어도 알림 1건 기록 (관리자 전체 열람용, 2026-07-30)
      if (!$matched) $notifSt->execute([$targetRole, $uid, 'new_request', $no, $payload, nowMs()]);
    }
    tgSendRole($pdo, 'schk', fn($lang) => tgT($lang, 'new_request', array_merge(['no' => $no, 'hotels' => $hotels, 'dates' => reqDates($new)], ['agent' => $new['agent'] ?? ''])), $uid);
    if ($role === 'agent') tgSendRole($pdo, 'sreq', fn($lang) => tgT($lang, 'new_request', array_merge(['no' => $no, 'hotels' => $hotels, 'dates' => reqDates($new)], ['agent' => $new['agent'] ?? ''])), $uid);
    return;
  }

  // 2) 답변 도착 / 부분 답변 (answeredAt 갱신)
  $oldAns = $old['answeredAt'] ?? null;
  $newAns = $new['answeredAt'] ?? null;
  if ($newAns && $newAns !== $oldAns && $role !== 'agent') {
    $rows = count($new['rows'] ?? []);
    $targetRoles = !empty($new['direct']) ? ['sreq'] : ['sreq', 'agent'];

    foreach ($targetRoles as $targetRole) {
      $notifyType = !empty($new['answerComplete']) ? 'answered' : 'partial';
      $params = !empty($new['answerComplete'])
        ? ['hotels' => $hotels, 'agent' => trim($new['agent'] ?? '')]
        : ['n' => $new['_doneCount'] ?? '?', 't' => $rows, 'hotels' => $hotels, 'agent' => trim($new['agent'] ?? '')];

      // 지역 필터링
      if ($targetRole === 'sreq' || $targetRole === 'schk') {
        $st = $pdo->prepare("SELECT id FROM users WHERE role=? AND status='approved' AND (region IS NULL OR region=? OR id=?)");
        $st->execute([$targetRole, $reqRegion, $createdBy]);
      } else {
        $st = $pdo->prepare("SELECT id FROM users WHERE role=? AND status='approved'");
        $st->execute([$targetRole]);
      }

      $matched = $st->fetchAll();
      $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at) VALUES (?,?,?,?,?,?)");
      $payload = json_encode($params, JSON_UNESCAPED_UNICODE);
      foreach ($matched as $u) $notifSt->execute([$targetRole, $uid, $notifyType, $no, $payload, nowMs()]);
      if (!$matched) $notifSt->execute([$targetRole, $uid, $notifyType, $no, $payload, nowMs()]); // 대상 없어도 기록 (2026-07-30)
    }
  }

  // 3) 견적 요청됨 (에이전트 → 요청자)
  if (empty($old['quoteRequested']) && !empty($new['quoteRequested']) && empty($new['quoteSent'])) {
    $st = $pdo->prepare("SELECT id FROM users WHERE role='sreq' AND status='approved' AND (region IS NULL OR region=? OR id=?)");
    $st->execute([$reqRegion, $createdBy]);
    $matched = $st->fetchAll();
    $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at) VALUES (?,?,?,?,?,?)");
    $payload = json_encode(['hotels' => $hotels], JSON_UNESCAPED_UNICODE);
    foreach ($matched as $u) $notifSt->execute(['sreq', $uid, 'quote_requested', $no, $payload, nowMs()]);
    if (!$matched) $notifSt->execute(['sreq', $uid, 'quote_requested', $no, $payload, nowMs()]); // 대상 없어도 기록 (2026-07-30)
  }

  // 4) 견적 발송됨 (요청자 → 에이전트)
  if (empty($old['quoteSent']) && !empty($new['quoteSent'])) {
    $st = $pdo->prepare("SELECT id FROM users WHERE role='agent' AND status='approved'");
    $st->execute();
    $matched = $st->fetchAll();
    $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at) VALUES (?,?,?,?,?,?)");
    $payload = json_encode(['hotels' => $hotels, 'agent' => trim($new['agent'] ?? '')], JSON_UNESCAPED_UNICODE);
    foreach ($matched as $u) $notifSt->execute(['agent', $uid, 'quote_sent', $no, $payload, nowMs()]);
    if (!$matched) $notifSt->execute(['agent', $uid, 'quote_sent', $no, $payload, nowMs()]); // 대상 없어도 기록 (2026-07-30)
  }

  if (!empty($new['direct']) && empty($old['forwardedAt']) && !empty($new['forwardedAt'])) {
    $st = $pdo->prepare("SELECT id FROM users WHERE role='agent' AND status='approved'");
    $st->execute();
    $matched = $st->fetchAll();
    $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at) VALUES (?,?,?,?,?,?)");
    $payload = json_encode(['hotels' => $hotels, 'agent' => trim($new['agent'] ?? '')], JSON_UNESCAPED_UNICODE);
    foreach ($matched as $u) $notifSt->execute(['agent', $uid, 'answered', $no, $payload, nowMs()]);
    if (!$matched) $notifSt->execute(['agent', $uid, 'answered', $no, $payload, nowMs()]); // 대상 없어도 기록 (2026-07-30)
  }
}
