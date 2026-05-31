/* =========================================================
   Service Worker – einfacher Offline-Cache.
   Bei jedem Release CACHE_VERSION erhöhen, damit der Cache
   erneuert wird.
   ========================================================= */

const CACHE_VERSION = "uhr-lernen-v38";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./js/main.js",
  "./js/exercises.js",
  "./js/games.js",
  "./js/clock.js",
  "./js/quiz.js",
  "./js/sound.js",
  "./js/time.js",
  "./js/settings.js",
  "./js/stars.js",
  "./js/celebrate.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/icon-180.png",
];

// Installieren: alle App-Dateien in den Cache legen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktivieren: alte Caches aufräumen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Anfragen beantworten: erst Netzwerk (immer aktuell), dann Cache (offline).
// "network-first" verhindert, dass alte Versionen aus dem Cache hängen bleiben.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // fremde Anfragen normal durchlassen

  event.respondWith(
    // {cache: "no-store"} umgeht den Browser-HTTP-Cache, damit immer die
    // aktuelle Version vom Server kommt (auch importierte Module ohne ?v=).
    fetch(event.request, { cache: "no-store" })
      .then((response) => {
        // frische Antwort in den Cache legen (für offline)
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request)) // offline: aus dem Cache
  );
});
