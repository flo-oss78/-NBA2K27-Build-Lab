/* NBA 2K27 Build Lab — Community Server Client
   Cloudflare Pages Functions + D1. Local fallback remains available. */
(function(){
  const API=(window.NBABL_SITE_CONFIG&&window.NBABL_SITE_CONFIG.apiBase)||'/api';
  const SERVER_KEY='nba2k27_server_v1';
  const OWNER_KEY='nba2k27_owner_tokens_v1';
  let serverOnline=false;
  const esc = window.escHtml;
  const setStatus=(txt,ok)=>{const el=document.getElementById('serverStatus');if(el){el.textContent=txt;el.classList.toggle('server-ok',!!ok);}};
  const getOwners=()=>{try{return JSON.parse(localStorage.getItem(OWNER_KEY)||'{}')}catch{return {}}};
  const saveOwners=o=>localStorage.setItem(OWNER_KEY,JSON.stringify(o));
  const getServerCache=()=>{try{return JSON.parse(localStorage.getItem(SERVER_KEY)||'[]')}catch{return []}};
  const saveServerCache=a=>localStorage.setItem(SERVER_KEY,JSON.stringify(a));

  async function api(path,options={}){
    const res=await fetch(API+path,{...options,headers:{'content-type':'application/json',...(options.headers||{})}});
    let data={}; try{data=await res.json()}catch{}
    if(!res.ok) throw new Error(data.error||`HTTP ${res.status}`);
    return data;
  }

  function mergeServerBuilds(builds){
    const local=readHub();
    // Server versions win for server IDs : les entrées serveur sont insérées
    // en dernier, elles écrasent donc déjà les éventuels doublons locaux.
    const map=new Map([...local.map(x=>[x.id,x]),...builds.map(x=>[x.id,{...x,source:'Serveur'}])]);
    writeHub([...map.values()].slice(0,100));
    saveServerCache(builds);
  }

  async function sync(){
    try{
      const q=new URLSearchParams({limit:'100',sort:'new'});
      const data=await api('/builds?'+q.toString());
      serverOnline=true; mergeServerBuilds(data.builds||[]); setStatus('SERVEUR : EN LIGNE',true); renderCommunity();
    }catch(e){
      serverOnline=false; setStatus('SERVEUR : LOCAL',false);
    }
  }

  /* La fiche de build (description, étiquettes, modes, joueur d'inspiration,
     lien NBA 2K HQ, guide Cap Breaker) vivait uniquement dans le localStorage :
     elle n'était jamais transmise, donc la page publique /b/<id> restait vide.
     On la joint maintenant à la publication. */
  function currentBuildMeta(){
    const sheet=window.NBABL_SHEET;
    if(!sheet||typeof sheet.meta!=='function')return null;
    let m={},plan=[];
    try{m=sheet.meta()||{}}catch(e){m={}}
    try{plan=(typeof sheet.cbPlan==='function'?sheet.cbPlan():[])||[]}catch(e){plan=[]}
    return {
      description:m.description||'',
      tags:Array.isArray(m.tags)?m.tags:[],
      modes:Array.isArray(m.modes)?m.modes:[],
      inspiredBy:m.inspired||'',
      hqLink:m.hq||'',
      capBreakerPlan:plan
    };
  }

  const dire=(t,ton)=>{ if(window.NBABL_TOAST)window.NBABL_TOAST(t,ton||'level'); else alert(t); };

  async function publishCurrent(){
    const build=currentBuildObject();
    // Depuis /hub/, sans build encore composé sur cet appareil : on envoie
    // l'utilisateur au builder plutôt que de publier un objet vide.
    if(!build){
      alert('Compose d’abord ton build dans le builder, puis reviens le publier.');
      location.href='/creer/';
      return;
    }
    /* Publier rend le build visible par tout le monde et lui donne une adresse
       publique : ça ne doit pas partir sur un clic distrait, surtout depuis le
       builder où le bouton est sous la main. On dit ce qui part, et où. */
    const taille=Math.floor(build.height/12)+'\''+(build.height%12)+'"';
    if(!confirm('Publier « '+build.name+' » ('+build.position+' '+taille+') dans les builds de la communauté ?\n\n'
      +'Il sera visible par tout le monde et recevra une adresse publique.')) return;

    const meta=currentBuildMeta();
    if(meta)build.meta=meta;
    try{
      const data=await api('/builds',{method:'POST',body:JSON.stringify(build)});
      const owners=getOwners(); owners[data.build.id]=data.ownerToken; saveOwners(owners);
      mergeServerBuilds([data.build]);
      renderCommunity();
      dire('Build publié : il est maintenant dans les builds de la communauté.');
      // Depuis le builder, on propose d'aller le voir : sans ça, rien ne montre
      // que quelque chose s'est passé ailleurs sur le site.
      if(!/^\/hub\//.test(location.pathname)&&data.build&&data.build.id){
        setTimeout(function(){
          if(confirm('Voir ta fiche publique ?')) location.href='/b/'+encodeURIComponent(data.build.id);
        },400);
      }
    }catch(e){
      const arr=readHub();arr.unshift(build);writeHub(arr.slice(0,100));renderCommunity();
      dire('Serveur indisponible : le build est gardé sur cet appareil. '+e.message,'warn');
    }
  }

  /* Le « j'aime » se retire aussi. Cette fonction remplace celle de hub.js
     (voir plus bas, window.likeBuild) : c'est donc ici que l'état doit être
     tenu, sinon le cœur s'allume sans jamais pouvoir s'éteindre et le
     compteur monte à chaque clic de la même personne. */
  async function likeServer(id){
    const aime=typeof dejaAime==='function'?dejaAime(id):false;
    if(typeof noterAime==='function')noterAime(id,!aime);
    renderCommunity();                       // le cœur change tout de suite
    try{
      const data=await api(`/builds/${encodeURIComponent(id)}/like`,{method:aime?'DELETE':'POST'});
      const arr=readHub(); const i=arr.findIndex(x=>x.id===id);
      if(i>=0&&typeof data.likes==='number'){arr[i].likes=data.likes;writeHub(arr)}
      renderCommunity();
    }catch(e){
      // Hors ligne ou serveur muet : on garde le compte en local, sans perdre
      // l'état déjà basculé plus haut.
      const arr=readHub(); const i=arr.findIndex(x=>x.id===id);
      if(i>=0){arr[i].likes=Math.max(0,(arr[i].likes||0)+(aime?-1:1));writeHub(arr)}
      else{const d=demoCommunity.find(x=>x.id===id);if(d)d.likes=Math.max(0,(d.likes||0)+(aime?-1:1))}
      renderCommunity();
    }
  }

  function likeBuildLocal(id){
    const all=readHub(); const idx=all.findIndex(x=>x.id===id);
    if(idx>=0){all[idx].likes=(all[idx].likes||0)+1;writeHub(all);renderCommunity();return}
    const d=demoCommunity.find(x=>x.id===id); if(d){d.likes=(d.likes||0)+1;renderCommunity()}
  }

  async function openServerBuild(id){
    let x=hubById(id), comments=[];
    try{
      const data=await api(`/builds/${encodeURIComponent(id)}`); x=data.build; comments=data.comments||[];
      mergeServerBuilds([x]);
    }catch(e){}
    if(!x)return;
    const attrs=x.attributes||{}; const top=Object.entries(attrs).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const commentsHtml=comments.length?comments.map(c=>`<div class="server-comment"><b>${esc(c.nickname)}</b><span>${new Date(c.created_at).toLocaleDateString('fr-FR')}</span><p>${esc(c.body)}</p></div>`).join(''):'<div class="empty">Pas encore de commentaire.</div>';
    const body=`<div class="modal-kicker">${x.validated?'✓ BUILD VALIDÉ':'⚠ BUILD À VÉRIFIER'} • 🌐 SERVEUR</div>
      <h2>${esc(x.name)}</h2><p class="sub">${esc(x.position)} • ${heightLabel(x.height)} • ${x.weight} lbs • ${heightLabel(x.wing)} envergure • ${esc(x.style||'—')}</p>
      <div class="modal-stats"><div><b>${esc(x.score||0)}</b><span>Moyenne</span></div><div><b>${x.badges||0}</b><span>Badges</span></div><div><b>${x.animations||0}</b><span>Animations</span></div><div><b>${x.likes||0}</b><span>Likes</span></div></div>
      <h3>Attributs principaux</h3><div class="modal-attrs">${top.map(([k,v])=>`<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>
      ${comments.length?`<h3>Commentaires</h3><div id="serverComments">${commentsHtml}</div>`:''}
      <div class="modal-actions"><button id="modalLoad">Charger ce build</button><button id="modalCompare" class="secondary">Comparer</button><button id="modalShare" class="secondary">Copier le lien</button></div>`;
    document.getElementById('buildModalContent').innerHTML=body;
    const modal=document.getElementById('buildModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    document.getElementById('modalLoad').onclick=()=>{loadHubBuild(id);closeBuildModal()};
    document.getElementById('modalCompare').onclick=()=>{addCompareById(id);closeBuildModal();document.getElementById('compare').scrollIntoView({behavior:'smooth'})};
    document.getElementById('modalShare').onclick=()=>shareBuildObject(x);
    // Commentaires fermés pour le lancement : plus de formulaire (voir functions/api/builds/[id]/comments.js).
  }

  /* Publier passe par le serveur, avec repli local. Tous les boutons marqués
     data-publier sont branchés, pas seulement celui du hub : on publie aussi
     depuis la fin du parcours de build, là où l'envie vient. */
  const add=document.getElementById('addCurrentBuild');
  if(add){const clone=add.cloneNode(true);add.replaceWith(clone);clone.addEventListener('click',publishCurrent)}
  document.querySelectorAll('[data-publier]').forEach(function(b){
    b.addEventListener('click',publishCurrent);
  });
  window.NBABL_PUBLIER=publishCurrent;

  // Server-aware likes and build details.
  window.likeBuild=likeServer;
  window.openBuildModal=openServerBuild;

  // If a server build is in the local cache, render it immediately while refreshing in background.
  const cached=getServerCache(); if(cached.length) mergeServerBuilds(cached);
  setStatus('SERVEUR : CONNEXION…',false);
  sync();
})();
