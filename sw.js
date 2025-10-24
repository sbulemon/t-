/**
 * Service Worker для кэширования и офлайн работы
 */

const CACHE_NAME = 'famelist-v1';
const STATIC_CACHE = 'famelist-static-v1';
const DATA_CACHE = 'famelist-data-v1';

// Файлы для кэширования
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/sync.js',
  '/js/backup.js',
  '/js/admin.js',
  '/js/script.js'
];

// URL для кэширования данных
const DATA_URLS = [
  '/data/personalities.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Установка');
  
  event.waitUntil(
    Promise.all([
      // Кэшируем статические файлы
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Кэширование статических файлов');
        return cache.addAll(STATIC_FILES);
      }),
      // Кэшируем данные
      caches.open(DATA_CACHE).then(cache => {
        console.log('Service Worker: Кэширование данных');
        return cache.addAll(DATA_URLS);
      })
    ])
  );
  
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Активация');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Удаляем старые кэши
          if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
            console.log('Service Worker: Удаление старого кэша', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Обрабатываем только GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Стратегия для статических файлов
  if (STATIC_FILES.some(file => url.pathname.endsWith(file))) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }
        
        return fetch(request).then(response => {
          // Кэшируем только успешные ответы
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
  
  // Стратегия для данных
  if (DATA_URLS.some(dataUrl => url.pathname.endsWith(dataUrl))) {
    event.respondWith(
      caches.match(request).then(response => {
        // Сначала пытаемся получить из сети
        return fetch(request).then(networkResponse => {
          // Кэшируем успешные ответы
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DATA_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Если сеть недоступна, возвращаем из кэша
          if (response) {
            return response;
          }
          
          // Если нет в кэше, возвращаем заглушку
          return new Response(
            JSON.stringify({ error: 'Данные недоступны в офлайн режиме' }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        });
      })
    );
  }
  
  // Для остальных запросов используем стратегию "сеть сначала"
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_DATA':
      // Кэшируем данные по запросу
      caches.open(DATA_CACHE).then(cache => {
        const response = new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
        cache.put('/data/personalities.json', response);
      });
      break;
      
    case 'CLEAR_CACHE':
      // Очищаем кэш
      caches.delete(DATA_CACHE).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHE_INFO':
      // Получаем информацию о кэше
      caches.open(DATA_CACHE).then(cache => {
        cache.keys().then(keys => {
          event.ports[0].postMessage({
            cacheSize: keys.length,
            cacheNames: keys.map(key => key.url)
          });
        });
      });
      break;
  }
});

// Периодическая синхронизация в фоне
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Выполняем синхронизацию данных
      fetch('/data/personalities.json')
        .then(response => response.json())
        .then(data => {
          // Уведомляем клиент о новых данных
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'DATA_UPDATED',
                data: data
              });
            });
          });
        })
        .catch(error => {
          console.log('Background sync failed:', error);
        })
    );
  }
});

// Обработка push уведомлений (для будущего использования)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Открыть',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Закрыть',
          icon: '/icon-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
