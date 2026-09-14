/* NBA 2K27 Build Lab — Build Hub et comparateur
   Extrait d'app.js (phase 1). Regroupe tout ce qui touche à la bibliothèque de
   builds : stockage local, liste filtrée, fiche modale, likes, comparateur.

   Ordre de chargement imposé :
   - APRÈS app.js, dont il appelle ratings(), bodyCaps(), validateBuild()…
   - AVANT server-client.js, qui remplace likeBuild et openBuildModal par leurs
     versions serveur et réattache le bouton « Publier mon build ».
*/
/* V10 — Build Hub / Compare / Badge Tokens / Synergy / Takeover Loadout */
const V10_KEY='nba2k27_build_hub_v19';
// Exemples affichés quand le hub est vide, explicitement étiquetés « Démo ».
// Leurs compteurs restent à zéro : afficher 1200 vues et 94 likes identiques sur
// les trois serait de la fausse preuve sociale, exactement ce que ce site
// reproche aux autres builders.
const demoCommunity=[
 {id:'demo-1',name:'6\'8 Two-Way Shot Creator',position:'SG',height:80,weight:210,wing:84,score:89,style:'Équilibré',top:[['Three-Point',92],['Ball Handle',89],['Perimeter Defense',88]],badges:18,source:'Démo locale',validated:false,capBreakers:5,views:0,likes:0,rating:0},
 {id:'demo-2',name:'6\'7 Lockdown Creator',position:'SF',height:79,weight:205,wing:85,score:91,style:'Lockdown',top:[['Perimeter Defense',94],['Steal',91],['Three-Point',86]],badges:21,source:'Démo locale',validated:false,capBreakers:5,views:0,likes:0,rating:0},
 {id:'demo-3',name:'7\'0 Inside-Out Big',position:'C',height:84,weight:245,wing:86,score:88,style:'Big',top:[['Block',93],['Defensive Rebound',92],['Three-Point',82]],badges:17,source:'Démo locale',validated:false,capBreakers:5,views:0,likes:0,rating:0}
];
function readHub(){try{return JSON.parse(localStorage.getItem(V10_KEY)||'[]')}catch(e){return []}}
function writeHub(v){localStorage.setItem(V10_KEY,JSON.stringify(v))}
/* Le hub a sa propre page, sans les contrôles du builder : « Publier mon
   build » doit alors reposer sur le contexte enregistré par le builder
   (attributs, gabarit) plutôt que sur des champs absents. */
