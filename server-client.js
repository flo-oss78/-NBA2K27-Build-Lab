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

  async function publishCurrent(){
    const build=currentBuildObject();
    const meta=currentBuildMeta();
    if(meta)build.meta=meta;
    try{
      const data=await api('/builds',{method:'POST',body:JSON.stringify(build)});
      const owners=getOwners(); owners[data.build.id]=data.ownerToken; saveOwners(owners);
      mergeServerBuilds([data.build]);
      alert('✅ Build publié sur le serveur. Il est maintenant visible par tout le monde.');
      renderCommunity();
    }catch(e){
      const arr=readHub();arr.unshift(build);writeHub(arr.slice(0,100));renderCommunity();
      alert('⚠️ Serveur indisponible : le build a été sauvegardé localement.\n\n'+e.message);
    }
  }

  async function likeServer(id){
    try{
      const data=await api(`/builds/${encodeURIComponent(id)}/like`,{method:'POST'});
      const arr=readHub(); const i=arr.findIndex(x=>x.id===id); if(i>=0){arr[i].likes=data.likes;writeHub(arr)}
      renderCommunity();
    }catch(e){
      likeBuildLocal(id);
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
      <h2>${esc(x.name)}</h2><p class="sub">${x.position} • ${heightLabel(x.height)} • ${x.weight} lbs • ${heightLabel(x.wing)} envergure • ${esc(x.style||'—')}</p>
      <div class="modal-stats"><div><b>${x.score||0}</b><span>Score</span></div><div><b>${x.badges||0}</b><span>Badges</span></div><div><b>${x.animations||0}</b><span>Animations</span></div><div><b>${x.likes||0}</b><span>Likes</span></div></div>
      <h3>Attributs principaux</h3><div class="modal-attrs">${top.map(([k,v])=>`<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>
      <h3>Commentaires</h3><div id="serverComments">${commentsHtml}</div>
      <form id="serverCommentForm" class="server-comment-form"><input id="commentNick" maxlength="24" placeholder="Ton pseudo"><textarea id="commentBody" maxlength="500" placeholder="Donne ton avis sur ce build…" required></textarea><button>Publier le commentaire</button></form>
      <div class="modal-actions"><button id="modalLoad">Charger ce build</button><button id="modalCompare" class="secondary">Comparer</button><button id="modalShare" class="secondary">Copier le lien</button></div>`;
    document.getElementById('buildModalContent').innerHTML=body;
    const modal=document.getElementById('buildModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    document.getElementById('modalLoad').onclick=()=>{loadHubBuild(id);closeBuildModal()};
    document.getElementById('modalCompare').onclick=()=>{addCompareById(id);closeBuildModal();document.getElementById('compare').scrollIntoView({behavior:'smooth'})};
    document.getElementById('modalShare').onclick=()=>shareBuildObject(x);
    document.getElementById('serverCommentForm').onsubmit=async ev=>{ev.preventDefault();const nickname=document.getElementById('commentNick').value.trim()||'Anonyme';const body=document.getElementById('commentBody').value.trim();if(!body)return;try{await api(`/builds/${encodeURIComponent(id)}/comments`,{method:'POST',body:JSON.stringify({nickname,body})});openServerBuild(id)}catch(e){alert('Impossible de publier : '+e.message)}};
  }

  // Replace the local-only button with server publishing while preserving local fallback.
  const add=document.getElementById('addCurrentBuild');
  if(add){const clone=add.cloneNode(true);add.replaceWith(clone);clone.addEventListener('click',publishCurrent)}

  // Server-aware likes and build details.
  window.likeBuild=likeServer;
  window.openBuildModal=openServerBuild;

  // If a server build is in the local cache, render it immediately while refreshing in background.
  const cached=getServerCache(); if(cached.length) mergeServerBuilds(cached);
  setStatus('SERVEUR : CONNEXION…',false);
  sync();
})();
