/*
 * Shared Checklist App — service worker
 *
 * Caches the app page and its install files so the app opens and works
 * offline. Checklist data itself is not stored here: lists live in the
 * browser's local storage, which this worker never touches.
 *
 * Publishing note: the same file ships in two places in the exported
 * build, assets/sw.js and sw.js next to index.html. Every path below is
 * worked out from this file's own location, so either copy works as-is.
 * The copy next to index.html is the one that matters for the published
 * site: its scope covers the whole app, so it can cache the page itself.
 * index.html registers ./sw.js first and falls back to assets/sw.js,
 * which is the copy this preview serves.
 */
"use strict";

var CACHE_NAME = "shared-checklist-app-v2";

/* Directory this worker file sits in, e.g. "/shared-checklist-app/assets/" */
var SW_DIR = self.location.pathname.replace(/\/[^\/]*$/, "/");
/* App root: strip a trailing "assets/" segment when present. */
var APP_ROOT = SW_DIR.slice(-7) === "assets/" ? SW_DIR.slice(0, -7) : SW_DIR;
if (APP_ROOT.charAt(APP_ROOT.length - 1) !== "/") APP_ROOT += "/";

var ASSETS_DIR = APP_ROOT + "assets/";

var PRECACHE_URLS = [
  APP_ROOT,
  APP_ROOT + "index.html",
  ASSETS_DIR + "manifest.webmanifest",
  ASSETS_DIR + "icon-192.png",
  ASSETS_DIR + "icon-512.png",
  ASSETS_DIR + "icon-maskable-512.png",
  ASSETS_DIR + "apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      /* Add each file on its own so one missing file cannot stop the rest. */
      return Promise.all(
        PRECACHE_URLS.map(function (url) {
          return cache.add(url).catch(function () { /* keep installing */ });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          return key === CACHE_NAME ? null : caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url;
  try { url = new URL(request.url); } catch (e) { return; }

  /* Page navigations: fresh copy first so updates arrive, cached copy
     when offline so the installed app still opens. */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(APP_ROOT + "index.html", copy);
        });
        return response;
      }).catch(function () {
        return caches.match(APP_ROOT + "index.html").then(function (cached) {
          return cached || caches.match(APP_ROOT);
        });
      })
    );
    return;
  }

  /* The app's own files: serve from cache, fill the cache on a miss. */
  if (url.origin === self.location.origin && url.pathname.indexOf(APP_ROOT) === 0) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
          if (response && response.ok) {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  /* Cross-origin requests (the web font): cache after the first load so
     the typeface is also available offline. */
  event.respondWith(
    caches.match(request).then(function (cached) {
      var network = fetch(request).then(function (response) {
        if (response && (response.ok || response.type === "opaque")) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function () {
        return cached;
      });
      return cached || network;
    })
  );
});
