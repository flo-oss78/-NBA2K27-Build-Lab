/* NBA 2K27 Build Lab — Service Worker V24
   Stratégie corrigée :
   - navigations (HTML) : réseau d'abord, cache en secours (plus de page figée après déploiement)
   - assets : stale-while-revalidate (rapide, mais toujours rafraîchi en arrière-plan)
   - /api/ : jamais mis en cache
   - install : addAll tolérant aux 404 (un fichier manquant ne casse plus l'installation)
*/
const VERSION='v25.0.0';
const SHELL_CACHE='nbabl-shell-'+VERSION;
const RUNTIME_CACHE='nbabl-runtime-'+VERSION;

// Les cinq pages du site. Chacune est mise en cache pour être servie hors ligne.
const PAGES=['/','/blueprints/','/hub/','/reference/','/progression/'];

const SHELL=[
  ...PAGES,
  './theme.css','./site-config.js','./builder-data.js',
  './validator.js','./app.js','./optimizer.js','./hub.js','./animations.js',
  './dna-engine.js','./data-registry.js','./data-validation.js','./players-core.js',
  './v15-intelligence.js','./server-client.js','./style-presets.js','./ui.js',
  './blueprints.js','./progression.js','./qr.js','./share.js','./assist.js',
  './build-sheet.js','./community.js',
  './manifest.webmanifest','./favicon.svg','./icon-192.png','./icon-512.png'
];

// Adresses absolues des fichiers de la coquille, pour savoir dans quel cache
// réécrire une réponse fraîche (voir le gestionnaire fetch plus bas).
const SHELL_URLS=new Set(SHELL.map(u=>new URL(u,self.registration.scope).href));

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    await Promise.all(SHELL.map(url=>cache.add(url).catch(()=>{})));
    // Pas de skipWaiting() ici : ui.js affiche une bannière « Mettre à jour »
    // et n'envoie SKIP_WAITING qu'au clic (voir le listener 'message' ci-dessous).
    // Sauter l'attente automatiquement ici rendait cette bannière inopérante et
    // rechargeait la page sous l'utilisateur sans confirmation.
  })());
});

self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==SHELL_CACHE&&k!==RUNTIME_CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(url.pathname.startsWith('/api/'))return;

  // Navigations : réseau d'abord.
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const fresh=await fetch(req);
        // Seule une page du site met à jour sa propre entrée en cache. Les
        // autres navigations (ex. /b/<id>, rendue par une Function) ne doivent
        // écraser aucune page, sous peine de servir une fiche de build à la
        // place du builder une fois hors ligne.
        const page=PAGES.find(p=>url.pathname===p||url.pathname===p+'index.html');
        if(page){
          const cache=await caches.open(SHELL_CACHE);
          cache.put(page,fresh.clone());
        }
        return fresh;
      }catch(err){
        // Hors ligne : la page demandée, sinon le builder comme repli.
        const cached=await caches.match(req)
          ||await caches.match(PAGES.find(p=>url.pathname.startsWith(p)&&p!=='/')||'/')
          ||await caches.match('/');
        return cached||new Response('Hors ligne',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
      }
    })());
    return;
  }

  // Assets : stale-while-revalidate.
  // La réponse fraîche doit être réécrite dans le cache d'où venait la copie
  // servie. Écrire systématiquement dans RUNTIME laissait la copie du SHELL
  // intacte — or caches.match() la trouve en premier : le JS et le CSS de la
  // coquille restaient alors figés indéfiniment chez tout visiteur déjà venu,
  // et aucun déploiement ne les atteignait plus.
  e.respondWith((async()=>{
    const cached=await caches.match(req);
    const target=SHELL_URLS.has(url.href)?SHELL_CACHE:RUNTIME_CACHE;
    const network=fetch(req).then(res=>{
      if(res&&res.ok){
        const copy=res.clone();
        caches.open(target).then(c=>c.put(req,copy));
      }
      return res;
    }).catch(()=>null);
    return cached||(await network)||new Response('',{status:504});
  })());
});
