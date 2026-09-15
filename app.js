const root=document.getElementById('attributeGroups');let inputs=[];
/* Toutes les pages chargent ce noyau, mais seule celle du builder contient
   #attributeGroups. Ailleurs on n'installe ni curseurs ni écouteurs : les
   fonctions restent définies — hub.js et share.js les appellent — mais rien
   ne s'exécute au chargement. */
const BUILDER_PRESENT=!!root;
const CATEGORY_UI={
 Finition:{label:'Finition',cls:'finish',icon:'◉',desc:'Terminer au cercle, layups, dunks et jeu au poste.'},
 Tir:{label:'Tir',cls:'shoot',icon:'◎',desc:'Mid-range, trois points et lancer franc.'},
 Création:{label:'Organisation',cls:'play',icon:'◇',desc:'Passe, dribble et création balle en main.'},
 Défense:{label:'Défense',cls:'defense',icon:'◆',desc:'Défense au cercle, périmètre, interceptions et contres.'},
 Rebond:{label:'Rebond',cls:'rebound',icon:'◍',desc:'Rebond offensif et défensif.'},
 Physique:{label:'Physique',cls:'physical',icon:'✦',desc:'Vitesse, agilité, force, verticalité et endurance.'}
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
function lireContexte(){
  try{const c=JSON.parse(localStorage.getItem(CTX_KEY)||'null');return c&&c.attrs?c:null}catch(e){return null}
}
/* Page « Mon build » sans build en cours : le moteur caché y tourne sur les
   valeurs par défaut, qu'il ne doit pas faire passer pour le build de quelqu'un. */
const MON_BUILD_VIDE=!!document.getElementById('moteurBuild')&&!lireContexte();
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
      capBreakers:breakerTotalValue()
    }));
  }catch(e){/* stockage plein ou refusé : sans conséquence */}
}
function ratings(){
  if(!inputs.length){const c=lireContexte();if(c)return {...c.attrs};return {...(window.NBABL_BASE_ATTRIBUTES||{})}}
  let r={};inputs.forEach(x=>r[x.dataset.name]=+x.value);return r;
}
function updateAttributeVisuals(){inputs.forEach(x=>{const pct=Math.max(0,Math.min(100,((+x.value-25)/(+x.max-25))*100));const color=getComputedStyle(document.documentElement).getPropertyValue({'finish':'--cat-finish','shoot':'--cat-shoot','play':'--cat-play','defense':'--cat-defense','physical':'--cat-physical'}[x.dataset.categoryClass]||'--ui-accent').trim();x.style.setProperty('--attr-color',color);x.style.setProperty('--attr-pct',pct+'%');const card=x.closest('.attr');if(card)card.style.setProperty('--cat-color',color);});}
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
 // Plafonds lus dans le jeu : ils priment sur l'estimation, brise-plafonds
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
 updateProfileLabels();const caps=bodyCaps();clampInputsToCaps(caps);const r=ratings();updateThresholds();let sums={};Object.keys(data).forEach(k=>sums[k]=[]);inputs.forEach(x=>{document.getElementById('v'+x.dataset.name.replace(/[^a-z0-9]/gi,'')).textContent=x.value;sums[x.dataset.group].push(+x.value)});let avg=k=>Math.round(sums[k].reduce((a,b)=>a+b,0)/sums[k].length),vals={Finition:avg('Finition'),Tir:avg('Tir'),Création:avg('Création'),Défense:avg('Défense'),Rebond:avg('Rebond'),Physique:avg('Physique')};Object.entries(vals).forEach(([k,v])=>{const el=document.getElementById('avg-'+safeGroupId(k));if(el)el.textContent=v;});updateAttributeVisuals();const SCORE_W={Finition:1,Tir:1,Création:1,Défense:1,Rebond:.6,Physique:1};let wsum=0,wtot=0;Object.keys(vals).forEach(k=>{const w=SCORE_W[k]||1;wsum+=vals[k]*w;wtot+=w});let score=Math.round(wsum/wtot);document.getElementById('score').textContent=score;const ring=document.querySelector('.summary-ring');if(ring)ring.style.setProperty('--score-pct',Math.max(0,Math.min(100,score))+'%');texte('badgeReachable',unlockedBadgeCount(r));let nm=buildName(vals);document.getElementById('buildname').textContent=nm;const meta=document.getElementById('buildMeta');if(meta)meta.textContent=`${document.getElementById('position').value} • ${heightText(heightInches())} • ${document.getElementById('weight').value} lbs`;for(const [k,v] of Object.entries(vals)){let id={Finition:'finish',Tir:'shoot',Création:'play',Défense:'def',Rebond:'reb',Physique:'phys'}[k];const ve=document.getElementById(id+'Val');if(ve)ve.textContent=v;const be=document.getElementById(id+'Bar');if(be)be.style.width=v+'%'}updateAttributeDeltas();
 let capped=inputs.filter(x=>+x.value>=+(x.max||99)).length;document.getElementById('capStatus').textContent=`${capped} / ${inputs.length} au cap`;document.getElementById('bodyHint').textContent=`${document.getElementById('position').value} • ${heightText(heightInches())} • ${heightText(+document.getElementById('wing').value)} envergure — les caps évoluent avec le gabarit.`;renderBadges(r);renderTakeovers(r);renderBreakers(r);texte('breakerTotal',breakerTotalValue());renderAnimations();renderScouting(r,vals);renderValidation(r,caps);ecrireContexte();
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
function exigenceAnimation(a){const v=Object.values(a?.req||{});return v.length?Math.max(...v):0}
function conseilsAnimations(r,h){
 const par=new Map();
 for(const a of ANIMATIONS){
  if(ANIM_SANS_CONSEIL.has(a.category)||h<a.minH||h>a.maxH||animationManques(a,r).length)continue;
  const c=par.get(a.category)||{conseil:null,suivant:null,manques:null};
  const ea=exigenceAnimation(a),ec=exigenceAnimation(c.conseil);
  if(!c.conseil||ea>ec||(ea===ec&&a.name.localeCompare(c.conseil.name,'fr')<0))c.conseil=a;
  par.set(a.category,c);
 }
 for(const a of ANIMATIONS){
  if(ANIM_SANS_CONSEIL.has(a.category)||h<a.minH||h>a.maxH)continue;
  const manques=animationManques(a,r); if(!manques.length)continue;
  const c=par.get(a.category)||{conseil:null,suivant:null,manques:null};
  if(c.conseil&&exigenceAnimation(a)<=exigenceAnimation(c.conseil)){par.set(a.category,c);continue}
  const total=manques.reduce((s,[,n])=>s+n,0), avant=c.manques?c.manques.reduce((s,[,n])=>s+n,0):Infinity;
  if(total<avant||(total===avant&&exigenceAnimation(a)>exigenceAnimation(c.suivant))){c.suivant=a;c.manques=manques}
  par.set(a.category,c);
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
 const reqs=!e.length?'<p class="areq-vide">Aucun attribut requis.</p>'
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
function apply(obj){position.value=obj.position||'SF';height.value=obj.height||80;weight.value=obj.weight||210;wing.value=obj.wing||84;style.value=obj.style||'Équilibré';const handEl=document.getElementById('dominantHand');if(handEl&&obj.hand)handEl.value=obj.hand;update();if(obj.attrs)inputs.forEach(x=>{if(obj.attrs[x.dataset.name])x.value=Math.min(+obj.attrs[x.dataset.name],+x.max)});update()}
inputs.forEach(x=>x.addEventListener('input',update));['position','height','weight','wing','style'].forEach(id=>document.getElementById(id)?.addEventListener('input',update));const animRefiltrer=()=>{animLimite=ANIM_PAGE;renderAnimations()};['animCategory','animStatus'].forEach(id=>document.getElementById(id)?.addEventListener('change',animRefiltrer));document.getElementById('animSearch')?.addEventListener('input',animRefiltrer);document.getElementById('animPlus')?.addEventListener('click',()=>{animLimite+=ANIM_PAGE;renderAnimations()});document.getElementById('animGroupes')?.addEventListener('click',e=>{const b=e.target.closest('[data-groupe]');if(!b||b===e.currentTarget)return;e.currentTarget.dataset.groupe=b.dataset.groupe;const s=document.getElementById('animCategory');if(s)s.value='all';animLimite=ANIM_PAGE;renderAnimations()});['badgeFilter'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>renderBadges(ratings())));document.getElementById('badgeCats')?.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(!b||!e.currentTarget.contains(b)||b===e.currentTarget)return;e.currentTarget.dataset.cat=b.dataset.cat;renderBadges(ratings())});document.getElementById('badgeSearch')?.addEventListener('input',()=>renderBadges(ratings()));

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
// Page « Mon build » : le moteur caché reprend le build en cours au lieu des valeurs par défaut.
const ctxMonBuild=!codeURL&&document.getElementById('moteurBuild')?lireContexte():null;
if(codeURL){try{apply(JSON.parse(decodeURIComponent(escape(atob(codeURL)))))}catch(e){update()}}
else if(ctxMonBuild)apply({position:ctxMonBuild.position,height:ctxMonBuild.height,weight:ctxMonBuild.weight,wing:ctxMonBuild.wing,style:ctxMonBuild.style,hand:ctxMonBuild.hand,attrs:ctxMonBuild.attrs});
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
function renderSynergy(){
 const r=ratings();const badgeCount=unlockedBadgeCount();const score=Math.min(100,Math.round((badgeCount/53)*55 + (Object.values(r).filter(v=>v>=85).length/21)*45));
 const sScore=document.getElementById('synergyScore');if(!sScore)return;sScore.textContent=score+'%';const sBar=document.getElementById('synergyBar');if(sBar)sBar.style.width=score+'%';
 const items=[['Finition',r['Driving Dunk']>=85||r['Driving Layup']>=90],['Tir',r['Three-Point']>=88||r['Mid-Range']>=90],['Création',r['Ball Handle']>=88||r['Pass Accuracy']>=90],['Défense',r['Perimeter Defense']>=88||r['Block']>=88],['Rebond',r['Defensive Rebound']>=88||r['Offensive Rebound']>=88],['Physique',r['Speed']>=88||r['Strength']>=88]];
 const sList=document.getElementById('synergyList');if(sList)sList.innerHTML=items.map(([n,ok])=>`<div><span>${n}</span><b class="${ok?'ready':''}">${ok?'Potentiel élevé':'À développer'}</b></div>`).join('');
}
let selectedTakeovers=[];
function renderTakeoverLoadout(){
 const r=ratings(),root=document.getElementById('takeoverSlots');if(!root)return;
 const options=takeoverDefs.map(([name,attr,need])=>({name,attr,need,ok:(r[attr]||0)>=need}));
 root.innerHTML=`<div class="takeover-option-row">${options.map(o=>`<button class="loadout-option ${o.ok?'ready':''} ${selectedTakeovers.includes(o.name)?'chosen':''}" data-to="${o.name}"><span>${o.name}</span><small>${o.attr} ${o.need}</small></button>`).join('')}</div><div class="selected-takeovers">${[0,1,2,3,4].map((_,i)=>`<div class="take-slot"><span>Slot ${i+1}</span><b>${selectedTakeovers[i]||'Libre'}</b></div>`).join('')}</div>`;
 root.querySelectorAll('[data-to]').forEach(b=>b.onclick=()=>{const n=b.dataset.to;if(selectedTakeovers.includes(n))selectedTakeovers=selectedTakeovers.filter(x=>x!==n);else if(selectedTakeovers.length<5)selectedTakeovers.push(n);renderTakeoverLoadout()});
}
function printBuildCard(){window.print()}
document.getElementById('printCard')?.addEventListener('click',printBuildCard);
const oldUpdate=update; update=function(){oldUpdate();renderSynergy();renderTakeoverLoadout()};
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
