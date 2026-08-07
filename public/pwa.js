/* ===== 홈 화면 앱(PWA) 등록 (2026-08-03, [017]) =====
   모든 페이지에서 불러온다. 서비스 워커 등록만 하고 화면은 건드리지 않는다.
   sw.js 는 아무것도 캐시하지 않으므로 배포 후 최신 파일이 그대로 내려온다. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* 실패해도 사이트 동작에는 영향 없음 */ });
  });
})();
