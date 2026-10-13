// App shell offline. Data sync (API on another origin) is not handled here: see src/lib/syncedState.ts.
// - Page: network first (picks up new deploys as soon as online), cached copy when offline.
// - /assets/*: hashed by Vite, so immutable: cache first. Each fresh page caches its assets and drops old ones.
// - Other same-origin files (icons, manifest): cached copy at once, refreshed in the background.
const CACHE = 'entretien-shell-v1'
const PAGE = '/index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(cachePage().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(cachePage().catch(() => caches.match(PAGE)))
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(request).then((hit) => hit ?? fetchAndCache(request)))
  } else {
    const network = fetchAndCache(request)
    event.respondWith(caches.match(request).then((hit) => hit ?? network))
    event.waitUntil(network.catch(() => {}))
  }
})

/** Fetches the page, caches it with the assets it references, and removes assets of older builds. */
async function cachePage() {
  const response = await fetch(PAGE, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`page ${response.status}`)
  const html = await response.clone().text()
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))]
  const cache = await caches.open(CACHE)
  const missing = []
  for (const asset of assets) if (!(await cache.match(asset))) missing.push(asset)
  await cache.addAll(missing)
  await cache.put(PAGE, response.clone())
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname
    if (path.startsWith('/assets/') && !assets.includes(path)) await cache.delete(request)
  }
  return response
}

async function fetchAndCache(request) {
  const response = await fetch(request)
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone())
  return response
}
