// يحفظ ملفات جدول الأبطال على الجهاز ليفتح بسرعة وبدون إنترنت (البيانات نفسها يحفظها Firestore)
// غيّر رقم الإصدار عند تعديل أي ملف حتى يحدَّث الكاش
const CACHE = 'table-hero-v1';
const FILES = [
  './',
  'index.html',
  'fonts/baloo-bhaijaan-2-arabic.woff2',
  'fonts/baloo-bhaijaan-2-latin.woff2',
  'vendor/qrcode.js',
  'vendor/jsQR.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-apple.png',
];

self.addEventListener('install', e => {
  // reload: تُجلب الملفات من الخادم لا من كاش المتصفح، حتى لا يُحفظ إصدار جديد بملفات قديمة
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// مكتبة Firebase تُحفظ عند أول تحميل ليفتح الجدول لاحقاً حتى بدون إنترنت
const SDK = 'https://www.gstatic.com/firebasejs/';

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith(SDK)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    })));
    return;
  }
  // اتصالات Firebase وتسجيل الدخول تذهب للشبكة مباشرة
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true })
      .then(hit => hit || fetch(e.request))
      .catch(() => caches.match('index.html'))
  );
});
