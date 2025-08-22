/* Service Worker for caching heavy 3D assets (manifest-aware) */
const VERSION = 'v2';
const RUNTIME_CACHE = `runtime-${VERSION}`;
const PRECACHE = `precache-${VERSION}`;

let PRECACHE_URLS = [
  '/Kyushu_University_beta6.glb',
  '/fox.glb',
  '/phoenix.glb',
];

async function loadManifest() {
  try {
    const resp = await fetch('/asset-manifest.json', { cache: 'no-store' });
    if (!resp.ok) return;
    const list = await resp.json();
    if (Array.isArray(list)) {
      const set = new Set(PRECACHE_URLS.concat(list));
      PRECACHE_URLS = Array.from(set);
    }
  } catch (_) {}
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    await loadManifest();
    try {
      const cache = await caches.open(PRECACHE);
      await cache.addAll(PRECACHE_URLS);
    } catch (_) {}
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![PRECACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Helpers
const isHeavyAsset = (url) => /\.(glb|gltf|bin|ktx2)(\?|$)/i.test(url);
const isStaticAsset = (url) => /\.(js|css|wasm|mjs)(\?|$)/i.test(url);

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // Strategy: Stale-While-Revalidate for heavy assets
  if (isHeavyAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Cache-first for static JS/CSS/WASM
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  const networkPromise = fetch(request)
    .then((resp) => {
      if (resp && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors')) {
        cache.put(request, resp.clone()).catch(() => {});
      }
      return resp;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const resp = await fetch(request);
  if (resp && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors')) {
    cache.put(request, resp.clone()).catch(() => {});
  }
  return resp;
}

