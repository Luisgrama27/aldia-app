document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
document.addEventListener('gesturechange', function (e) { e.preventDefault(); });
document.addEventListener('gestureend', function (e) { e.preventDefault(); });
window.__hideSplash = function () {
  var s = document.getElementById('native-splash');
  if (s) { s.classList.add('hidden'); setTimeout(function () { s.remove(); }, 400); }
};
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () { /* sin service worker */ });
  });
}