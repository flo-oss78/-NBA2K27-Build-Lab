/* NBA 2K27 Build Lab — Service Worker V24
   Stratégie corrigée :
   - navigations (HTML) : réseau d'abord, cache en secours (plus de page figée après déploiement)
   - assets : stale-while-revalidate (rapide, mais toujours rafraîchi en arrière-plan)
   - /api/ : jamais mis en cache
   - install : addAll tolérant aux 404 (un fichier manquant ne casse plus l'installation)
*/
const VERSION='v26.14.0';
const SHELL_CACHE='nbabl-shell-'+VERSION;
const RUNTIME_CACHE='nbabl-runtime-'+VERSION;

// Les pages du site, française et anglaise. Chacune est mise en cache pour être
// servie hors ligne.
const PAGES=['/','/hub/','/reference/','/mon-build/','/mentions-legales/',
  '/en/','/en/hub/','/en/reference/','/en/mon-build/','/en/mentions-legales/'];

const SHELL=[
  ...PAGES,
  './theme.css','./hq.css','./hq-builder.js','./attributs-jeu.js','./fonts/BarlowCondensed-600.woff2','./fonts/BarlowCondensed-700.woff2','./fonts/BarlowCondensed-800.woff2','./fonts/Inter-400-700.woff2',
  './site-config.js','./builder-data.js','./badge-icones.js',
  './validator.js','./builds-reels.js','./caps-deduits.js','./app.js','./import-jeu.js','./builds-ui.js','./builds-page.js','./reference-page.js','./optimizer.js','./hub.js','./animations.js',
  './dna-engine.js','./data-registry.js','./data-validation.js','./players-core.js',
  './v15-intelligence.js','./server-client.js','./style-presets.js','./ui.js',
  './blueprints.js','./progression.js','./qr.js','./share.js','./assist.js',
  './build-sheet.js','./community.js','./mon-build.js','./i18n-en.js','./i18n.js',
  './manifest.webmanifest','./favicon.svg','./icon-192.png','./icon-512.png'
];

// Adresses absolues des fichiers de la coquille, pour savoir dans quel cache
// réécrire une réponse fraîche (voir le gestionnaire fetch plus bas).
const SHELL_URLS=new Set(SHELL.map(u=>new URL(u,self.registration.scope).href));

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    // cache.add() passe par le cache HTTP du navigateur, où _headers autorisait
    // jusqu'à 10 minutes de conservation : un service worker fraîchement
    // installé y récupérait les anciens fichiers et figeait une version
    // périmée dans sa propre coquille. cache:'reload' force le réseau.
    await Promise.all(SHELL.map(async url=>{
      try{
        const res=await fetch(url,{cache:'reload'});
        if(res&&res.ok)await cache.put(url,res);
      }catch(e){/* un fichier manquant ne doit pas casser l'installation */}
    }));
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
  //
  // Deux conditions pour qu'un déploiement finisse par atteindre un visiteur
  // déjà venu, et il a fallu les deux :
  //
  // 1. Réécrire la réponse fraîche dans le cache d'où venait la copie servie.
  //    Écrire systématiquement dans RUNTIME laissait la copie du SHELL intacte,
  //    et caches.match() la trouve en premier : elle gagnait à chaque fois.
  //
  // 2. Retenir le worker jusqu'à la fin de cette écriture avec waitUntil().
  //    Sans ça, respondWith() rend la copie en cache, l'événement se termine,
  //    et le navigateur peut arrêter le worker avant que cache.put() ait fini.
  //    La revalidation était donc lancée mais n'aboutissait jamais : le JS et
  //    le CSS restaient figés malgré le point 1.
  const target=SHELL_URLS.has(url.href)?SHELL_CACHE:RUNTIME_CACHE;
  // no-cache : la revalidation doit interroger l'origine, pas se contenter de
  // la copie que le cache HTTP du navigateur juge encore fraîche.
  const network=fetch(new Request(req,{cache:'no-cache'})).then(async res=>{
    if(res&&res.ok){
      const copy=res.clone();
      const cache=await caches.open(target);
      await cache.put(req,copy);
    }
    return res;
  }).catch(()=>null);
  e.waitUntil(network);

  e.respondWith((async()=>{
    const cached=await caches.match(req);
    return cached||(await network)||new Response('',{status:504});
  })());
});
