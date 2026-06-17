const CACHE_NAME = 'diva-mobile-v2';
const ASSETS = [
  '/Simulatore-enpals/DIVA_Mobile_Wizard.html',
  '/Simulatore-enpals/gestione.html'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Per le chiamate al server Render — sempre rete, mai cache
  if(e.request.url.includes('onrender.com')){
    e.respondWith(fetch(e.request).catch(function(){
      return new Response(JSON.stringify({error:'offline'}),{
        headers:{'Content-Type':'application/json'}
      });
    }));
    return;
  }
  // Per tutto il resto — rete prima, cache come fallback
  e.respondWith(
    fetch(e.request)
      .then(function(resp){
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(e.request, clone);
        });
        return resp;
      })
      .catch(function(){
        return caches.match(e.request);
      })
  );
});
