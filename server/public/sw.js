/* ===== 홈 화면 설치용 서비스 워커 (2026-08-03, [017]) =====
   목적: 안드로이드 크롬에서 '홈 화면에 추가(앱 설치)'가 뜨려면 fetch 핸들러가 있는
        서비스 워커가 필요하다. 이 워커는 그 조건만 만족시키고 아무것도 캐시하지 않는다.
   ⚠️ 캐시를 절대 하지 않는 이유: 이 사이트는 배포할 때마다 ?v= 캐시 버전을 올려
      최신 파일을 받도록 되어 있다. 서비스 워커가 응답을 캐시하면 배포 후에도
      옛 화면이 남아 "수정이 반영되지 않는" 문제가 생기므로, 항상 네트워크로만 통과시킨다. */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  /* 과거에 캐시를 쓰던 버전이 있었다면 전부 비운다 (안전장치) */
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  /* 통과만 — 저장하지 않는다. 네트워크 실패 시 브라우저 기본 동작으로 폴백 */
  e.respondWith(
    fetch(e.request).catch(function () {
      /* 네트워크 오류 시, 브라우저의 오프라인 페이지로 넘김 */
      return new Response('', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});
