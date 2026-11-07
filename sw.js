// --- START OF FILE sw.js ---
const CACHE_NAME = 'jurmalciems-arm-v6.6';

const CORE_ASSETS = [
  './',
  './index.html',
  './telefon.html',
  './knowledge.html',
  './vitrina.html',
  './js/scada-link.js',
  './manifest.json',
  './css/cyber-scada.css',
  './css/cockpit-fx.css',
  './js/core-domain.js',
  './js/cockpit-fx.js',
  './js/chamber-twin-3d.js',
  './js/vendor/three/three.min.js',
  './js/vendor/three/OrbitControls.js',
  './css/cockpit-pages-fx.css',
  './js/cockpit-pages-fx.js',
  './trolley-real.jpg',
  './css/ui-polish.css',
  './js/ui-polish.js',
  './css/telefon-fx.css',
  './js/telefon-fx.js',
  './js/fish-emblem.js',
  './js/pid-scheme.js',
  './js/sim-batch.js',
  './js/cad-batch.js',
  './js/trade-fx.js',
  './css/trade-fx.css',
  './js/knowledge-base.js',
  './knowledge/species.js',
  './knowledge/stages.js',
  './knowledge/equipment.js',
  './knowledge/marketing.js',
  './knowledge/notes.js',
  './jurmalciems-rybak/rybak.html'
];

// фото стадий вяления: img/vyalka/<вид>-0..4.jpg (0/13/35/68/84 ч) и готовый продукт
const VYALKA_ASSETS = ['vimba', 'bream', 'roach', 'smelt', 'perch', 'goby']
  .flatMap((sp) => [0, 1, 2, 3, 4].map((i) => `./img/vyalka/${sp}-${i}.jpg`))
  .concat(['./img/vyalka/product-1.webp', './img/vyalka/product-2.webp', './img/vyalka/vacuum-pack.jpg'])
  .concat(['vimba', 'bream', 'roach', 'smelt', 'perch', 'goby'].map((sp) => `./img/anatomy/${sp}.jpg`));

const OPTIONAL_ASSETS = [
  ...VYALKA_ASSETS,
  './jurmalciems-rybak/manifest-rybak.json',
  './AIM_AGHD_250ELC_Visual_Process_Simulator.html',
  './AIM_AGHD_250ELC_Master_v11_Interactive.html',
  './USB Data Logger_261028_1234.CSV',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Отказоустойчивое кэширование каждого ресурса по отдельности
    await Promise.allSettled(
      [...CORE_ASSETS, ...OPTIONAL_ASSETS].map(async (url) => {
        try {
          const resp = await fetch(url, { cache: 'no-cache' });
          if (resp && (resp.ok || resp.type === 'opaque')) {
            await cache.put(url, resp);
          }
        } catch (_) {
          // Игнорируем отсутствующие опциональные файлы
        }
      })
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 1. Кэширование веб-шрифтов Google Fonts (fonts.googleapis.com и fonts.gstatic.com)
  //    Стратегия: Cache-First со Stale-While-Revalidate обновлением в фоне
  const isGoogleFont =
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  if (isGoogleFont) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) {
        // Фоновое обновление кэша шрифтов
        fetch(req).then((resp) => {
          if (resp && (resp.ok || resp.type === 'opaque')) {
            cache.put(req, resp);
          }
        }).catch(() => {});
        return cached;
      }
      try {
        const networkResp = await fetch(req);
        if (networkResp && (networkResp.ok || networkResp.type === 'opaque')) {
          cache.put(req, networkResp.clone()).catch(() => {});
        }
        return networkResp;
      } catch (err) {
        return cached;
      }
    })());
    return;
  }

  // Для остальных ресурсов проверяем origin приложения
  if (url.origin !== self.location.origin) return;

  // 2. База знаний (папка knowledge/ и её модуль): Network-First — правки файлов видны сразу, офлайн берётся из кэша
  if (url.pathname.includes('/knowledge/') || url.pathname.endsWith('/js/knowledge-base.js')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const networkResp = await fetch(req, { cache: 'no-cache' });
        if (networkResp && networkResp.status === 200) {
          cache.put(req, networkResp.clone()).catch(() => {});
        }
        return networkResp;
      } catch (err) {
        return (await cache.match(req, { ignoreSearch: true })) || Response.error();
      }
    })());
    return;
  }

  // 3. HTML-навигация и ярлыки (с поддержкой ?tab=console, ?tab=batch, ?tab=profit)
  const isHtmlNavigation =
    req.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    url.pathname === '';

  if (isHtmlNavigation) {
    event.respondWith((async () => {
      try {
        const networkResp = await fetch(req);
        if (networkResp && networkResp.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, networkResp.clone()).catch(() => {});
        }
        return networkResp;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(req, { ignoreSearch: true })) ||
          (await cache.match('./index.html', { ignoreSearch: true })) ||
          (await cache.match('./telefon.html', { ignoreSearch: true }))
        );
      }
    })());
    return;
  }

  // 4. Stale-While-Revalidate для локальных CSS/JS/CSV/картинок
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    const networkFetch = fetch(req)
      .then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          cache.put(req, networkResp.clone()).catch(() => {});
        }
        return networkResp;
      })
      .catch(() => cached);

    return cached || networkFetch;
  })());
});
