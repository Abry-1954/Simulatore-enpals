const CACHE_NAME = 'diva-mobile-v4'; // ← incrementa ad ogni deploy
const ASSETS = [
  '/Simulatore-enpals/Nuovo_DIVA_Mobile_Wizard.html',
  '/Simulatore-enpals/gestione.html'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Attivazione immediata senza aspettare che le tab vengano chiuse
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); }) // Elimina cache vecchie
      );
    }).then(function(){
      return self.clients.claim(); // Prende controllo immediato di tutte le tab
    })
  );
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

  // Per tutto il resto — rete prima (no-cache), cache come fallback offline
  var freshRequest = new Request(e.request, { cache: 'no-cache' });

  e.respondWith(
    fetch(freshRequest)
      .then(function(resp){
        // Salva in cache solo risposte valide (non errori, non opaque)
        if(resp && resp.status === 200 && resp.type === 'basic'){
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return resp;
      })
      .catch(function(){
        // Offline: serve dalla cache
        return caches.match(e.request);
      })
  );
});
