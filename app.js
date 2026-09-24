const root=document.getElementById('attributeGroups');let inputs=[];
/* Toutes les pages chargent ce noyau, mais seule celle du builder contient
   #attributeGroups. Ailleurs on n'installe ni curseurs ni écouteurs : les
   fonctions restent définies — hub.js et share.js les appellent — mais rien
   ne s'exécute au chargement. */
const BUILDER_PRESENT=!!root;
const CATEGORY_UI={
 Finition:{label:'Finition',cls:'finish',icon:'◉',desc:'Terminer au cercle, layups, dunks et jeu au poste.'},
 Tir:{label:'Tirs',cls:'shoot',icon:'◎',desc:'Mid-range, trois points et lancer franc.'},
 Création:{label:'Organisation',cls:'play',icon:'◇',desc:'Passe, dribble et création balle en main.'},
 Défense:{label:'Défense',cls:'defense',icon:'◆',desc:'Défense au cercle, périmètre, interceptions et contres.'},
 Rebond:{label:'Rebonds',cls:'rebound',icon:'◍',desc:'Rebond offensif et défensif.'},
 Physique:{label:'Qualités physiques',cls:'physical',icon:'✦',desc:'Vitesse, agilité, force et détente.'}
};
function safeGroupId(group){return group.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase()}
if(BUILDER_PRESENT)Object.entries(data).forEach(([group,arr])=>{const ui=CATEGORY_UI[group]||CATEGORY_UI.Finition;let g=document.createElement('div');g.className=`group attr-group group-${ui.cls}`;g.id=`attr-group-${safeGroupId(group)}`;g.dataset.group=group;g.innerHTML=`<div class="group-head ${ui.cls}"><div class="group-title-wrap"><span class="group-icon">${ui.icon}</span><div><h3>${ui.label}</h3><small>${ui.desc}</small></div></div><b class="group-avg" id="avg-${safeGroupId(group)}">0</b></div>`;arr.forEach(([name,val])=>{let id=name.replace(/[^a-z0-9]/gi,'');let d=document.createElement('div');d.className=`attr attr-${ui.cls}`;d.dataset.category=group;d.innerHTML=`<div class="attrhead"><div class="attr-name"><span>${name}</span><small id="cap${id}">CAP 99</small></div><div class="attr-controls"><button type="button" class="attr-step minus" data-target="${id}" aria-label="Diminuer ${name}">−</button><b id="v${id}" class="attr-rating">${val}</b><span id="d${id}" class="attr-delta zero"></span><button type="button" class="attr-step plus" data-target="${id}" aria-label="Augmenter ${name}">+</button></div></div><input class="attribute-range ${ui.cls}" data-group="${group}" data-name="${name}" data-category-class="${ui.cls}" id="i${id}" type="range" min="25" max="99" value="${val}" aria-label="${name}"><div class="thresholds"><span class="threshold-label">Paliers</span>${BADGE_THRESHOLDS.map(t=>`<span data-threshold="${t}">${t}</span>`).join('')}</div>`;g.appendChild(d);inputs.push(d.querySelector('input'));});root.appendChild(g)});
/* Contexte du build courant, partagé entre les pages.
   Le builder n'existe que sur « / », mais /reference/ doit afficher les badges
   et animations accessibles AU BUILD EN COURS. Le builder écrit donc son état
   à chaque rendu, et les autres pages le relisent ici. */
/* Certains compteurs (badgeTotal, animTotal…) vivent dans la section builder
   et n'existent pas sur les autres pages : leur écriture ne doit pas planter. */
