// ══════════════════════════════════════════════════════════════
// FIREBASE CLOUD MESSAGING — notifiche push anche ad app chiusa/in
// background. Aggiunto il 10 luglio 2026 per il promemoria mattutino
// degli appuntamenti di domani (server.py, thread delle 9:00).
// Versione allineata a quella caricata in Nuovo_DIVA_Mobile_Wizard.html:
// se si aggiorna una, aggiornare anche l'altra.
// ══════════════════════════════════════════════════════════════
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCssZVGQk2EZup__CppWWKhQSv7ozOuwq8",
  authDomain: "diva-ac68a.firebaseapp.com",
  projectId: "diva-ac68a",
  storageBucket: "diva-ac68a.firebasestorage.app",
  messagingSenderId: "179797098713",
  appId: "1:179797098713:web:61e4411e29c24700b6fec8"
});

const messaging = firebase.messaging();

// Notifica arrivata ad app chiusa o in background.
messaging.onBackgroundMessage(function(payload){
  var titolo = (payload.notification && payload.notification.title) || 'DIVA';
  var corpo  = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(titolo, {
    body: corpo,
    tag: 'diva-promemoria' // stesso tag = sostituisce una notifica precedente invece di accumularle
  });
});

const CACHE_NAME = 'diva-mobile-v5'; // ← incrementato: bump precedente v4, va sempre incrementato ad ogni deploy
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