function currentBuildObject(){
 const r=ratings();
 const id='b-'+Date.now();
 const elt=id=>document.getElementById(id);
 const ctx=window.NBABL_CONTEXTE?window.NBABL_CONTEXTE():null;
 const surLeBuilder=!!elt('position');

 if(!surLeBuilder){
   if(!ctx)return null;   // aucun build encore composé sur cet appareil
   return {
     id,name:ctx.name||'Mon build',position:ctx.position,
     height:ctx.height,weight:ctx.weight,wing:ctx.wing,
     score:ctx.score||0,style:ctx.style||'Équilibré',
     attributes:r,badges:ctx.badges||0,animations:ctx.animations||0,
     created:Date.now(),views:0,likes:0,rating:0,local:true,
     validated:false,validation:{ok:true,errors:[]},capBreakers:ctx.capBreakers||0
   };
 }

 const caps=bodyCaps();
 const validation=validateBuild(r,caps);
 return {
   id,name:elt('buildname').textContent,position:position.value,
   height:+height.value,weight:+weight.value,wing:+wing.value,
   score:+elt('score').textContent,style:style.value,
   attributes:r,badges:unlockedBadgeCount(),
   animations:unlockedAnimationCount(),
   created:Date.now(),views:0,likes:0,rating:0,local:true,
   validated:false,validation:{ok:validation.errors.length===0,errors:validation.errors},capBreakers:breakerTotalValue()
 };
}
function heightLabel(h){return heightText(+h)}
function hubEmptyMessage(hub){
 const tab=hub?hub.tab():null;
 if(tab==='mine')return 'Aucun build sauvegardé ou publié depuis cet appareil pour l’instant.';
 const filtre=(document.getElementById('communitySearch')?.value||'').trim()
   ||(document.getElementById('communityPos')?.value||'all')!=='all'
   ||(document.getElementById('communityStyle')?.value||'all')!=='all'
   ||document.getElementById('communityValidated')?.checked
   ||document.getElementById('communityCapBreakers')?.checked;
 return filtre?'Aucun build ne correspond à ces filtres.':'Le hub est encore vide. Publie ton build pour ouvrir le bal.';
}
function renderCommunity(){
 const q=(document.getElementById('communitySearch')?.value||'').toLowerCase().trim();
 const pos=document.getElementById('communityPos')?.value||'all';
 const sty=document.getElementById('communityStyle')?.value||'all';
 const validatedOnly=!!document.getElementById('communityValidated')?.checked;
 const cbOnly=!!document.getElementById('communityCapBreakers')?.checked;
 let items=[...readHub(),...demoCommunity].filter(x=>{
   const text=(x.name+' '+(x.style||'')+' '+x.position).toLowerCase();
   return (!q||text.includes(q))
     && (pos==='all'||x.position===pos)
     && (sty==='all'||x.style===sty)
     && (!validatedOnly||x.validated)
     && (!cbOnly||+(x.capBreakers||0)>0);
 });
 // Le tri (et le filtre « Mes builds ») vient des onglets du hub, dans community.js.
 // Repli sur le tri par note si ce fichier n'est pas encore chargé.
 const hub=window.NBABL_HUB;
 items = hub ? hub.sort(hub.tab(), items) : items.sort((a,b)=>(b.score||0)-(a.score||0));
 const list=document.getElementById('communityList'); if(!list)return;
 list.innerHTML=items.map(x=>{
   const top=(x.top||Object.entries(x.attributes||{}).sort((a,b)=>b[1]-a[1]).slice(0,3));
   const status=x.validated?'✓ Validé':'⚠ À vérifier';
   // Seuls les builds réellement en base ont une fiche publique : ne pas
   // proposer /b/<id> pour une démo ou un build resté local (404 assuré).
   const onServer=x.source==='Serveur'||/^build_/.test(x.id||'');
   const quality=window.NBABL_HUB?.quality?.(x);
   const isDemo=x.source==='Démo locale';
   return `<article class="build-card ${x.validated?'is-validated':''}">
     <div class="build-card-top"><div class="build-avatar">${x.position}</div><div><b>${escapeHTML(x.name)}</b>${isDemo?'<span class="build-demo-tag">Démo</span>':''}${quality?`<span class="hub-quality ${quality.cls}">${escapeHTML(quality.t)}</span>`:''}<small>${heightLabel(x.height)} • ${x.weight} lbs • ${heightLabel(x.wing)} ENVG • ${escapeHTML(x.style||'—')}</small></div><strong>${x.score||0}</strong></div>
     <div class="build-status-line"><span class="${x.validated?'ok':'warn'}">${status}</span><span>⭐ ${(x.rating||0).toFixed(1)}</span><span>👁 ${(x.views||0)}</span><span>♥ ${(x.likes||0)}</span></div>
     <div class="build-top-attrs">${top.map(([k,v])=>`<span>${escapeHTML(k)}<b>${v}</b></span>`).join('')}</div>
     <div class="build-card-foot"><span>🏆 ${x.badges||0} badges</span><span>🎯 ${x.animations||0} animations</span><span>🧱 ${x.capBreakers||0} CB</span><button data-open-build="${x.id}">Voir</button><button data-like-build="${x.id}">♥</button><button data-compare-build="${x.id}">Comparer</button>${onServer?`<a class="build-card-link" href="/b/${encodeURIComponent(x.id)}">Fiche publique</a>`:''}</div>
   </article>`;
 }).join('')||`<div class="empty">${hubEmptyMessage(hub)}</div>`;
 list.querySelectorAll('[data-open-build]').forEach(btn=>btn.onclick=()=>openBuildModal(btn.dataset.openBuild));
 list.querySelectorAll('[data-compare-build]').forEach(btn=>btn.onclick=()=>addCompareById(btn.dataset.compareBuild));
 list.querySelectorAll('[data-like-build]').forEach(btn=>btn.onclick=()=>likeBuild(btn.dataset.likeBuild));
}
function likeBuild(id){
 const all=readHub(); const idx=all.findIndex(x=>x.id===id);
 if(idx>=0){all[idx].likes=(all[idx].likes||0)+1;writeHub(all);renderCommunity();return}
 const d=demoCommunity.find(x=>x.id===id); if(d){d.likes=(d.likes||0)+1;renderCommunity()}
}
function openBuildModal(id){
 const x=hubById(id); if(!x)return;
 if(!x.views)x.views=0; x.views++;
 const local=readHub(), idx=local.findIndex(b=>b.id===id);
 if(idx>=0){local[idx].views=x.views;writeHub(local)}
 const attrs=x.attributes||{};
 const top=Object.entries(attrs).sort((a,b)=>b[1]-a[1]).slice(0,6);
 const body=`<div class="modal-kicker">${x.validated?'✓ BUILD VALIDÉ':'⚠ BUILD À VÉRIFIER'}</div>
   <h2>${escapeHTML(x.name)}</h2><p class="sub">${x.position} • ${heightLabel(x.height)} • ${x.weight} lbs • ${heightLabel(x.wing)} envergure • ${escapeHTML(x.style||'—')}</p>
   <div class="modal-stats"><div><b>${x.score||0}</b><span>Moyenne</span></div><div><b>${x.badges||0}</b><span>Badges</span></div><div><b>${x.animations||0}</b><span>Animations</span></div><div><b>${x.capBreakers||0}</b><span>CB</span></div></div>
   <h3>Top attributs</h3><div class="modal-attrs">${top.map(([k,v])=>`<div><span>${escapeHTML(k)}</span><b>${v}</b></div>`).join('')}</div>
   <div class="modal-actions"><button id="modalLoad">Charger ce build</button><button id="modalCompare" class="secondary">Comparer</button><button id="modalShare" class="secondary">Copier le lien</button></div>`;
 document.getElementById('buildModalContent').innerHTML=body;
 const modal=document.getElementById('buildModal');modal.classList.add('open');modal.setAttribute('aria-hidden','false');
 document.getElementById('modalLoad').onclick=()=>{loadHubBuild(id);closeBuildModal()};
 document.getElementById('modalCompare').onclick=()=>{addCompareById(id);closeBuildModal();document.getElementById('compare').scrollIntoView({behavior:'smooth'})};
 document.getElementById('modalShare').onclick=()=>shareBuildObject(x);
}
function closeBuildModal(){const m=document.getElementById('buildModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}
function shareBuildObject(x){
 const payload={position:x.position,height:x.height,weight:x.weight,wing:x.wing,style:x.style,attrs:x.attributes};
 // Toujours vers la page du builder, et base64 encodé (ses « + » deviendraient
 // des espaces dans l'URL, et le build partagé ne se chargerait pas).
 const url=location.origin+'/?build='+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
 navigator.clipboard?.writeText(url).then(()=>alert('Lien du build copié.')).catch(()=>prompt('Copie ce lien :',url));
}

function hubById(id){return [...readHub(),...demoCommunity].find(x=>x.id===id)}
function loadHubBuild(id){
 const x=hubById(id); if(!x)return;
 const obj={position:x.position,height:x.height,weight:x.weight,wing:x.wing,style:x.style,attrs:x.attributes};
 // Le hub a sa propre page : sans builder dans le DOM, on passe par ?build=,
 // le format que app.js lit déjà au chargement (liens de partage).
 if(!document.getElementById('builder')){
   const attrs={}; Object.keys(obj.attrs||{}).forEach(k=>attrs[k]=String(obj.attrs[k]));
   const charge={...obj,attrs,hand:'Droite'};
   location.href='/?build='+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(charge)))));
   return;
 }
 apply(obj);
 location.hash='builder';
 window.scrollTo({top:document.getElementById('builder').offsetTop-80,behavior:'smooth'});
}
function addCurrentToHub(){
 const x=currentBuildObject();
 if(!x){alert('Compose d’abord ton build dans le builder.');location.href='/';return}
 const arr=readHub();arr.unshift(x);writeHub(arr.slice(0,30));renderCommunity();
 alert('Build ajouté à ta bibliothèque locale.');
}

