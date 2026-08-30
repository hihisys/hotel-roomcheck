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
  /* 요청이 걸쳐 있는 관할권역 (2026-08-24) — payload 의 행에서 계산한다.
     전에는 $new['region'] 을 봤는데 그 값을 넣는 코드가 없어 늘 비었고,
     그 결과 region 을 설정한 직원에게는 알림이 가지 않았다. */
  $reqZones = requestZones($new);
  $zoneIn   = implode(',', array_fill(0, count($reqZones), '?'));
  $createdBy = $old === null ? $uid : ((int)($new['created_by'] ?? 0) ?: $uid);

  // 1) 새 요청 (직접 등록 제외 → 확인자에게 / 에이전트가 만들면 요청자에게도)
  if ($old === null) {
    /* 관리자도 확인자와 동일하게 새 요청 알림을 받는다 (2026-08-30 사용자 결정).
       역할이 admin 이라는 이유로 인앱 알림·텔레그램이 모두 가지 않고 있었다. */
    $targets = ['schk', 'admin'];
    if ($role === 'agent') $targets[] = 'sreq';
    // 지역 필터링: 해당 역할 중 본인 지역 + 최고관리자는 모두
    /* 권역별로 한 건씩만 넣는다. 전에는 조건에 맞는 사용자 수만큼 같은 알림이
       중복 생성됐는데, 알림은 역할 단위로 읽히므로 모두에게 여러 번 보였다. */
    $ts = nowMs();          /* 권역별 행이 같은 사건임을 알 수 있게 시각을 공유한다 */
    foreach ($targets as $targetRole) {
      foreach ($reqZones as $zone) {
        $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at,zone) VALUES (?,?,?,?,?,?,?)");
        $notifSt->execute([$targetRole, $uid, 'new_request', $no, json_encode(['hotels' => $hotels, 'dates' => reqDates($new), 'agent' => $new['agent'] ?? ''], JSON_UNESCAPED_UNICODE), $ts, $zone]);
      }
    }
    /* 관할권역 담당자에게만 (2026-08-30) — 카오락 요청이 방콕+파타야 담당에게 가지 않는다 */
    tgSendRole($pdo, 'schk', fn($lang) => tgT($lang, 'new_request', array_merge(['no' => $no, 'hotels' => $hotels, 'dates' => reqDates($new)], ['agent' => $new['agent'] ?? ''])), $uid, $reqZones);
    tgSendRole($pdo, 'admin', fn($lang) => tgT($lang, 'new_request', array_merge(['no' => $no, 'hotels' => $hotels, 'dates' => reqDates($new)], ['agent' => $new['agent'] ?? ''])), $uid, $reqZones);
    if ($role === 'agent') tgSendRole($pdo, 'sreq', fn($lang) => tgT($lang, 'new_request', array_merge(['no' => $no, 'hotels' => $hotels, 'dates' => reqDates($new)], ['agent' => $new['agent'] ?? ''])), $uid, $reqZones);
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
        $st = $pdo->prepare("SELECT id FROM users WHERE role=? AND status='approved' AND (region IS NULL OR region IN ($zoneIn) OR id=?)");
        $st->execute(array_merge([$targetRole], $reqZones, [$createdBy]));
      } else {
        $st = $pdo->prepare("SELECT id FROM users WHERE role=? AND status='approved'");
        $st->execute([$targetRole]);
      }

      if ($st->fetchAll()) {
        $ts = nowMs();
        foreach ($reqZones as $zone) {
          $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at,zone) VALUES (?,?,?,?,?,?,?)");
          $notifSt->execute([$targetRole, $uid, $notifyType, $no, json_encode($params, JSON_UNESCAPED_UNICODE), $ts, $zone]);
        }
      }
    }
  }

  // 3) 견적 요청됨 (에이전트 → 요청자)
  if (empty($old['quoteRequested']) && !empty($new['quoteRequested']) && empty($new['quoteSent'])) {
    $st = $pdo->prepare("SELECT id FROM users WHERE role='sreq' AND status='approved' AND (region IS NULL OR region IN ($zoneIn) OR id=?)");
    $st->execute(array_merge($reqZones, [$createdBy]));
    if ($st->fetchAll()) {
      $ts = nowMs();
      foreach ($reqZones as $zone) {
        $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at,zone) VALUES (?,?,?,?,?,?,?)");
        $notifSt->execute(['sreq', $uid, 'quote_requested', $no, json_encode(['hotels' => $hotels], JSON_UNESCAPED_UNICODE), $ts, $zone]);
      }
    }
  }

  // 4) 견적 발송됨 (요청자 → 에이전트)
  if (empty($old['quoteSent']) && !empty($new['quoteSent'])) {
    $st = $pdo->prepare("SELECT id FROM users WHERE role='agent' AND status='approved'");
    $st->execute();
    if ($st->fetchAll()) {   /* 에이전트는 권역과 무관 → zone NULL 로 한 건 */
      $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at,zone) VALUES (?,?,?,?,?,?,NULL)");
      $notifSt->execute(['agent', $uid, 'quote_sent', $no, json_encode(['hotels' => $hotels, 'agent' => trim($new['agent'] ?? '')], JSON_UNESCAPED_UNICODE), nowMs()]);
    }
  }

  if (!empty($new['direct']) && empty($old['forwardedAt']) && !empty($new['forwardedAt'])) {
    $st = $pdo->prepare("SELECT id FROM users WHERE role='agent' AND status='approved'");
    $st->execute();
    if ($st->fetchAll()) {   /* 에이전트는 권역과 무관 → zone NULL 로 한 건 */
      $notifSt = $pdo->prepare("INSERT INTO notifications (role,exclude_user,type,req_no,params,created_at,zone) VALUES (?,?,?,?,?,?,NULL)");
      $notifSt->execute(['agent', $uid, 'answered', $no, json_encode(['hotels' => $hotels, 'agent' => trim($new['agent'] ?? '')], JSON_UNESCAPED_UNICODE), nowMs()]);
    }
  }
}
