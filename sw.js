/* DELTA site worker: pages are always fetched fresh from the network so a
 * new deploy takes effect on the very next navigation - no hard refresh.
 * Everything else (assets, API calls) is left to the browser's defaults;
 * the cache only serves as an offline fallback for page loads. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.mode !== "navigate") return;
  e.respondWith(
    fetch(req).then(function (r) {
      try {
        var copy = r.clone();
        caches.open("delta-pages-v" + (self.registration ? "1" : "1")).then(function (c) { c.put(req, copy); });
      } catch (err) {}
      return r;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || Response.error(); });
    })
  );
});