function texte(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
const CTX_KEY='nba2k27_ctx_v1';
// touche:false = build par défaut jamais modifié : ce n'est le build de personne.
// Les contextes enregistrés avant ce drapeau (sans « touche ») restent de vrais builds.
function lireContexte(){
  try{const c=JSON.parse(localStorage.getItem(CTX_KEY)||'null');return c&&c.attrs&&c.touche!==false?c:null}catch(e){return null}
}
/* Le build devient le tien quand tu ouvres un lien de build, que tu reprends ton build
   en cours, ou que tu modifies quelque chose (voir plus bas). « Repartir de zéro » le remet à zéro. */
let buildTouche=!/[?&]nouveau=1(&|$)/.test(location.search)&&(/[?&]build=/.test(location.search)||!!lireContexte());
let chargementFini=false;
/* Page « Mon build » sans build en cours : le moteur caché y tourne sur les
   valeurs par défaut, qu'il ne doit pas faire passer pour le build de quelqu'un. */
const MON_BUILD_VIDE=!!document.getElementById('moteurBuild')&&!lireContexte();
/* Le contexte sert aux AUTRES pages (Mon build, Badges) : il n'a pas besoin
   d'être réécrit à chaque pixel de curseur. On le repousse d'un court instant,
   et on l'écrit tout de suite si la page se ferme ou passe à l'arrière-plan. */
let ctxDiffere=null;
function ecrireContexteBientot(){
  if(ctxDiffere)return;
  ctxDiffere=setTimeout(()=>{ctxDiffere=null;ecrireContexte()},400);
}
if(typeof window!=='undefined'){
  const viteEcrit=()=>{if(ctxDiffere){clearTimeout(ctxDiffere);ctxDiffere=null;ecrireContexte()}};
  window.addEventListener('pagehide',viteEcrit);
  window.addEventListener('beforeunload',viteEcrit);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')viteEcrit()});
  // Une navigation interne part souvent d'un clic sur un lien : on écrit avant.
  document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('a[href]'))viteEcrit()},true);
}
function ecrireContexte(){
  if(!BUILDER_PRESENT||MON_BUILD_VIDE)return;
  try{
    localStorage.setItem(CTX_KEY,JSON.stringify({
      attrs:Object.fromEntries(inputs.map(x=>[x.dataset.name,+x.value])),
      height:heightInches(),
      weight:+document.getElementById('weight').value,
      wing:+document.getElementById('wing').value,
      position:document.getElementById('position').value,
      style:document.getElementById('style')?.value||'Équilibré',
      hand:document.getElementById('dominantHand')?.value||'Droite',
      name:document.getElementById('buildname')?.textContent||'Mon build',
      score:+document.getElementById('score')?.textContent||0,
      badges:unlockedBadgeCount(),
      animations:unlockedAnimationCount(),
      capBreakers:breakerTotalValue(),
      touche:buildTouche
    }));
  }catch(e){/* stockage plein ou refusé : sans conséquence */}
}
function ratings(){
  if(!inputs.length){const c=lireContexte();if(c)return {...c.attrs};return {...(window.NBABL_BASE_ATTRIBUTES||{})}}
  let r={};inputs.forEach(x=>r[x.dataset.name]=+x.value);return r;
}
function updateAttributeVisuals(){inputs.forEach(x=>{const pct=Math.max(0,Math.min(100,((+x.value-25)/(+x.max-25))*100));const color=getComputedStyle(document.documentElement).getPropertyValue({'finish':'--cat-finish','shoot':'--cat-shoot','play':'--cat-play','defense':'--cat-defense','rebound':'--cat-rebound','physical':'--cat-physical'}[x.dataset.categoryClass]||'--ui-accent').trim();x.style.setProperty('--attr-color',color);x.style.setProperty('--attr-pct',pct+'%');const card=x.closest('.attr');if(card)card.style.setProperty('--cat-color',color);});}
if(BUILDER_PRESENT)root.querySelectorAll('.attr-step').forEach(btn=>btn.addEventListener('click',()=>{const x=document.getElementById('i'+btn.dataset.target);if(!x)return;const dir=btn.classList.contains('plus')?1:-1;x.value=Math.max(+x.min,Math.min(+x.max,+x.value+dir));x.dispatchEvent(new Event('input',{bubbles:true}));}));
if(BUILDER_PRESENT)root.querySelectorAll('.quicknav-btn').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('.quicknav-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.getElementById('attr-group-'+safeGroupId(btn.dataset.targetGroup))?.scrollIntoView({behavior:'smooth',block:'center'});}));
function heightInches(){
  const el=document.getElementById('height');
  if(el)return +el.value;
  const c=lireContexte(); return c?c.height:78; /* page sans builder : taille du dernier build */
}
function heightText(h){return `${Math.floor(h/12)}'${h%12}"`}
function cmOf(inches){return Math.round(inches*2.54)}
function kgOf(lbs){return Math.round(lbs*0.45359237)}
function updateProfileLabels(){const h=heightInches(),w=+document.getElementById('weight').value,wg=+document.getElementById('wing').value;document.getElementById('heightOut').textContent=`${heightText(h)} (${cmOf(h)} cm)`;document.getElementById('weightOut').textContent=`${w} lbs (${kgOf(w)} kg)`;document.getElementById('wingOut').textContent=`${heightText(wg)} (${cmOf(wg)} cm)`}
/* Build recopié depuis le jeu (import-jeu.js). Ses plafonds ne valent que pour
   le gabarit importé : on renvoie null dès que poste, taille, poids ou
   envergure ont changé. */
const IMPORT_JEU_KEY='nba2k27_import_jeu_v1';
function importJeuActif(){
 if(!document.getElementById('height'))return null;
 try{
  const j=JSON.parse(localStorage.getItem(IMPORT_JEU_KEY)||'null');
  if(!j||!j.max)return null;
  const v=id=>document.getElementById(id).value;
  const corps=[v('position'),+v('height'),+v('weight'),+v('wing')].join('|');
  return corps===j.corps?j:null;
 }catch(e){return null}
}
function bodyCaps(){
 const h=heightInches(),w=+document.getElementById('weight').value,wing=+document.getElementById('wing').value,pos=document.getElementById('position').value;
 const wingEl=document.getElementById('wing');
 // BUG CORRIGÉ : quand h+2 dépassait le max du slider, la valeur restait clampée
 // et bodyCaps() se rappelait indéfiniment (dépassement de pile dès 7'1").
 const wingMax=+wingEl.max, wingMin=+wingEl.min;
 // Corps autorisés par le jeu (builds-reels.js) : la taille dépend du poste, le
 // poids et l'envergure de la taille. Sans cette table, ancienne règle approchée.
 const tableCorps=typeof CORPS_LEGAUX!=='undefined'?CORPS_LEGAUX[pos]:null;
 if(tableCorps&&!tableCorps[h]){
  const tailles=Object.keys(tableCorps).map(Number), heightEl=document.getElementById('height');
  const hc=Math.min(Math.max(h,Math.min(...tailles)),Math.max(...tailles));
  if(hc!==h){heightEl.value=hc;if(+heightEl.value===hc)return bodyCaps()}
 }
 const legal=tableCorps?corpsLegal(pos,h):null;
 if(legal){
  const weightEl=document.getElementById('weight');
  if(w<legal.poidsMin||w>legal.poidsMax){weightEl.value=Math.min(Math.max(w,legal.poidsMin),legal.poidsMax);if(+weightEl.value!==w)return bodyCaps()}
 }
 const minWing=legal?legal.envMin:Math.max(wingMin,Math.min(wingMax,h+2)), maxWing=legal?legal.envMax:Math.min(wingMax,h+6);
 if(wing<minWing){wingEl.value=minWing; if(+wingEl.value>wing)return bodyCaps()}
 if(wing>maxWing){wingEl.value=maxWing; if(+wingEl.value<wing)return bodyCaps()}
 const size=h-80, wingBonus=Math.max(-3,Math.min(3,(wing-h-2)-2)), weightBonus=(w-210)/35;
 let caps={};inputs.forEach(x=>caps[x.dataset.name]=99);
 const lower=(name,delta)=>caps[name]=Math.round(Math.max(35,Math.min(99,99+delta)));
 lower('Speed',-Math.max(0,size*2.0+Math.max(0,weightBonus)*4)); lower('Agility',-Math.max(0,size*1.7+Math.max(0,weightBonus)*3)); lower('Ball Handle',-Math.max(0,size*1.1+Math.max(0,wingBonus)*2)); lower('Speed With Ball',-Math.max(0,size*1.2+Math.max(0,weightBonus)*2));
 caps['Three-Point']=Math.round(Math.max(75,99-size*0.8-wingBonus*2)); caps['Mid-Range']=Math.round(Math.max(78,99-size*0.5-wingBonus)); caps['Driving Dunk']=Math.round(Math.max(70,99-size*0.5-wingBonus*1.5)); caps['Driving Layup']=Math.round(Math.max(75,99-size*0.2-wingBonus)); caps['Standing Dunk']=Math.round(Math.max(70,99-Math.max(0,-size)*1.5));
 caps['Perimeter Defense']=Math.round(Math.max(72,99-size*0.5-wingBonus*-1)); caps['Steal']=Math.round(Math.max(70,99-size*0.3-wingBonus*-1)); caps['Block']=Math.round(Math.max(70,99+size*1.1+wingBonus*1.5)); caps['Interior Defense']=Math.round(Math.max(70,99+size*0.7+weightBonus*1.2)); caps['Defensive Rebound']=Math.round(Math.max(70,99+size*0.9+wingBonus*1.5)); caps['Offensive Rebound']=Math.round(Math.max(65,99+size*0.8+weightBonus*1.5)); caps['Strength']=Math.round(Math.max(70,99+weightBonus*5+size*0.6)); caps['Vertical']=Math.round(Math.max(70,99-size*0.9)); caps['Close Shot']=Math.round(Math.max(78,99+size*0.1)); caps['Post Control']=Math.round(Math.max(70,99+size*0.7+weightBonus*1.2));
 if(pos==='PG'){caps['Driving Dunk']-=4;caps['Block']-=8;caps['Interior Defense']-=5} if(pos==='C'){caps['Ball Handle']-=10;caps['Speed With Ball']-=8;caps['Block']+=2;caps['Defensive Rebound']+=2} if(pos==='PF'){caps['Ball Handle']-=4;caps['Three-Point']-=2} if(pos==='SG'){caps['Block']-=3}
 const estimes=Object.fromEntries(Object.entries(caps).map(([k,v])=>[k,Math.max(40,Math.min(99,Math.round(v)))]));
 // Plafonds lus dans le jeu : ils priment sur l'estimation, Cap Breakers
 // compris. Appliqués APRÈS le plancher de 40, qu'un vrai Max peut descendre.
 // Plafonds connus pour ce corps (builds réels et Blueprints officiels).
 // Niveau de fiabilité affiché dans le builder : exact (corps relevé), déduit
 // (entre des corps relevés de la même taille, caps-deduits.js) ou approximatif.
 const connus=typeof capsConnus==='function'?capsConnus(h,w,wing):null;
 let niveau='approx';
 if(connus&&connus.exacts){for(const [k,m] of Object.entries(connus.caps))if(k in estimes)estimes[k]=m;niveau='exact'}
 else{
   const deduits=typeof capsDeduits==='function'?capsDeduits(h,w,wing):null;
   if(deduits){for(const [k,m] of Object.entries(deduits))if(k in estimes)estimes[k]=m;niveau='deduit'}
   // Un build réel de ce corps garantit un plancher : le plafond est au moins sa note.
   if(connus)for(const [k,m] of Object.entries(connus.caps))if(k in estimes)estimes[k]=Math.max(estimes[k],m);
 }
 const jeu=importJeuActif();
 if(jeu){for(const [k,m] of Object.entries(jeu.max))if(k in estimes)estimes[k]=Math.min(99,m+getBreaker(k));niveau='import'}
 window.NBABL_PLAFONDS=niveau;
 return estimes;
}
/* Points d'attributs : le jeu en donne un nombre fini et refuse qu'on monte tout
   au maximum. Le site s'arrête au même endroit — 100 % des points estimés pour
   ce corps — parce que lire « 138 % » sans être arrêté ne dit pas à un joueur
   que son build est impossible à recopier en jeu.
   Deux garde-fous : on ne bloque qu'une HAUSSE (un build recopié du jeu peut
   dépasser notre estimation, il doit rester modifiable), et la limite ne
   s'applique qu'aux gestes du joueur, jamais à un build qu'on charge. */
const notesAvant={};
function memoriserNotes(){inputs.forEach(x=>notesAvant[x.dataset.name]=+x.value)}
function limiterAuBudget(x){
  if(typeof maxSelonBudget!=='function')return false;
  const nom=x.dataset.name, avant=notesAvant[nom], demandee=+x.value;
  if(avant===undefined||demandee<=avant)return false;
  const max=maxSelonBudget(document.getElementById('position').value,heightInches(),
    +document.getElementById('weight').value,+document.getElementById('wing').value,ratings(),nom);
  if(max===null)return false;
  // Un build déjà au-dessus de l'estimation ne monte plus, mais ne redescend pas de force.
  const permis=Math.max(avant,max);
  if(demandee<=permis)return false;
  x.value=permis;
  return true;
}
/* Franchir un seuil utile mérite d'être dit : sinon le joueur monte un attribut
   sans savoir qu'il vient d'ouvrir un badge ou une animation. On l'annonce à la
   fin du geste — pas à chaque pixel du curseur — en comparant à la note d'avant. */
let serieGeste=null, serieMinuteur=null;
function suivrePalier(x){
  if(!window.NBABL_PALIERS)return;
  const nom=x.dataset.name;
  if(!serieGeste||serieGeste.nom!==nom)serieGeste={nom,avant:notesAvant[nom]};
  clearTimeout(serieMinuteur);
  serieMinuteur=setTimeout(annoncerPalier,450);
}
function annoncerPalier(){
  const s=serieGeste; serieGeste=null;
  if(!s||s.avant===undefined)return;
  const x=inputs.find(i=>i.dataset.name===s.nom);
  if(!x||+x.value<=s.avant)return;
  let gains=[];
  try{ gains=window.NBABL_PALIERS.franchis(s.nom,s.avant,+x.value,ratings(),heightInches()); }catch(e){ return }
  if(!gains.length||!window.NBABL_TOAST)return;
  const liste=gains.slice(0,2).map(g=>g.texte).join(' · ');
  window.NBABL_TOAST('Nouveau palier : '+liste+(gains.length>2?' et '+(gains.length-2)+' de plus':''),'palier');
}
let dernierSignalBudget=0;
/* Un curseur qui refuse de monter doit le dire là où le joueur regarde,
   c'est-à-dire sur l'attribut qu'il est en train de pousser. Le message en haut
   de page ne suffit pas : on a le nez sur son curseur, pas sur l'en-tête. */
function signalerBudgetPlein(x){
  if(x){
    const carteAttr=x.closest('.attr');
    if(carteAttr){
      carteAttr.classList.remove('attr-bloque'); void carteAttr.offsetWidth;
      carteAttr.classList.add('attr-bloque');
      let mot=carteAttr.querySelector('.attr-bloque-mot');
      if(!mot){
        mot=document.createElement('small');
        mot.className='attr-bloque-mot';
        mot.setAttribute('role','status');
        carteAttr.appendChild(mot);
      }
      mot.textContent='Plus de points : baisse un autre attribut.';
      clearTimeout(carteAttr._motMinuteur);
      carteAttr._motMinuteur=setTimeout(()=>{
        carteAttr.classList.remove('attr-bloque');
        if(mot.isConnected)mot.textContent='';
      },2600);
    }
  }
  const t=Date.now(); if(t-dernierSignalBudget<2500)return; dernierSignalBudget=t;
  const carte=document.getElementById('budgetEstime');
  if(carte&&!carte.hidden){carte.classList.remove('budget-plein');void carte.offsetWidth;carte.classList.add('budget-plein')}
  if(window.NBABL_TOAST)window.NBABL_TOAST('Plus de points d’attributs : baisse un autre attribut pour monter celui-ci.','warn');
}
/* Le builder s'ouvre vierge : on le dit, et on propose un exemple à ceux qui
   préfèrent partir d'un build déjà rempli. */
function buildEstVierge(){
  const mini=typeof NOTE_MINI!=='undefined'?NOTE_MINI:25;
  return inputs.length>0&&inputs.every(x=>+x.value<=mini);
}
function majBuildVierge(){
  const el=document.getElementById('buildVierge');
  if(el)el.hidden=!buildEstVierge();
}
function chargerExemple(){
  if(typeof BUILD_EXEMPLE==='undefined')return;
  apply({position:document.getElementById('position').value,height:heightInches(),
    weight:+document.getElementById('weight').value,wing:+document.getElementById('wing').value,
    style:document.getElementById('style').value,attrs:{...BUILD_EXEMPLE}});
  if(window.NBABL_TOAST)window.NBABL_TOAST('Build d’exemple chargé. Tout reste modifiable.','level');
}
function clampInputsToCaps(caps){inputs.forEach(x=>{let cap=caps[x.dataset.name]??99;x.max=cap;if(+x.value>cap)x.value=cap;let id=x.dataset.name.replace(/[^a-z0-9]/gi,'');document.getElementById('cap'+id).textContent='CAP '+cap})}
function scoreGrade(s){return s>=86?'S':s>=82?'A+':s>=78?'A':s>=74?'A-':s>=70?'B+':s>=66?'B':s>=62?'B-':s>=56?'C':'D'}
function buildName(vals){let tags=[];if(vals.Tir>=88)tags.push('Sharpshooter');if(vals.Création>=88)tags.push('Creator');if(vals.Défense>=88)tags.push('Two-Way');if(vals.Finition>=88)tags.push('Slasher');if(vals.Physique>=88)tags.push('Athletic');if(vals.Rebond>=88)tags.push('Glass Cleaner');return tags.length?tags.slice(0,3).join(' '):'Two-Way Creator'}

const referenceBuilds=[
 {name:'2-Way Faceup Rim Rocker',pos:['SF','PF'],h:77,w:250,wing:82,vals:{'Driving Dunk':88,'Three-Point':89,'Pass Accuracy':80,'Ball Handle':86,'Speed With Ball':86,'Interior Defense':85,'Perimeter Defense':82,'Steal':60,'Block':70,'Defensive Rebound':82,'Speed':82,'Agility':78,'Strength':81,'Vertical':90}},
 {name:'Middy Ball Hawk',pos:['SG'],h:79,w:192,wing:82,vals:{'Mid-Range':88,'Three-Point':83,'Driving Dunk':76,'Pass Accuracy':77,'Ball Handle':86,'Speed With Ball':83,'Interior Defense':85,'Perimeter Defense':75,'Steal':90,'Block':78,'Speed':82,'Agility':78,'Strength':75,'Vertical':78}},
 {name:'Shot-Creating Two-Way',pos:['PG','SG'],h:73,w:190,wing:76,vals:{'Driving Layup':88,'Mid-Range':92,'Three-Point':88,'Pass Accuracy':80,'Ball Handle':90,'Speed With Ball':88,'Perimeter Defense':85,'Steal':85,'Speed':90,'Agility':90,'Strength':60,'Vertical':75}}
];
function categoryAverages(r){let out={};Object.entries(data).forEach(([g,arr])=>out[g]=Math.round(arr.reduce((sum,[n])=>sum+(r[n]||0),0)/arr.length));return out}
function renderScouting(r,vals){if(!document.getElementById("strengths"))return; /* section absente de cette page */
 const pairs=Object.entries(vals).sort((a,b)=>b[1]-a[1]);
 document.getElementById('strengths').innerHTML=pairs.slice(0,3).map(([k,v])=>`<span>${k} <b>${v}</b></span>`).join('');
 document.getElementById('weaknesses').innerHTML=pairs.slice(-3).reverse().map(([k,v])=>`<span>${k} <b>${v}</b></span>`).join('');
 const ranked=referenceBuilds.map(ref=>{let score=0,total=0;for(const [k,v] of Object.entries(ref.vals)){if(r[k]!=null){score+=Math.max(0,100-Math.abs(r[k]-v)*3);total+=100}}let body=100-Math.abs(heightInches()-ref.h)*2-Math.abs((+weight.value)-ref.w)*.12-Math.abs((+wing.value)-ref.wing)*2;score=(score/Math.max(1,total))*80+Math.max(0,body)*.2; if(ref.pos.includes(position.value))score+=5;return {...ref,score:Math.min(100,Math.round(score))}}).sort((a,b)=>b.score-a.score);
 const best=ranked[0];document.getElementById('referenceBuild').textContent=`${best.name} • ${best.pos.join('/')} • ${heightText(best.h)} • ${best.w} lbs • ${heightText(best.wing)} envergure`;document.getElementById('referenceScore').textContent=best.score+'%';
 const styleScore={Shooter:vals.Tir,Playmaker:vals.Création,Lockdown:vals.Défense,Slasher:vals.Finition,Big:(vals.Défense+vals.Rebond+vals.Physique)/3,Équilibré:(Object.values(vals).reduce((a,b)=>a+b,0)/5)};
 const bestStyle=Object.entries(styleScore).sort((a,b)=>b[1]-a[1])[0];document.getElementById('recommendedStyle').textContent=bestStyle[0];document.getElementById('scoutVerdict').textContent=scoreGrade(Math.round(bestStyle[1]))+' • '+Math.round(bestStyle[1])+'/100';
 document.getElementById('scoutText').textContent=`Ton profil est surtout orienté ${bestStyle[0].toLowerCase()}. Le rapport compare automatiquement tes attributs, ton poste et ton gabarit à plusieurs profils de référence. Les profils de référence sont des exemples publics, pas des builds officiels imposés par 2K.`;
}
function exportBuild(){const obj={schemaVersion:23,dataVersion:window.NBABL_DATA_REGISTRY?.DATA_VERSION||null,position:position.value,height:height.value,weight:weight.value,wing:wing.value,style:style.value,hand:handValue(),attributes:ratings(),badges:unlockedBadgeCount(),animations:unlockedAnimationCount(),capBreakers:breakerTotalValue(),moyenneAttributs:document.getElementById('score').textContent,name:document.getElementById('buildname').textContent,date:new Date().toISOString()};const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nba2k27-build.json';a.click();URL.revokeObjectURL(a.href)}
document.getElementById('exportBuild')?.addEventListener('click',exportBuild);

function simulatedCost(r){return Math.round(Object.entries(r).reduce((sum,[name,v])=>sum+Math.max(0,v-25)*(COST_WEIGHT[name]||1),0));}
/* Allume les paliers atteints sous chaque curseur. (Cette fonction affichait
   aussi un « budget indicatif » de 1000 points, retiré : il était inventé.) */
function updateThresholds(){inputs.forEach(x=>{const id=x.dataset.name.replace(/[^a-z0-9]/gi,'');document.querySelectorAll('#i'+id+' + .thresholds span').forEach(s=>s.classList.toggle('hit',+x.value>=+s.dataset.threshold))})}
let attrBaseline={};
function setAttributeBaseline(map){attrBaseline=map||{};updateAttributeDeltas()}
function updateAttributeDeltas(){
 inputs.forEach(x=>{
  const id=x.dataset.name.replace(/[^a-z0-9]/gi,'');
  const el=document.getElementById('d'+id);
  if(!el)return;
  const base=attrBaseline[x.dataset.name];
  if(base==null){el.textContent='';el.className='attr-delta zero';return}
  const d=+x.value-base;
  el.textContent=d===0?'–':(d>0?'+'+d:String(d));
  el.className='attr-delta'+(d===0?' zero':(d<0?' neg':''));
 });
}
function update(){
 if(!BUILDER_PRESENT)return; /* page sans builder */
 updateProfileLabels();const caps=bodyCaps();clampInputsToCaps(caps);memoriserNotes();const r=ratings();updateThresholds();let sums={};Object.keys(data).forEach(k=>sums[k]=[]);inputs.forEach(x=>{document.getElementById('v'+x.dataset.name.replace(/[^a-z0-9]/gi,'')).textContent=x.value;sums[x.dataset.group].push(+x.value)});let avg=k=>Math.round(sums[k].reduce((a,b)=>a+b,0)/sums[k].length),vals={Finition:avg('Finition'),Tir:avg('Tir'),Création:avg('Création'),Défense:avg('Défense'),Rebond:avg('Rebond'),Physique:avg('Physique')};Object.entries(vals).forEach(([k,v])=>{const el=document.getElementById('avg-'+safeGroupId(k));if(el)el.textContent=v;});updateAttributeVisuals();const SCORE_W={Finition:1,Tir:1,Création:1,Défense:1,Rebond:.6,Physique:1};let wsum=0,wtot=0;Object.keys(vals).forEach(k=>{const w=SCORE_W[k]||1;wsum+=vals[k]*w;wtot+=w});let score=Math.round(wsum/wtot);document.getElementById('score').textContent=score;const ring=document.querySelector('.summary-ring');if(ring)ring.style.setProperty('--score-pct',Math.max(0,Math.min(100,score))+'%');texte('badgeReachable',unlockedBadgeCount(r));let nm=buildName(vals);document.getElementById('buildname').textContent=nm;const meta=document.getElementById('buildMeta');if(meta)meta.textContent=`${document.getElementById('position').value} • ${heightText(heightInches())} • ${document.getElementById('weight').value} lbs`;for(const [k,v] of Object.entries(vals)){let id={Finition:'finish',Tir:'shoot',Création:'play',Défense:'def',Rebond:'reb',Physique:'phys'}[k];const ve=document.getElementById(id+'Val');if(ve)ve.textContent=v;const be=document.getElementById(id+'Bar');if(be)be.style.width=v+'%'}updateAttributeDeltas();
 let capped=inputs.filter(x=>+x.value>=+(x.max||99)).length;document.getElementById('capStatus').textContent=`${capped} / ${inputs.length} au cap`;document.getElementById('bodyHint').textContent=`${document.getElementById('position').value} • ${heightText(heightInches())} • ${heightText(+document.getElementById('wing').value)} envergure — les maximums des attributs changent avec le gabarit.`;renderBadges(r);renderTakeovers(r);renderBreakers(r);texte('breakerTotal',breakerTotalValue());renderAnimations();renderScouting(r,vals);renderValidation(r,caps);majBuildVierge();ecrireContexteBientot();
}
function badgeTier(def,r){
 const h=heightInches();
 if(h<def.minH||h>def.maxH) return {tier:'Non disponible',cls:'none',level:0,missing:`Taille requise : ${Math.floor(def.minH/12)}'${def.minH%12}"–${Math.floor(def.maxH/12)}'${def.maxH%12}"`};
 const tiers=['Bronze','Argent','Or','Hall of Fame'];
 const okAt=(idx)=>def.req[def.logic==='OR'?'some':'every'](q=>(r[q[0]]||0)>= (q[idx+1] ?? 999));
 let level=0; for(let i=0;i<4;i++){if(okAt(i)) level=i+1;}
 return level?{tier:tiers[level-1],cls:['bronze','silver','gold','hof'][level-1],level}:{tier:'Non débloqué',cls:'none',level:0};
}
function badgeIcon(cat){return ({Tir:'🎯',Création:'🪄',Finition:'🔥',Défense:'🛡️',Rebond:'🏀',Physique:'⚡'}[cat]||'🏅')}
function renderBadges(r){if(!document.getElementById("badgeList"))return; /* section absente de cette page */
 const filter=document.getElementById('badgeFilter').value,search=document.getElementById('badgeSearch').value.toLowerCase().trim();
 const source=getDataQuality?.('badges');
 const sourceEl=document.getElementById('badgeDataSource');
 if(sourceEl&&source){
   const label=dataQualityLabel?.('badges')||source.confidence;
   sourceEl.innerHTML=`📚 Source badges : <a href="${source.sourceUrl}" target="_blank" rel="noopener noreferrer">${source.source}</a> · <strong>${label}</strong> · ${badgeDefs.length}/53 badges intégrés. Noms et descriptions officiels du jeu en français (relevés dans l’app NBA 2K HQ), nom anglais sous chacun.`;
 }

 const CATS=['Finition','Tir','Création','Défense','Rebond','Physique'];
 const CAT_CLS={Finition:'finish',Tir:'shoot',Création:'play',Défense:'defense',Rebond:'rebound',Physique:'physical'};
 const PALIERS=['Bronze','Argent','Or','Hall of Fame'], PAL_CLS=['bronze','silver','gold','hof'];
 const catBox=document.getElementById('badgeCats'), cat=catBox?.dataset.cat||'all';
 const m=p=>(p*0.0254).toFixed(2).replace('.',',')+' m';
 const nomA=n=>typeof nomAttribut==='function'?nomAttribut(n):n;
 let list=document.getElementById('badgeList'),unlocked=0,html='',groupe='';
 const parCat={};CATS.forEach(c=>parCat[c]=[0,0]);
 badgeDefs.forEach(def=>{const ok=badgeTier(def,r).level>0;if(parCat[def.cat]){parCat[def.cat][1]++;if(ok)parCat[def.cat][0]++}});
 if(catBox)catBox.innerHTML=`<button type="button" data-cat="all" aria-pressed="${cat==='all'}">Toutes</button>`+
   CATS.map(c=>`<button type="button" class="cat-${CAT_CLS[c]}" data-cat="${c}" aria-pressed="${cat===c}">${c} <b>${parCat[c][0]}/${parCat[c][1]}</b></button>`).join('');
 const h=heightInches();
 [...badgeDefs].sort((a,b)=>CATS.indexOf(a.cat)-CATS.indexOf(b.cat)).forEach(def=>{
  const st=badgeTier(def,r), ok=st.level>0; if(ok)unlocked++;
  if((filter==='unlocked'&&!ok)||(filter==='locked'&&ok)||(cat!=='all'&&def.cat!==cat)||(search&&!badgeCorrespond(def.name,search)))return;
  if(cat==='all'&&!search&&def.cat!==groupe){groupe=def.cat;html+=`<h2 class="badge-groupe cat-${CAT_CLS[def.cat]}">${def.cat}</h2>`}
  const horsTaille=h<def.minH||h>def.maxH;
  const lignes=def.req.map(q=>{const v=r[q[0]]||0;
    return `<div class="req-ligne"><span>${escapeHTML(nomA(q[0]))}</span><b>${v}</b>${[1,2,3,4].map(i=>q[i]==null?'<i class="vide">—</i>':`<i class="${v>=q[i]?'ok':''}">${q[i]}</i>`).join('')}</div>`}).join('');
  let suite='';
  if(horsTaille)suite=`Réservé aux joueurs de ${m(def.minH)} à ${m(def.maxH)}.`;
  else if(st.level>=4)suite='Palier maximal atteint.';
  else{
   const idx=st.level+1, manques=def.req.filter(q=>q[idx]!=null).map(q=>[q[0],q[idx]-(r[q[0]]||0)]).filter(x=>x[1]>0);
   if(!def.req.some(q=>q[idx]!=null))suite='Palier maximal pour ce badge.';
   else if(def.logic==='OR'){const x=manques.sort((a,b)=>a[1]-b[1])[0];suite=x?`Pour ${PALIERS[st.level]} : ${escapeHTML(nomA(x[0]))} +${x[1]}.`:''}
   else suite=manques.length?`Pour ${PALIERS[st.level]} : `+manques.map(x=>`${escapeHTML(nomA(x[0]))} +${x[1]}`).join(' et ')+'.':'';
  }
  html+=`<article class="badge-card cat-${CAT_CLS[def.cat]||'none'} ${st.cls} ${ok?'unlocked':''}">
   <div class="badge-photo ${st.cls}" role="img" aria-label="${nomBadge(def.name)} (${def.name}) — ${st.tier}">${typeof iconeBadge==='function'?iconeBadge(def.name,def.cat,st.level):`<span aria-hidden="true">${badgeIcon(def.cat)}</span>`}</div>
   <div class="badge-titre"><div class="badge-names">${nomBadgeHTML(def.name)}</div><span class="badge-category">${def.cat}</span></div>
   <span class="badge-tier ${st.cls}">${horsTaille?'Hors taille':ok?st.tier:'Pas encore'}</span>
   ${BADGE_DESC_FR[def.name]?`<p class="badge-desc">${escapeHTML(BADGE_DESC_FR[def.name])}</p>`:`<p class="badge-desc manquante">Description du jeu pas encore relevée.</p>`}
   <div class="badge-paliers" aria-label="Palier atteint : ${ok?st.tier:'aucun'}">${PALIERS.map((p,i)=>`<span class="${PAL_CLS[i]} ${st.level>i?'atteint':''}">${i===3?'HOF':p}</span>`).join('')}</div>
   <div class="badge-reqs"><div class="req-ligne req-tete"><span>Attribut</span><span>Toi</span><i>B</i><i>A</i><i>O</i><i>HOF</i></div>${lignes}
   ${def.req.length>1?`<p class="req-logique">${def.logic==='OR'?'Un seul de ces attributs suffit.':'Tous ces attributs sont requis.'}</p>`:''}</div>
   ${suite?`<p class="badge-next">${suite}</p>`:''}
   </article>`;
 });
 list.innerHTML=html||'<div class="empty">Aucun badge dans ce filtre.</div>';
 texte('badgeUnlocked',unlocked+' accessibles'); texte('badgeTotal',badgeDefs.length);
}

function renderTakeovers(r){if(!document.getElementById("takeoverList"))return; /* section absente de cette page */let list=document.getElementById('takeoverList'),scores=takeoverDefs.map(([name,attr,need])=>({name,attr,need,score:Math.min(100,Math.round((r[attr]||0)/need*100))})).sort((a,b)=>b.score-a.score);list.innerHTML=scores.map(x=>`<button class="takeover ${x.score>=100?'ready':''}" data-take="${x.name}"><span>${x.name}<small>${x.attr} requis : ${x.need}</small></span><b>${x.score}%</b></button>`).join('');texte('takeoverScore',scores[0].score+' / 100');list.querySelectorAll('.takeover').forEach(b=>b.onclick=()=>{list.querySelectorAll('.takeover').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')})}
function buildBodySignature(){
 const p=[position.value,height.value,weight.value,wing.value].join('|');
 let h=0; for(let i=0;i<p.length;i++) h=((h<<5)-h+p.charCodeAt(i))|0;
 return 'v19_'+Math.abs(h).toString(36);
}
function breakerStorageKey(attr){return 'nba2k27_cb_'+buildBodySignature()+'_'+attr.replace(/[^a-z0-9]/gi,'');}
function tokenStorageKey(){return 'nba2k27_tokens_'+buildBodySignature();}
function getBreaker(attr){return +(localStorage.getItem(breakerStorageKey(attr))||0)}
function setBreaker(attr,value){localStorage.setItem(breakerStorageKey(attr),String(Math.max(0,Math.min(5,Math.round(value)))))}
function renderBreakers(r){if(!document.getElementById("breakerList"))return; /* section absente de cette page */
 const list=document.getElementById('breakerList');
 list.innerHTML=inputs.map(x=>{
  const id=x.dataset.name.replace(/[^a-z0-9]/gi,''), used=+(getBreaker(x.dataset.name)||0), cap=+x.max;
  return `<div class="breaker-row"><div><b>${nomAttribut(x.dataset.name)}</b><small>${r[x.dataset.name]}/${cap}</small></div><button data-b="${id}" data-dir="-">−</button><strong>${used}</strong><button data-b="${id}" data-dir="+">+</button></div>`;
 }).join('');
 list.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
  const id=btn.dataset.b;
  const input=inputs.find(i=>i.dataset.name.replace(/[^a-z0-9]/gi,'')===id);
  if(!input)return;
  const attr=input.dataset.name;
  const used=+(getBreaker(attr)||0);
  const n=btn.dataset.dir==='+'?Math.min(5,used+1):Math.max(0,used-1);
  setBreaker(attr,n);
  renderBreakers(r);
 });
 const total=inputs.reduce((s,x)=>s+ +(getBreaker(x.dataset.name)||0),0);
 document.getElementById('breakerTotal').textContent=total;
 renderPlacementsCB(r);
}
/* Où placer ses Cap Breakers : pour chaque attribut, ce qui s'ouvrirait au-dessus
   de son maximum actuel, et à quel prix. Les attributs qui n'ouvrent rien ne sont
   pas listés — c'est l'information utile : cinq points ailleurs ne servent à rien.
   Un Cap Breaker lève le plafond, il ne donne pas la note : la page le dit. */
function renderPlacementsCB(r){
 const hote=document.getElementById('cbPlacements');
 if(!hote||!window.NBABL_PALIERS)return;
 const h=heightInches(), lignes=[];
 for(const x of inputs){
  const attr=x.dataset.name, cap=+x.max;
  if(cap>=99)continue;
  let suite=[];
  try{ suite=window.NBABL_PALIERS.paliers(attr,r,h,Math.min(99,cap+5)); }catch(e){ continue }
  const utiles=suite.filter(p=>p.note>cap);
  if(!utiles.length)continue;
  lignes.push({attr,cap,utiles,gains:utiles.reduce((t,p)=>t+p.gains.length,0)});
 }
 lignes.sort((a,b)=>b.gains-a.gains||(a.utiles[0].note-a.cap)-(b.utiles[0].note-b.cap));
 if(!lignes.length){
  hote.innerHTML='<li class="cb-placement-vide">Aucun attribut n’ouvre de nouveau palier dans les 5 points au-dessus de son maximum.</li>';
  return;
 }
 hote.innerHTML=lignes.slice(0,5).map(l=>{
  const premier=l.utiles[0], cb=premier.note-l.cap;
  const gains=l.utiles.slice(0,2).flatMap(p=>p.gains).slice(0,3);
  const reste=l.gains-gains.length;
  return `<li class="cb-placement">
   <div class="cb-placement-tete"><b>${escapeHTML(nomAttribut(l.attr))}</b>
   <span class="cb-placement-cap">maximum ${l.cap} → ${premier.note}</span>
   <span class="cb-placement-cout">${cb} Cap Breaker${cb>1?'s':''}</span></div>
   <div class="cb-placement-gains">${gains.map(g=>`<span class="eb-gain eb-gain-${g.type}">${escapeHTML(g.texte)}</span>`).join('')}${reste>0?`<span class="eb-gain-plus">et ${reste} de plus</span>`:''}</div>
  </li>`;
 }).join('');
}
/* ---------- Animations (page Référence) ----------
   Plus de 2 500 animations : on n'affiche que ANIM_PAGE cartes à la fois. */
const ANIM_PAGE=60; let animLimite=ANIM_PAGE;
const ANIM_SOURCE_LIBELLE={2:['ok','✓ 2 sources','Mêmes exigences chez NBA2KLab et LockerCodes'],1:['seule','NBA2KLab seul','Pas de ligne correspondante chez LockerCodes'],0:['conflit','⚠ Sources en désaccord','NBA2KLab et LockerCodes diffèrent : valeur NBA2KLab affichée']};
function remplirCategoriesAnimations(sel){
 if(!sel||sel.dataset.rempli)return; sel.dataset.rempli='1';
 const groupes=new Map(); ANIMATIONS.forEach(a=>{if(!groupes.has(a.group))groupes.set(a.group,new Set());groupes.get(a.group).add(a.category)});
 const libelle=c=>{const fr=nomCategorieAnimation(c);return fr===c?c:`${fr} (${c})`};
 sel.innerHTML='<option value="all">Toutes les catégories</option>'+[...groupes].map(([g,cats])=>
  `<optgroup label="${escapeHTML(g)}">${[...cats].sort((x,y)=>libelle(x).localeCompare(libelle(y),'fr')).map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(libelle(c))}</option>`).join('')}</optgroup>`).join('');
}
function renderSourceAnimations(){
 const el=document.getElementById('animSource'); if(!el||el.dataset.rempli||typeof ANIMATIONS_SOURCE==='undefined')return; el.dataset.rempli='1';
 const s=ANIMATIONS_SOURCE, [lab,lc]=s.sources;
 el.innerHTML=`📚 <b>${s.total.toLocaleString('fr-FR')} animations</b> — source <a href="${escapeHTML(lab.url)}" target="_blank" rel="noopener">${escapeHTML(lab.nom)}</a> (${escapeHTML(lab.mention)}), recoupées ligne par ligne avec <a href="${escapeHTML(lc.url)}" target="_blank" rel="noopener">${escapeHTML(lc.nom)}</a> (${escapeHTML(lc.mention)}) : <b>${s.recoupees}</b> identiques, <b>${s.desaccords}</b> en désaccord, ${s.nba2klabSeul} sans équivalent. ${s.jeu.animations} animations sont en plus <b>confirmées en jeu</b> (${escapeHTML(s.jeu.build)}). ${escapeHTML(s.regleTir)} Données communautaires, pas une publication officielle 2K.`;
}
/* Repère « Conseillée pour ton build » : une règle du site, pas un classement du jeu.
   Dans chaque catégorie (hors bases de tir du créateur de tir) :
   - conseil : l'animation la plus exigeante que le build peut équiper à sa taille ;
   - suivant : parmi les animations plus exigeantes, celle qui demande le moins de points. */
const ANIM_SANS_CONSEIL=new Set(['Jumper Base']);
/* L'exigence d'une animation ne change jamais : la calculer à chaque passage
   revenait à parcourir les 2 595 entrées plusieurs fois par mouvement de curseur. */
const EXIGENCES=new WeakMap();
function exigenceAnimation(a){
 if(!a)return 0;
 let v=EXIGENCES.get(a);
 if(v===undefined){const l=Object.values(a.req||{});v=l.length?Math.max(...l):0;EXIGENCES.set(a,v)}
 return v;
}
/* Les animations rangées par catégorie une fois pour toutes : la boucle des
   conseils reparcourait toute la base, dont les 781 « Jumper Base » qu'elle
   écarte aussitôt. */
let ANIM_INDEX=null;
function animationsParCategorie(){
 if(!ANIM_INDEX){
  ANIM_INDEX=new Map();
  for(const a of ANIMATIONS){
   if(ANIM_SANS_CONSEIL.has(a.category))continue;
   let l=ANIM_INDEX.get(a.category); if(!l)ANIM_INDEX.set(a.category,l=[]);
   l.push(a);
  }
 }
 return ANIM_INDEX;
}
/* Conseils d'animations : une par catégorie, plus deux idées de rechange.
 *
 * Ce qu'on peut affirmer sans rien inventer, c'est :
 *   — ce que le build débloque (taille et attributs) ;
 *   — l'exigence de chaque animation : le jeu réserve les plus hautes aux builds
 *     les plus poussés, c'est le seul classement que les données contiennent ;
 *   — la solidité de la donnée : recoupée par deux sources, ou vue équipée en jeu.
 * Nous ne classons pas les animations « par qualité de jeu » : personne ne publie
 * ce classement gratuitement, et l'inventer tromperait le joueur.
 *
 * S'y ajoute une règle de variété. Cinq catégories de dribble (crossover,
 * hésitation, entre les jambes, dans le dos, size-up) demandent les MÊMES
 * attributs aux mêmes joueurs : sans cette règle, le même nom sortait dans les
 * cinq et le joueur ne découvrait rien. À exigence voisine, on propose donc un
 * joueur qui n'a pas déjà été conseillé ailleurs — la qualité ne bouge pas, le
 * choix s'élargit.
 */
const ANIM_PENALITE_REPETITION=0.3;    // face à l'exigence, ramenée entre 0 et 1
// Une animation conseillée reste dans le haut de ce que le build débloque.
const ANIM_PLANCHER_QUALITE=0.85;
// Les dribbles d'abord : c'est là que le choix se voit le plus en match, donc on
// n'y descend pratiquement pas — la variété ne joue qu'entre animations de même
// niveau, et elles sont nombreuses à se tenir (plusieurs joueurs au même seuil).
const ANIM_PLANCHER_DRIBBLE=0.95;
/* « Basic », « Normal », « Pro » sont les animations de base, sans joueur : à
   exigence égale, une signature est toujours plus intéressante à équiper. Elles
   restent conseillées quand un build ne débloque rien d'autre. */
const ANIM_GENERIQUE=/^(Basic|Normal|Pro)( WNBA)?( \d+)?$/i;
// Rien n'est écarté au nom de la ligue : un MyPLAYER équipe bien une signature de
// joueuse (vérifié dans le jeu par l'utilisateur, 17 septembre 2026 ; 2K annonçait
// le 18 août une City mixte et un builder puisant dans les animations NBA et WNBA).
// Les entrées « Normal WNBA 2 » sont écartées comme les autres animations de base,
// par la règle ci-dessus : elles n'ont pas de signature.
/* Part des gabarits du jeu qui peuvent équiper cette animation. Une animation
   ouverte à tous les corps n'a pas la même valeur qu'une autre réservée à une
   poignée de gabarits : à exigence égale, la seconde est ce que cherchent les
   joueurs qui poussent leur build. Mesuré sur les corps que le jeu autorise,
   une fois par animation. */
const ANIM_PART=new WeakMap();
let ANIM_CORPS=null;
function partDesCorps(a){
 let p=ANIM_PART.get(a);
 if(p!==undefined)return p;
 if(!ANIM_CORPS){
  ANIM_CORPS=[];
  if(typeof CORPS_LEGAUX!=='undefined'&&CORPS_LEGAUX)
   for(const poste of Object.keys(CORPS_LEGAUX))
    for(const h of Object.keys(CORPS_LEGAUX[poste]))ANIM_CORPS.push(+h);
 }
 if(!ANIM_CORPS.length)return 1;
 let n=0;
 for(let i=0;i<ANIM_CORPS.length;i++)if(ANIM_CORPS[i]>=a.minH&&ANIM_CORPS[i]<=a.maxH)n++;
 p=n/ANIM_CORPS.length;
 ANIM_PART.set(a,p);
 return p;
}
function qualiteAnimation(a,maxCat){
 let s=maxCat?exigenceAnimation(a)/maxCat:0;
 s+=0.25*(1-partDesCorps(a));          // réservée à peu de gabarits
 s+=a.v===2?0.15:a.v===1?0.05:0;       // recoupée par nos deux sources
 if(a.jeu)s+=0.2;                      // vue équipée sur un vrai MyPLAYER
 return s;
}
function motifAnimation(a,maxCat){
 if(a.jeu)return 'confirmée en jeu';
 if(!maxCat)return 'aucune exigence connue dans cette catégorie';
 if(exigenceAnimation(a)===maxCat)return 'la plus exigeante de sa catégorie';
 return 'la plus exigeante que ton build atteint';
}
function conseilsAnimations(r,h){
 const dispo=new Map(), exigenceMax=new Map(), bloquees=new Map();
 // Une seule passe par catégorie : accessible ou non, et la plus proche du but.
 for(const [cat,liste] of animationsParCategorie()){
  for(const a of liste){
   if(h<a.minH||h>a.maxH)continue;
   const ex=exigenceAnimation(a);
   if(ex>(exigenceMax.get(cat)||0))exigenceMax.set(cat,ex);
   const manques=animationManques(a,r);
   if(manques.length){
    const total=manques.reduce((s,[,n])=>s+n,0), avant=bloquees.get(cat);
    if(!avant||total<avant.total||(total===avant.total&&ex>exigenceAnimation(avant.a)))bloquees.set(cat,{a,manques,total});
   }else{
    let l=dispo.get(cat); if(!l)dispo.set(cat,l=[]);
    l.push(a);
   }
  }
 }
 const par=new Map(), propose=new Map();
 // Ordre fixe : deux builds identiques reçoivent les mêmes conseils.
 for(const cat of [...dispo.keys()].sort()){
  const maxCat=exigenceMax.get(cat)||0;
  const liste=dispo.get(cat);
  // La variété ne doit jamais faire descendre en gamme : on ne choisit que parmi
  // le haut de ce que le build débloque vraiment dans cette catégorie.
  const maxAcc=Math.max(0,...liste.map(exigenceAnimation));
  const plancher=liste[0]&&liste[0].group==='Dribble'?ANIM_PLANCHER_DRIBBLE:ANIM_PLANCHER_QUALITE;
  const candidats=maxAcc?liste.filter(a=>exigenceAnimation(a)>=maxAcc*plancher):liste;
  // La variété se joue entre signatures : « Basic » n'est pas un nom à varier.
  const note=a=>qualiteAnimation(a,maxCat)-(ANIM_GENERIQUE.test(a.name)?0:(propose.get(a.name)||0)*ANIM_PENALITE_REPETITION);
  // Deux temps : une signature passe toujours devant une animation de base — toutes
  // ont déjà franchi le plancher de qualité — puis les signatures se départagent
  // entre elles, la variété jouant à plein sans jamais rappeler « Basic ».
  const classe=candidats.slice().sort((x,y)=>{
   const gx=ANIM_GENERIQUE.test(x.name), gy=ANIM_GENERIQUE.test(y.name);
   if(gx!==gy)return gx?1:-1;
   return note(y)-note(x)||x.name.localeCompare(y.name,'fr');
  });
  const conseil=classe[0], alternatives=classe.slice(1,3);
  propose.set(conseil.name,(propose.get(conseil.name)||0)+1);
  alternatives.forEach(a=>propose.set(a.name,(propose.get(a.name)||0)+0.5));
  par.set(cat,{conseil,alternatives,motif:motifAnimation(conseil,maxCat),suivant:null,manques:null});
 }
 // Catégories encore fermées : ce qui manque pour la plus proche.
 for(const [cat,b] of bloquees){
  const c=par.get(cat);
  if(c&&c.conseil&&exigenceAnimation(b.a)<=exigenceAnimation(c.conseil))continue;
  if(c){c.suivant=b.a;c.manques=b.manques}
  else par.set(cat,{conseil:null,alternatives:[],motif:null,suivant:b.a,manques:b.manques});
 }
 return par;
}
window.conseilsAnimations=conseilsAnimations;
function carteAnimation(a,ok,r,h,conseils){
 const repere=conseils?.get(a.category);
 const marque=repere?.conseil===a?'<span class="anim-repere conseil">Conseillée pour ton build</span>':repere?.suivant===a?'<span class="anim-repere suivant">À débloquer ensuite</span>':'';
 const heightOK=h>=a.minH&&h<=a.maxH, manques=animationManques(a,r), e=Object.entries(a.req||{});
 const nomA=n=>typeof nomAttribut==='function'?nomAttribut(n):n;
 const m=p=>(p*0.0254).toFixed(2).replace('.',',')+' m';
 // Nos sources n'indiquent aucun attribut requis (surtout les animations de poste) :
 // ce n'est pas la preuve que le jeu n'en demande aucun, on le dit.
 const reqs=!e.length?'<p class="areq-vide nonconfirme">Exigences non confirmées : nos sources n’indiquent aucun attribut requis, le jeu peut en demander.</p>'
  :`<div class="areq tete"><span>Attribut</span><span>Toi</span><span>Requis</span></div>`+
   e.map(([k,v])=>{const t=r[k]??0;return `<div class="areq ${t>=v?'ok':''}"><span>${escapeHTML(nomA(k))}</span><b>${t}</b><i>${v}</i></div>`}).join('')+
   (a.ou&&e.length>1?'<p class="areq-logique">Un seul de ces attributs suffit.</p>':'');
 const [cls,txt,titre]=ANIM_SOURCE_LIBELLE[a.v]||ANIM_SOURCE_LIBELLE[1];
 const cat=nomCategorieAnimation(a.category);
 const statut=ok?['ok','Accessible']:!heightOK?['taille','Hors taille']:['bloquee','Bloquée'];
 return `<article class="anim-card ${ok?'ok':''}"><div class="anim-top"><div class="anim-name">${escapeHTML(a.name)}</div><span class="anim-badge ${statut[0]}">${statut[1]}</span></div>`+
  `<div class="anim-meta"><span>${escapeHTML(cat)}</span>${cat!==a.category?`<i>${escapeHTML(a.category)}</i>`:''}<span class="anim-taille">${m(a.minH)} à ${m(a.maxH)}</span></div>`+marque+
  `<div class="reqs">${reqs}</div>`+
  `${!heightOK?`<p class="missing">Réservée aux joueurs de ${m(a.minH)} à ${m(a.maxH)}.</p>`:''}`+
  `${manques.length?`<p class="missing">Il te manque : ${manques.map(([k,n])=>`${escapeHTML(String(k).split(' ou ').map(nomA).join(' ou '))} +${n}`).join(' et ')}.</p>`:''}`+
  `<div class="anim-sources"><span class="anim-source ${cls}" title="${escapeHTML(titre)}">${txt}</span>${a.jeu?'<span class="anim-source jeu" title="Équipée sur un vrai MyPLAYER dont les attributs respectent cette exigence">Confirmée en jeu</span>':''}</div>`+
  `${a.note?`<div class="anim-note">${escapeHTML(a.note)}</div>`:''}</article>`;
}
function renderAnimations(){
 texte('animTotal',ANIMATIONS.length); /* compteur du builder, même sans la liste */
 const list=document.getElementById('animationList'); if(!list)return; /* section absente de cette page */
 const sel=document.getElementById('animCategory'); remplirCategoriesAnimations(sel); renderSourceAnimations();
 const r=ratings(),h=heightInches(),cat=sel.value,status=document.getElementById('animStatus').value,q=document.getElementById('animSearch').value.toLowerCase().trim();
 // Types d'animation (pastilles) : une catégorie choisie dans la liste prime sur le type.
 const grpBox=document.getElementById('animGroupes'), grp=grpBox?.dataset.groupe||'all';
 if(grpBox){
  const groupes=new Map();
  for(const a of ANIMATIONS){const g=groupes.get(a.group)||[0,0];g[1]++;if(animationAccessible(a,r,h))g[0]++;groupes.set(a.group,g)}
  const actif=cat!=='all'?(ANIMATIONS.find(a=>a.category===cat)||{}).group:grp;
  grpBox.innerHTML=`<button type="button" data-groupe="all" aria-pressed="${cat==='all'&&grp==='all'}">Toutes</button>`+
   [...groupes].map(([g,[o,t]])=>`<button type="button" data-groupe="${escapeHTML(g)}" aria-pressed="${actif===g}">${escapeHTML(g)} <b>${o}/${t}</b></button>`).join('');
 }
 const conseils=conseilsAnimations(r,h);
 let accessibles=0; const retenues=[];
 for(const a of ANIMATIONS){
  if(cat!=='all'){if(a.category!==cat)continue}
  else if(grp!=='all'&&a.group!==grp)continue;
  if(status==='conseil'&&conseils.get(a.category)?.conseil!==a&&conseils.get(a.category)?.suivant!==a)continue;
  if(q&&!(a.name.toLowerCase().includes(q)||a.category.toLowerCase().includes(q)||nomCategorieAnimation(a.category).toLowerCase().includes(q)))continue;
  const ok=animationAccessible(a,r,h); if(ok)accessibles++;
  if(status==='yes'&&!ok||status==='no'&&ok)continue;
  retenues.push([a,ok]);
 }
 list.innerHTML=retenues.slice(0,animLimite).map(([a,ok])=>carteAnimation(a,ok,r,h,conseils)).join('')||'<div class="empty">Aucune animation dans ce filtre.</div>';
 const reste=retenues.length-animLimite, plus=document.getElementById('animPlus');
 if(plus){plus.hidden=reste<=0;plus.textContent=`Afficher ${Math.min(ANIM_PAGE,reste)} de plus (${reste} restantes)`}
 texte('animResultats',`${retenues.length.toLocaleString('fr-FR')} résultat${retenues.length>1?'s':''}`);
 texte('animUnlocked',accessibles);
}
function handValue(){return document.getElementById('dominantHand')?.value||'Droite'}
function serialize(){let obj={position:position.value,height:height.value,weight:weight.value,wing:wing.value,style:style.value,hand:handValue(),attrs:Object.fromEntries(inputs.map(x=>[x.dataset.name,x.value]))};return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))}
function apply(obj){if(chargementFini)buildTouche=true;position.value=obj.position||'SF';height.value=obj.height||80;weight.value=obj.weight||210;wing.value=obj.wing||84;style.value=obj.style||'Équilibré';const handEl=document.getElementById('dominantHand');if(handEl&&obj.hand)handEl.value=obj.hand;update();if(obj.attrs)inputs.forEach(x=>{if(obj.attrs[x.dataset.name])x.value=Math.min(+obj.attrs[x.dataset.name],+x.max)});update()}
inputs.forEach(x=>x.addEventListener('input',()=>{if(limiterAuBudget(x))signalerBudgetPlein(x);suivrePalier(x);update()}));document.getElementById('chargerExemple')?.addEventListener('click',chargerExemple);['position','height','weight','wing','style'].forEach(id=>document.getElementById(id)?.addEventListener('input',update));const animRefiltrer=()=>{animLimite=ANIM_PAGE;renderAnimations()};['animCategory','animStatus'].forEach(id=>document.getElementById(id)?.addEventListener('change',animRefiltrer));document.getElementById('animSearch')?.addEventListener('input',animRefiltrer);document.getElementById('animPlus')?.addEventListener('click',()=>{animLimite+=ANIM_PAGE;renderAnimations()});document.getElementById('animGroupes')?.addEventListener('click',e=>{const b=e.target.closest('[data-groupe]');if(!b||b===e.currentTarget)return;e.currentTarget.dataset.groupe=b.dataset.groupe;const s=document.getElementById('animCategory');if(s)s.value='all';animLimite=ANIM_PAGE;renderAnimations()});['badgeFilter'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>renderBadges(ratings())));document.getElementById('badgeCats')?.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b||!e.currentTarget.contains(b)||b===e.currentTarget)return;e.currentTarget.dataset.cat=b.dataset.cat;renderBadges(ratings())});document.getElementById('badgeSearch')?.addEventListener('input',()=>renderBadges(ratings()));

/* Un geste réel sur le corps, les attributs, le style ou l'import rend le build « touché ». */
if(BUILDER_PRESENT){
  const ZONES_BUILD='.hq-roues,#attributeGroups,.style-strip,.hq-selects,#optimize,#buildModal,#load,#resetStylePreset';
  const toucher=e=>{if(!e.isTrusted||buildTouche||!e.target.closest||!e.target.closest(ZONES_BUILD))return;buildTouche=true;ecrireContexte()};
  ['input','change','pointerdown','keydown','wheel'].forEach(t=>document.addEventListener(t,toucher,{capture:true,passive:true}));
}

/* Ces quatre boutons n'existent que sur la page du builder : liaisons protégées. */
document.getElementById('reset')?.addEventListener('click',()=>{localStorage.removeItem('nba2k27_build');location.reload()});
document.getElementById('save')?.addEventListener('click',()=>{localStorage.setItem('nba2k27_build',serialize());alert('Build sauvegardé sur cet appareil.')});
document.getElementById('load')?.addEventListener('click',()=>{let s=localStorage.getItem('nba2k27_build');if(!s)return alert('Aucun build sauvegardé.');apply(JSON.parse(decodeURIComponent(escape(atob(s)))))});
/* encodeURIComponent est indispensable : le base64 contient des « + », qu'une
   URL décode en espaces — atob échouait alors et le build partagé ne se
   chargeait pas. */
document.getElementById('share')?.addEventListener('click',()=>{navigator.clipboard?.writeText(location.origin+location.pathname+'?build='+encodeURIComponent(serialize())).then(()=>alert('Lien du build copié.')).catch(()=>alert('Copie automatique indisponible.'))});
document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',()=>{const m=document.getElementById('buildModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}));
/* Les liens partagés avant la correction ci-dessus ont leurs « + » transformés
   en espaces par l'URL : on les restaure pour que ces liens fonctionnent aussi. */
function buildDepuisURL(){const q=new URLSearchParams(location.search).get('build');return q?q.replace(/ /g,'+'):null}
const codeURL=buildDepuisURL();
// Sans lien de partage, le builder et la page « Mon build » rouvrent le build en cours
// au lieu des valeurs par défaut. Dans le builder, ?nouveau=1 repart d'un build vierge.
// (Au chargement, style-presets.js n'affiche que le style : il ne réécrit pas les attributs.)
const nouveauBuild=/[?&]nouveau=1(&|$)/.test(location.search);
const ctxMonBuild=BUILDER_PRESENT&&!codeURL&&!nouveauBuild?lireContexte():null;
if(codeURL){try{apply(JSON.parse(decodeURIComponent(escape(atob(codeURL)))))}catch(e){update()}}
else if(ctxMonBuild){
  apply({position:ctxMonBuild.position,height:ctxMonBuild.height,weight:ctxMonBuild.weight,wing:ctxMonBuild.wing,style:ctxMonBuild.style,hand:ctxMonBuild.hand,attrs:ctxMonBuild.attrs});
  const rouvert=document.getElementById('buildRouvert'); if(rouvert)rouvert.hidden=false;
}
else update();



const DISCIPLINES=['Finition','Tir','Création','Défense','Rebond','Physique'];
/* Ces deux compteurs lisaient le texte affiché par les sections badges et
   animations. Depuis que ces sections ont leur propre page, elles ne sont plus
   dans le DOM du builder : la lecture renvoyait 0, et tout build publié
   déclarait 0 badge et 0 animation. Ils sont donc calculés directement. */
function unlockedBadgeCount(r){
  const notes=r||ratings(); let n=0;
  for(const d of badgeDefs) if(badgeTier(d,notes).level>0) n++;
  return n;
}
function unlockedAnimationCount(r){
  const notes=r||ratings(), h=heightInches(); let n=0;
  for(const a of (window.ANIMATIONS||[])){
    if(animationAccessible(a,notes,h)) n++;
  }
  return n;
}

function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function breakerTotalValue(){return inputs.reduce((s,x)=>s+ +(getBreaker(x.dataset.name)||0),0)}

function renderProDashboard(){if(!document.getElementById("proQualityScore"))return; /* section absente de cette page */
 const caps=bodyCaps(), r=ratings(), v=validateBuild(r,caps);
 // badgeTotal n'est rempli que par la page Badges : sur le builder il restait à 0,
 // d'où « 0 badges en base » et un faux « À corriger ». Les comptes sont calculés ici.
 texte('badgeTotal',badgeDefs.length);
 const badgeCount=unlockedBadgeCount(r);
 const animCount=unlockedAnimationCount();
 const bodyOK=v.errors.filter(e=>e.includes('Envergure')).length===0;
 const capOK=v.errors.filter(e=>e.includes('dépasse le cap')).length===0;
 const badgeOK=badgeCount>0;
 const animOK=animCount>0;
 const checks=[bodyOK,capOK,badgeOK,animOK];
 const pct=Math.round(checks.filter(Boolean).length/checks.length*100);
 const ring=document.getElementById('proQualityScore'); if(ring)ring.textContent=pct;
 const label=document.getElementById('proQualityLabel'); if(label)label.textContent=pct===100?'Prêt à être vérifié dans le jeu':pct>=80?'Très bon niveau de cohérence':'Build à corriger';
 const txt=document.getElementById('proQualityText'); if(txt)txt.textContent=pct===100?'Aucun conflit détecté dans les règles actuellement intégrées. Les règles non publiées restent signalées séparément.':'Corrige les points rouges ci-dessous avant de considérer le build comme reproductible.';
 const pill=document.getElementById('dataConfidencePill'); if(pill)pill.textContent=pct===100?'COHÉRENT':'À VÉRIFIER';
 const covA=document.getElementById('coverageAnimations'); if(covA)covA.textContent=ANIMATIONS.length;
 const covB=document.getElementById('coverageBadges'); if(covB)covB.textContent=badgeDefs.length;
 const covO=document.getElementById('coverageOfficial'); if(covO)covO.textContent='—';
 const covI=document.getElementById('coverageIndicative'); if(covI)covI.textContent='—';
 const repro=[
   ['Gabarit taille / envergure',bodyOK],
   ['Attributs sous les caps intégrés',capOK],
   ['Au moins un palier de badge accessible',badgeOK],
   ['Animations calculées pour ce profil',animOK]
 ];
 const rp=document.getElementById('reproList'); if(rp)rp.innerHTML=repro.map(([n,ok])=>`<div class="repro-row"><span>${ok?'✓':'✕'} ${n}</span><b class="${ok?'pass':'fail'}">${ok?'OK':'À corriger'}</b></div>`).join('');
 const rpp=document.getElementById('reproPercent');if(rpp)rpp.textContent=pct+'%';
 const ul=document.getElementById('uncertaintyList');if(ul)ul.innerHTML=[
   'Caps internes exacts : non publiés comme table complète.',
   'La moyenne affichée n’est pas la note globale (GNR) du jeu.',
   'La base d’animations embarquée n’est pas une exportation exhaustive.',
   'Les systèmes de progression (Synergie / Tokens / Takeovers) sont affichés séparément des règles de caps.',
   'Une validation verte signifie « cohérent avec la base intégrée », pas « garantie officielle 2K ».'
 ].map(x=>`<li>${x}</li>`).join('');
}
function renderCBProgression(){
 const stage=+(document.getElementById('cbStage')?.value||0);
 const plan={}; inputs.forEach(x=>{plan[x.dataset.name]=+(getBreaker(x.dataset.name)||0)});
 const total=Object.values(plan).reduce((a,b)=>a+b,0);
 const active=Object.entries(plan).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
 const summary=document.getElementById('cbSummary'); if(summary)summary.innerHTML=`<div><b>${stage}</b><span>CB visualisés</span></div><div><b>${total}</b><span>CB planifiés</span></div><div><b>${active.length}</b><span>attributs ciblés</span></div>`;
 const preview=document.getElementById('cbPreview'); if(!preview)return;
 const rows=active.length?active.map(([k,v])=>{const base=ratings()[k]||0;const cap=bodyCaps()[k]||99;const gain=Math.min(v,Math.max(0,cap-base));const projected=base+gain;return `<div class="cb-preview-row"><span>${escapeHTML(k)}</span><b>${base}</b><i>→</i><strong>${projected}</strong><small>+${gain} • cap ${cap}</small></div>`}).join(''):'<div class="empty">Aucun Cap Breaker planifié. Utilise le planificateur ci-dessus ou « Plan automatique ».</div>';
 preview.innerHTML=rows;
 const pill=document.getElementById('cbStagePill');if(pill)pill.textContent=stage===0?'BASE':stage+' CB';
}
function autoPlanCB(){
 inputs.forEach(x=>localStorage.removeItem(breakerStorageKey(x.dataset.name)));
 const r=ratings(),caps=bodyCaps();
 const targets=Object.entries(r).map(([k,v])=>({k,v,room:Math.max(0,(caps[k]||99)-v)})).filter(x=>x.room>0).sort((a,b)=>b.v-a.v).slice(0,5);
 targets.forEach(x=>setBreaker(x.k,Math.min(5,Math.max(1,Math.round(x.room/2)))));
 renderBreakers(r);renderCBProgression();update();
}
function clearCBPlan(){
 inputs.forEach(x=>localStorage.removeItem(breakerStorageKey(x.dataset.name)));
 renderBreakers(ratings());renderCBProgression();update();
}

function renderTokens(){
 const root=document.getElementById('disciplineGrid');if(!root)return;
 let plan=JSON.parse(localStorage.getItem(tokenStorageKey())||'{}');
 root.innerHTML=DISCIPLINES.map(d=>`<div class="discipline-card"><div><b>${d}</b><span>${plan[d]||0}/20</span></div><input data-disc="${d}" type="range" min="0" max="20" value="${plan[d]||0}"><small>Emplacements planifiés</small></div>`).join('');
 root.querySelectorAll('input').forEach(i=>i.oninput=()=>{plan[i.dataset.disc]=+i.value;const total=Object.values(plan).reduce((a,b)=>a+b,0);if(total>20){i.value=Math.max(0,+i.value-(total-20));plan[i.dataset.disc]=+i.value}localStorage.setItem(tokenStorageKey(),JSON.stringify(plan));renderTokens()});
 const total=Object.values(plan).reduce((a,b)=>a+b,0);document.getElementById('tokenUsed').textContent=total;
}
function printBuildCard(){window.print()}
document.getElementById('printCard')?.addEventListener('click',printBuildCard);
// Jetons de badges (page « Mon build ») : redessinés à chaque recalcul.
const oldUpdate=update; update=function(){oldUpdate();renderTokens()};
// Le premier rendu a eu lieu plus haut, avant ce branchement : on dessine les jetons une fois.
renderTokens();
document.getElementById('cbStage')?.addEventListener('change',renderCBProgression);
document.getElementById('cbAutoPlan')?.addEventListener('click',autoPlanCB);
document.getElementById('cbClearPlan')?.addEventListener('click',clearCBPlan);

const originalRenderBreakers=renderBreakers;
renderBreakers=function(r){originalRenderBreakers(r);renderCBProgression()};

const originalUpdateV11=update;
update=function(){
 originalUpdateV11();
 renderProDashboard();
 renderCBProgression();
};

(function loadURLBuild(){
 const q=buildDepuisURL();
 if(q){try{apply(JSON.parse(decodeURIComponent(escape(atob(q)))))}catch(e){}}
})();


// V20.5 data bridge for Build DNA
window.badgeDefs=badgeDefs; window.takeoverDefs=takeoverDefs; window.ANIMATIONS=ANIMATIONS;
window.inputs=inputs;
window.badgeTier=badgeTier;
window.ratings=ratings;
window.bodyCaps=bodyCaps;
window.heightText=heightText;
window.simulatedCost=simulatedCost;
window.serializeBuild=serialize;
window.applyBuild=apply;
window.NBABL_BASE_ATTRIBUTES=(function(){var o={};Object.keys(data).forEach(function(g){data[g].forEach(function(p){o[p[0]]=p[1]})});return o})();
window.heightInches=heightInches;
window.tokenStorageKey=tokenStorageKey;
window.setAttributeBaseline=setAttributeBaseline;
window.appUpdate=function(){update()};
// Contexte du dernier build composé, lu par hub.js quand le builder est absent.
window.NBABL_CONTEXTE=lireContexte;

/* Pages sans builder : update() ne tourne pas, mais /reference/ doit tout de
   même remplir ses tables. Chaque fonction se protège déjà si sa section est
   absente, l'appel est donc sans risque sur les autres pages. */
if(!BUILDER_PRESENT){
  const r=ratings();
  renderBadges(r);
  renderTakeovers(r);
  renderAnimations();
}
// Les onglets du hub (community.js) redemandent un rendu de la liste.
// Chargement terminé : tout apply() suivant vient d'un geste (charger, importer…).
chargementFini=true;