let compareBuilds=[];
function addCompareById(id){const x=hubById(id);if(!x)return;if(compareBuilds.some(b=>b.id===x.id))return;if(compareBuilds.length>=3){alert('Maximum 3 builds.');return}compareBuilds.push(x);renderCompare()}
function renderCompare(){
 const slots=document.getElementById('compareSlots');if(!slots)return;
 slots.innerHTML=[0,1,2].map(i=>{const x=compareBuilds[i];return x?`<div class="compare-slot filled"><b>${x.name}</b><small>${x.position} • ${heightLabel(x.height)} • moy. ${x.score}</small><button data-remove-compare="${x.id}">×</button></div>`:`<div class="compare-slot"><span>Emplacement ${i+1}</span><small>Ajoute un build depuis le Build Hub</small></div>`}).join('');
 slots.querySelectorAll('[data-remove-compare]').forEach(b=>b.onclick=()=>{compareBuilds=compareBuilds.filter(x=>x.id!==b.dataset.removeCompare);renderCompare()});
 const wrap=document.getElementById('compareTable'); if(compareBuilds.length<2){wrap.innerHTML='<div class="empty">Sélectionne au moins 2 builds pour lancer la comparaison.</div>';return}
 const keys=['Close Shot','Driving Layup','Driving Dunk','Three-Point','Mid-Range','Pass Accuracy','Ball Handle','Speed With Ball','Perimeter Defense','Steal','Block','Defensive Rebound','Speed','Agility','Strength','Vertical'];
 wrap.innerHTML=`<table class="compare-table"><thead><tr><th>Attribut</th>${compareBuilds.map(x=>`<th>${x.name}<small>${x.position} • ${heightLabel(x.height)}</small></th>`).join('')}</tr></thead><tbody>${keys.map(k=>`<tr><td>${k}</td>${compareBuilds.map(x=>`<td>${x.attributes?.[k]??'—'}</td>`).join('')}</tr>`).join('')}<tr class="compare-total"><td>Moyenne des attributs</td>${compareBuilds.map(x=>`<td>${x.score}</td>`).join('')}</tr></tbody></table>`;
}

/* Écouteurs et rendu initial, déplacés depuis le bas d'app.js. */
document.getElementById('addCurrentBuild')?.addEventListener('click',addCurrentToHub);
document.getElementById('communitySearch')?.addEventListener('input',renderCommunity);document.getElementById('communityPos')?.addEventListener('change',renderCommunity);
document.getElementById('clearCompare')?.addEventListener('click',()=>{compareBuilds=[];renderCompare()});
document.getElementById('communityStyle')?.addEventListener('change',renderCommunity);
document.getElementById('communityValidated')?.addEventListener('change',renderCommunity);
document.getElementById('communityCapBreakers')?.addEventListener('change',renderCommunity);
document.getElementById('clearCommunityFilters')?.addEventListener('click',()=>{
 document.getElementById('communitySearch').value='';
 document.getElementById('communityPos').value='all';
 document.getElementById('communityStyle').value='all';
 document.getElementById('communityValidated').checked=false;
 document.getElementById('communityCapBreakers').checked=false;
 renderCommunity();
});
document.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',closeBuildModal));

renderCommunity();renderCompare();

// Les onglets du hub (community.js) redemandent un rendu de la liste.
window.renderCommunity=renderCommunity;
