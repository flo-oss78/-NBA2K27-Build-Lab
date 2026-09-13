const data={Finition:[['Close Shot',75],['Driving Layup',82],['Driving Dunk',85],['Standing Dunk',55],['Post Control',60]],Tir:[['Mid-Range',82],['Three-Point',88],['Free Throw',78]],Création:[['Pass Accuracy',78],['Ball Handle',86],['Speed With Ball',84]],Défense:[['Interior Defense',55],['Perimeter Defense',85],['Steal',80],['Block',70]],Rebond:[['Offensive Rebound',45],['Defensive Rebound',65]],Physique:[['Speed',84],['Agility',82],['Strength',72],['Vertical',80],['Stamina',94]]};
const badgeDefs=[
{name:'Arc Cadence',cat:'Tir',req:[['Three-Point',70,86,91,98]],logic:'AND',minH:69,maxH:83},
{name:'Deadeye',cat:'Tir',req:[['Mid-Range',65,85,92,99],['Three-Point',65,85,92,99]],logic:'OR',minH:69,maxH:88},
{name:'Limitless Range',cat:'Tir',req:[['Three-Point',83,89,93,99]],logic:'AND',minH:69,maxH:88},
{name:'Mini Marksman',cat:'Tir',req:[['Mid-Range',60,79,94,99],['Three-Point',60,79,94,99]],logic:'OR',minH:69,maxH:76},
{name:'Post Fade Phenom',cat:'Tir',req:[['Mid-Range',60,71,84,91],['Post Control',55,74,84,93]],logic:'AND',minH:69,maxH:88},
{name:'Quick Trigger',cat:'Tir',req:[['Mid-Range',80,88,95,99],['Three-Point',80,88,95,99]],logic:'OR',minH:69,maxH:88},
{name:'Set and Fire',cat:'Tir',req:[['Three-Point',60,78,89,97]],logic:'AND',minH:69,maxH:88},
{name:'Smooth Operator',cat:'Tir',req:[['Mid-Range',70,87,93,99]],logic:'AND',minH:69,maxH:88},
{name:'Static Middy',cat:'Tir',req:[['Mid-Range',55,75,85,95]],logic:'AND',minH:69,maxH:88},
{name:'Ankle Assassin',cat:'Création',req:[['Ball Handle',75,86,93,96]],logic:'AND',minH:69,maxH:82},
{name:'Bail Out',cat:'Création',req:[['Pass Accuracy',85,93,96,99]],logic:'AND',minH:69,maxH:88},
{name:'Break Starter',cat:'Création',req:[['Pass Accuracy',65,77,89,97]],logic:'AND',minH:69,maxH:88},
{name:'Dimer',cat:'Création',req:[['Pass Accuracy',50,70,86,95]],logic:'AND',minH:69,maxH:88},
{name:'Handles for Days',cat:'Création',req:[['Ball Handle',71,81,90,95]],logic:'AND',minH:69,maxH:84},
{name:'Lightning Launch',cat:'Création',req:[['Speed With Ball',68,75,86,91]],logic:'AND',minH:69,maxH:83},
{name:'Pace',cat:'Création',req:[['Speed With Ball',70,80,88,93]],logic:'AND',minH:69,maxH:82},
{name:'Strong Handle',cat:'Création',req:[['Ball Handle',60,67,73,78],['Strength',75,82,89,95]],logic:'AND',minH:69,maxH:83},
{name:'Unpluckable',cat:'Création',req:[['Post Control',65,86,96,null],['Ball Handle',65,80,92,97]],logic:'OR',minH:69,maxH:88},
{name:'Versatile Visionary',cat:'Création',req:[['Pass Accuracy',65,80,90,99]],logic:'AND',minH:69,maxH:88},
{name:'Aerial Wizard',cat:'Finition',req:[['Driving Dunk',60,70,80,94],['Standing Dunk',60,70,80,93]],logic:'OR',minH:69,maxH:88},
{name:'Float Game',cat:'Finition',req:[['Close Shot',65,80,90,96],['Driving Layup',65,85,93,95]],logic:'OR',minH:69,maxH:88},
{name:'Ghost Stepper',cat:'Finition',req:[['Close Shot',55,77,86,94],['Post Control',55,77,86,94]],logic:'OR',minH:69,maxH:88},
{name:'Hook Specialist',cat:'Finition',req:[['Close Shot',60,75,87,94],['Post Control',55,65,80,90]],logic:'AND',minH:69,maxH:88},
{name:'Layup Mixmaster',cat:'Finition',req:[['Driving Layup',70,83,90,99]],logic:'AND',minH:69,maxH:84},
{name:'Paint Prodigy',cat:'Finition',req:[['Close Shot',60,85,90,96]],logic:'AND',minH:75,maxH:88},
{name:'Physical Finisher',cat:'Finition',req:[['Driving Layup',60,80,90,96],['Strength',60,70,80,90]],logic:'AND',minH:69,maxH:88},
{name:'Post Powerhouse',cat:'Finition',req:[['Post Control',60,75,85,95],['Strength',65,79,86,95]],logic:'AND',minH:77,maxH:88},
{name:'Post Spin Catalyst',cat:'Finition',req:[['Post Control',65,83,91,99]],logic:'AND',minH:73,maxH:88},
{name:'Posterizer',cat:'Finition',req:[['Driving Dunk',73,87,93,99],['Vertical',65,75,80,90]],logic:'AND',minH:69,maxH:88},
{name:'Rise Up',cat:'Finition',req:[['Standing Dunk',60,81,90,99],['Vertical',55,62,66,70]],logic:'AND',minH:77,maxH:88},
{name:'Ankle Braces',cat:'Défense',req:[['Perimeter Defense',60,86,93,95],['Agility',65,82,89,92]],logic:'AND',minH:69,maxH:81},
{name:'Challenger',cat:'Défense',req:[['Perimeter Defense',71,82,92,98]],logic:'AND',minH:69,maxH:83},
{name:'Glove',cat:'Défense',req:[['Steal',70,83,93,99]],logic:'AND',minH:69,maxH:84},
{name:'High-Flying Denier',cat:'Défense',req:[['Block',68,78,88,92],['Vertical',60,74,80,83]],logic:'AND',minH:75,maxH:88},
{name:'Immovable Enforcer',cat:'Défense',req:[['Perimeter Defense',62,72,84,91],['Strength',71,82,85,92]],logic:'AND',minH:69,maxH:88},
{name:'Interceptor',cat:'Défense',req:[['Steal',60,77,90,97]],logic:'AND',minH:69,maxH:88},
{name:'Off-Ball Pest',cat:'Défense',req:[['Interior Defense',60,76,85,93],['Perimeter Defense',55,68,80,89]],logic:'OR',minH:69,maxH:88},
{name:'Paint Patroller',cat:'Défense',req:[['Interior Defense',60,71,77,84],['Block',70,84,93,99]],logic:'AND',minH:77,maxH:88},
{name:'Pick Dodger',cat:'Défense',req:[['Perimeter Defense',73,83,90,97],['Agility',71,81,88,91]],logic:'AND',minH:69,maxH:82},
{name:'Post Lockdown',cat:'Défense',req:[['Interior Defense',65,82,88,93],['Strength',65,74,80,88]],logic:'AND',minH:77,maxH:88},
{name:'Seatbelt',cat:'Défense',req:[['Perimeter Defense',75,85,91,99],['Agility',70,77,80,86]],logic:'AND',minH:69,maxH:81},
{name:'Wall Up',cat:'Défense',req:[['Interior Defense',80,85,95,99],['Strength',75,80,90,92]],logic:'AND',minH:77,maxH:88},
{name:'Boxout Boss',cat:'Rebond',req:[['Defensive Rebound',65,75,90,98],['Strength',60,76,88,94]],logic:'AND',minH:75,maxH:88},
{name:'Breaker',cat:'Rebond',req:[['Offensive Rebound',65,82,92,98],['Strength',70,79,90,96]],logic:'AND',minH:75,maxH:88},
{name:'Crasher',cat:'Rebond',req:[['Offensive Rebound',60,80,93,99],['Vertical',60,65,67,70]],logic:'AND',minH:69,maxH:88},
{name:'Possession Closer',cat:'Rebond',req:[['Defensive Rebound',67,87,95,99],['Vertical',60,65,67,70]],logic:'AND',minH:69,maxH:88},
{name:'Sync Snatcher',cat:'Rebond',req:[['Offensive Rebound',55,70,82,90],['Defensive Rebound',55,70,82,90]],logic:'OR',minH:69,maxH:88},
{name:'Brick Wall',cat:'Physique',req:[['Strength',75,83,95,99]],logic:'AND',minH:77,maxH:88},
{name:'Bruiser',cat:'Physique',req:[['Strength',71,84,93,99]],logic:'AND',minH:69,maxH:88},
{name:'Flash',cat:'Physique',req:[['Speed',70,82,87,95],['Agility',60,78,81,91]],logic:'AND',minH:69,maxH:88},
{name:'Pogo Stick',cat:'Physique',req:[['Vertical',63,70,80,90]],logic:'AND',minH:69,maxH:88},
{name:'Slippery Off-Ball',cat:'Physique',req:[['Speed',57,73,85,94],['Agility',57,65,77,90]],logic:'AND',minH:69,maxH:81},
{name:'Work Horse',cat:'Physique',req:[['Agility',60,75,85,95],['Strength',60,75,85,95]],logic:'OR',minH:69,maxH:88}
];

const takeoverDefs=[['Sharpshooter','Three-Point',88],['Shot Creator','Mid-Range',88],['Slasher','Driving Dunk',88],['Playmaker','Pass Accuracy',88],['Ball Handler','Ball Handle',88],['Perimeter Lock','Perimeter Defense',88],['Pick Pocket','Steal',88],['Rim Protector','Block',88],['Glass Cleaner','Defensive Rebound',88],['Post Scorer','Post Control',88],['Two-Way','Perimeter Defense',80]];
const COST_WEIGHT={
 'Close Shot':1.00,'Driving Layup':1.05,'Driving Dunk':1.35,'Standing Dunk':1.15,'Post Control':1.05,
 'Mid-Range':1.10,'Three-Point':1.35,'Free Throw':0.55,'Pass Accuracy':0.95,'Ball Handle':1.30,'Speed With Ball':1.20,
 'Interior Defense':0.95,'Perimeter Defense':1.15,'Steal':1.10,'Block':1.10,'Offensive Rebound':0.80,'Defensive Rebound':0.90,
 'Speed':1.15,'Agility':1.10,'Strength':0.95,'Vertical':1.00,'Stamina':0.55};
const BADGE_THRESHOLDS=[60,70,80,90,95];
const root=document.getElementById('attributeGroups');let inputs=[];
const CATEGORY_UI={
 Finition:{label:'Finition',cls:'finish',icon:'◉',desc:'Terminer au cercle, layups, dunks et jeu au poste.'},
 Tir:{label:'Tir',cls:'shoot',icon:'◎',desc:'Mid-range, trois points et lancer franc.'},
 Création:{label:'Organisation',cls:'play',icon:'◇',desc:'Passe, dribble et création balle en main.'},
 Défense:{label:'Défense',cls:'defense',icon:'◆',desc:'Défense au cercle, périmètre, interceptions et contres.'},
 Rebond:{label:'Rebond',cls:'rebound',icon:'◍',desc:'Rebond offensif et défensif.'},
 Physique:{label:'Physique',cls:'physical',icon:'✦',desc:'Vitesse, agilité, force, verticalité et endurance.'}
};
function safeGroupId(group){return group.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase()}
Object.entries(data).forEach(([group,arr])=>{const ui=CATEGORY_UI[group]||CATEGORY_UI.Finition;let g=document.createElement('div');g.className=`group attr-group group-${ui.cls}`;g.id=`attr-group-${safeGroupId(group)}`;g.dataset.group=group;g.innerHTML=`<div class="group-head ${ui.cls}"><div class="group-title-wrap"><span class="group-icon">${ui.icon}</span><div><h3>${ui.label}</h3><small>${ui.desc}</small></div></div><b class="group-avg" id="avg-${safeGroupId(group)}">0</b></div>`;arr.forEach(([name,val])=>{let id=name.replace(/[^a-z0-9]/gi,'');let d=document.createElement('div');d.className=`attr attr-${ui.cls}`;d.dataset.category=group;d.innerHTML=`<div class="attrhead"><div class="attr-name"><span>${name}</span><small id="cap${id}">CAP 99</small></div><div class="attr-controls"><button type="button" class="attr-step minus" data-target="${id}" aria-label="Diminuer ${name}">−</button><b id="v${id}" class="attr-rating">${val}</b><span id="d${id}" class="attr-delta zero"></span><button type="button" class="attr-step plus" data-target="${id}" aria-label="Augmenter ${name}">+</button></div></div><input class="attribute-range ${ui.cls}" data-group="${group}" data-name="${name}" data-category-class="${ui.cls}" id="i${id}" type="range" min="25" max="99" value="${val}" aria-label="${name}"><div class="thresholds"><span class="threshold-label">Paliers</span>${BADGE_THRESHOLDS.map(t=>`<span data-threshold="${t}">${t}</span>`).join('')}</div>`;g.appendChild(d);inputs.push(d.querySelector('input'));});root.appendChild(g)});
function ratings(){let r={};inputs.forEach(x=>r[x.dataset.name]=+x.value);return r}
function updateAttributeVisuals(){inputs.forEach(x=>{const pct=Math.max(0,Math.min(100,((+x.value-25)/(+x.max-25))*100));const color=getComputedStyle(document.documentElement).getPropertyValue({'finish':'--cat-finish','shoot':'--cat-shoot','play':'--cat-play','defense':'--cat-defense','physical':'--cat-physical'}[x.dataset.categoryClass]||'--ui-accent').trim();x.style.setProperty('--attr-color',color);x.style.setProperty('--attr-pct',pct+'%');const card=x.closest('.attr');if(card)card.style.setProperty('--cat-color',color);});}
root.querySelectorAll('.attr-step').forEach(btn=>btn.addEventListener('click',()=>{const x=document.getElementById('i'+btn.dataset.target);if(!x)return;const dir=btn.classList.contains('plus')?1:-1;x.value=Math.max(+x.min,Math.min(+x.max,+x.value+dir));x.dispatchEvent(new Event('input',{bubbles:true}));}));
root.querySelectorAll('.quicknav-btn').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('.quicknav-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.getElementById('attr-group-'+safeGroupId(btn.dataset.targetGroup))?.scrollIntoView({behavior:'smooth',block:'center'});}));
function heightInches(){return +document.getElementById('height').value}
function heightText(h){return `${Math.floor(h/12)}'${h%12}"`}
function cmOf(inches){return Math.round(inches*2.54)}
function kgOf(lbs){return Math.round(lbs*0.45359237)}
function updateProfileLabels(){const h=heightInches(),w=+document.getElementById('weight').value,wg=+document.getElementById('wing').value;document.getElementById('heightOut').textContent=`${heightText(h)} (${cmOf(h)} cm)`;document.getElementById('weightOut').textContent=`${w} lbs (${kgOf(w)} kg)`;document.getElementById('wingOut').textContent=`${heightText(wg)} (${cmOf(wg)} cm)`}
function bodyCaps(){
 const h=heightInches(),w=+document.getElementById('weight').value,wing=+document.getElementById('wing').value,pos=document.getElementById('position').value;
 const wingEl=document.getElementById('wing');
 // BUG CORRIGÉ : quand h+2 dépassait le max du slider, la valeur restait clampée
 // et bodyCaps() se rappelait indéfiniment (dépassement de pile dès 7'1").
 const wingMax=+wingEl.max, wingMin=+wingEl.min;
 const minWing=Math.max(wingMin,Math.min(wingMax,h+2)), maxWing=Math.min(wingMax,h+6);
 if(wing<minWing){wingEl.value=minWing; if(+wingEl.value>wing)return bodyCaps()}
 if(wing>maxWing){wingEl.value=maxWing; if(+wingEl.value<wing)return bodyCaps()}
 const size=h-80, wingBonus=Math.max(-3,Math.min(3,(wing-h-2)-2)), weightBonus=(w-210)/35;
 let caps={};inputs.forEach(x=>caps[x.dataset.name]=99);
 const lower=(name,delta)=>caps[name]=Math.round(Math.max(35,Math.min(99,99+delta)));
 lower('Speed',-Math.max(0,size*2.0+Math.max(0,weightBonus)*4)); lower('Agility',-Math.max(0,size*1.7+Math.max(0,weightBonus)*3)); lower('Ball Handle',-Math.max(0,size*1.1+Math.max(0,wingBonus)*2)); lower('Speed With Ball',-Math.max(0,size*1.2+Math.max(0,weightBonus)*2));
 caps['Three-Point']=Math.round(Math.max(75,99-size*0.8-wingBonus*2)); caps['Mid-Range']=Math.round(Math.max(78,99-size*0.5-wingBonus)); caps['Driving Dunk']=Math.round(Math.max(70,99-size*0.5-wingBonus*1.5)); caps['Driving Layup']=Math.round(Math.max(75,99-size*0.2-wingBonus)); caps['Standing Dunk']=Math.round(Math.max(70,99-Math.max(0,-size)*1.5));
 caps['Perimeter Defense']=Math.round(Math.max(72,99-size*0.5-wingBonus*-1)); caps['Steal']=Math.round(Math.max(70,99-size*0.3-wingBonus*-1)); caps['Block']=Math.round(Math.max(70,99+size*1.1+wingBonus*1.5)); caps['Interior Defense']=Math.round(Math.max(70,99+size*0.7+weightBonus*1.2)); caps['Defensive Rebound']=Math.round(Math.max(70,99+size*0.9+wingBonus*1.5)); caps['Offensive Rebound']=Math.round(Math.max(65,99+size*0.8+weightBonus*1.5)); caps['Strength']=Math.round(Math.max(70,99+weightBonus*5+size*0.6)); caps['Vertical']=Math.round(Math.max(70,99-size*0.9)); caps['Close Shot']=Math.round(Math.max(78,99+size*0.1)); caps['Post Control']=Math.round(Math.max(70,99+size*0.7+weightBonus*1.2));
 if(pos==='PG'){caps['Driving Dunk']-=4;caps['Block']-=8;caps['Interior Defense']-=5} if(pos==='C'){caps['Ball Handle']-=10;caps['Speed With Ball']-=8;caps['Block']+=2;caps['Defensive Rebound']+=2} if(pos==='PF'){caps['Ball Handle']-=4;caps['Three-Point']-=2} if(pos==='SG'){caps['Block']-=3}
 return Object.fromEntries(Object.entries(caps).map(([k,v])=>[k,Math.max(40,Math.min(99,Math.round(v)))]));
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
function renderScouting(r,vals){
 const pairs=Object.entries(vals).sort((a,b)=>b[1]-a[1]);
 document.getElementById('strengths').innerHTML=pairs.slice(0,3).map(([k,v])=>`<span>${k} <b>${v}</b></span>`).join('');
 document.getElementById('weaknesses').innerHTML=pairs.slice(-3).reverse().map(([k,v])=>`<span>${k} <b>${v}</b></span>`).join('');
 const ranked=referenceBuilds.map(ref=>{let score=0,total=0;for(const [k,v] of Object.entries(ref.vals)){if(r[k]!=null){score+=Math.max(0,100-Math.abs(r[k]-v)*3);total+=100}}let body=100-Math.abs(heightInches()-ref.h)*2-Math.abs((+weight.value)-ref.w)*.12-Math.abs((+wing.value)-ref.wing)*2;score=(score/Math.max(1,total))*80+Math.max(0,body)*.2; if(ref.pos.includes(position.value))score+=5;return {...ref,score:Math.min(100,Math.round(score))}}).sort((a,b)=>b.score-a.score);
 const best=ranked[0];document.getElementById('referenceBuild').textContent=`${best.name} • ${best.pos.join('/')} • ${heightText(best.h)} • ${best.w} lbs • ${heightText(best.wing)} envergure`;document.getElementById('referenceScore').textContent=best.score+'%';
 const styleScore={Shooter:vals.Tir,Playmaker:vals.Création,Lockdown:vals.Défense,Slasher:vals.Finition,Big:(vals.Défense+vals.Rebond+vals.Physique)/3,Équilibré:(Object.values(vals).reduce((a,b)=>a+b,0)/5)};
 const bestStyle=Object.entries(styleScore).sort((a,b)=>b[1]-a[1])[0];document.getElementById('recommendedStyle').textContent=bestStyle[0];document.getElementById('scoutVerdict').textContent=scoreGrade(Math.round(bestStyle[1]))+' • '+Math.round(bestStyle[1])+'/100';
 document.getElementById('scoutText').textContent=`Ton profil est surtout orienté ${bestStyle[0].toLowerCase()}. Le rapport compare automatiquement tes attributs, ton poste et ton gabarit à plusieurs profils de référence. Les profils de référence sont des exemples publics, pas des builds officiels imposés par 2K.`;
}
function exportBuild(){const obj={schemaVersion:23,dataVersion:window.NBABL_DATA_REGISTRY?.DATA_VERSION||null,position:position.value,height:height.value,weight:weight.value,wing:wing.value,style:style.value,hand:handValue(),attributes:ratings(),badges:unlockedBadgeCount(),animations:unlockedAnimationCount(),capBreakers:breakerTotalValue(),simulatedCost:simulatedCost(ratings()),score:document.getElementById('score').textContent,name:document.getElementById('buildname').textContent,date:new Date().toISOString()};const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nba2k27-build.json';a.click();URL.revokeObjectURL(a.href)}
document.getElementById('exportBuild').onclick=exportBuild;

function simulatedCost(r){return Math.round(Object.entries(r).reduce((sum,[name,v])=>sum+Math.max(0,v-25)*(COST_WEIGHT[name]||1),0));}
function updateBudget(r){const used=simulatedCost(r),budget=1000,pct=Math.min(100,used/budget*100);document.getElementById('budgetUsed').textContent=used;document.getElementById('points').textContent=used;document.getElementById('budgetBar').style.width=pct+'%';document.getElementById('budgetHint').textContent=`Budget indicatif : ${used} / ${budget} — modèle non officiel`;document.getElementById('budgetBox')?.classList.toggle('over',used>budget);inputs.forEach(x=>{const id=x.dataset.name.replace(/[^a-z0-9]/gi,'');document.querySelectorAll('#i'+id+' + .thresholds span').forEach(s=>s.classList.toggle('hit',+x.value>=+s.dataset.threshold))})}
function nextUnlocks(r){return Object.entries(r).map(([k,v])=>({k,v,next:BADGE_THRESHOLDS.find(t=>t>v)})).filter(x=>x.next).sort((a,b)=>(a.next-a.v)-(b.next-b.v)).slice(0,5)}
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
 updateProfileLabels();const caps=bodyCaps();clampInputsToCaps(caps);const r=ratings();updateBudget(r);let sums={};Object.keys(data).forEach(k=>sums[k]=[]);inputs.forEach(x=>{document.getElementById('v'+x.dataset.name.replace(/[^a-z0-9]/gi,'')).textContent=x.value;sums[x.dataset.group].push(+x.value)});let avg=k=>Math.round(sums[k].reduce((a,b)=>a+b,0)/sums[k].length),vals={Finition:avg('Finition'),Tir:avg('Tir'),Création:avg('Création'),Défense:avg('Défense'),Rebond:avg('Rebond'),Physique:avg('Physique')};Object.entries(vals).forEach(([k,v])=>{const el=document.getElementById('avg-'+safeGroupId(k));if(el)el.textContent=v;});updateAttributeVisuals();const SCORE_W={Finition:1,Tir:1,Création:1,Défense:1,Rebond:.6,Physique:1};let wsum=0,wtot=0;Object.keys(vals).forEach(k=>{const w=SCORE_W[k]||1;wsum+=vals[k]*w;wtot+=w});let score=Math.round(wsum/wtot);document.getElementById('score').textContent=score;const ring=document.querySelector('.summary-ring');if(ring)ring.style.setProperty('--score-pct',Math.max(0,Math.min(100,score))+'%');document.getElementById('buildGrade').textContent=scoreGrade(score);let nm=buildName(vals);document.getElementById('buildname').textContent=nm;const meta=document.getElementById('buildMeta');if(meta)meta.textContent=`${document.getElementById('position').value} • ${heightText(heightInches())} • ${document.getElementById('weight').value} lbs`;for(const [k,v] of Object.entries(vals)){let id={Finition:'finish',Tir:'shoot',Création:'play',Défense:'def',Rebond:'reb',Physique:'phys'}[k];const ve=document.getElementById(id+'Val');if(ve)ve.textContent=v;const be=document.getElementById(id+'Bar');if(be)be.style.width=v+'%'}updateAttributeDeltas();
 let capped=inputs.filter(x=>+x.value>=+(x.max||99)).length;document.getElementById('capStatus').textContent=`${capped} / ${inputs.length} au cap`;document.getElementById('bodyHint').textContent=`${document.getElementById('position').value} • ${heightText(heightInches())} • ${heightText(+document.getElementById('wing').value)} envergure — les caps évoluent avec le gabarit.`;renderBadges(r);renderTakeovers(r);renderBreakers(r);renderAnimations();renderScouting(r,vals);renderValidation(r,caps);
}
function badgeTier(def,r){
 const h=heightInches();
 if(h<def.minH||h>def.maxH) return {tier:'Non disponible',cls:'none',level:0,missing:`Taille requise : ${Math.floor(def.minH/12)}'${def.minH%12}"–${Math.floor(def.maxH/12)}'${def.maxH%12}"`};
 const tiers=['Bronze','Argent','Or','Hall of Fame'];
 const okAt=(idx)=>def.req[def.logic==='OR'?'some':'every'](q=>(r[q[0]]||0)>= (q[idx+1] ?? 999));
 let level=0; for(let i=0;i<4;i++){if(okAt(i)) level=i+1;}
 return level?{tier:tiers[level-1],cls:['bronze','silver','gold','hof'][level-1],level}:{tier:'Non débloqué',cls:'none',level:0};
}
const BADGE_ART_IDS={
'Aerial Wizard':1,'Ankle Assassin':2,'Ankle Braces':3,'Arc Cadence':4,'Bail Out':5,'Boxout Boss':6,'Break Starter':7,'Breaker':8,'Brick Wall':9,'Bruiser':10,'Challenger':11,'Crasher':12,'Deadeye':13,'Dimer':14,'Flash':15,'Float Game':16,'Ghost Stepper':17,'Glove':18,'Handles for Days':19,'High-Flying Denier':20,'Hook Specialist':21,'Immovable Enforcer':22,'Interceptor':23,'Layup Mixmaster':24,'Lightning Launch':25,'Limitless Range':26,'Mini Marksman':27,'Off-Ball Pest':28,'Pace':29,'Paint Patroller':30,'Paint Prodigy':31,'Physical Finisher':32,'Pick Dodger':33,'Pogo Stick':34,'Possession Closer':35,'Posterizer':36,'Post Fade Phenom':37,'Post Lockdown':38,'Post Powerhouse':39,'Post Spin Catalyst':40,'Quick Trigger':41,'Rise Up':42,'Seatbelt':43,'Set and Fire':44,'Slippery Off-Ball':45,'Smooth Operator':46,'Static Middy':47,'Strong Handle':48,'Sync Snatcher':49,'Unpluckable':50,'Versatile Visionary':51,'Wall Up':52,'Work Horse':53};
function badgeArtUrl(name,tier){const id=BADGE_ART_IDS[name];if(!id)return '';const slug=name.toLowerCase().replace(/\s+/g,'-');const ts={bronze:'bronze',silver:'silver',gold:'gold',hof:'hof'}[tier]||'bronze';return `https://www.2kratings.com/wp-content/uploads/${String(id).padStart(2,'0')}-${slug}-${ts}.png`}
function badgeIcon(cat){return ({Tir:'🎯',Création:'🪄',Finition:'🔥',Défense:'🛡️',Rebond:'🏀',Physique:'⚡'}[cat]||'🏅')}
function renderBadges(r){
 const filter=document.getElementById('badgeFilter').value,search=document.getElementById('badgeSearch').value.toLowerCase().trim();
 const source=getDataQuality?.('badges');
 const sourceEl=document.getElementById('badgeDataSource');
 if(sourceEl&&source){
   const label=dataQualityLabel?.('badges')||source.confidence;
   sourceEl.innerHTML=`📚 Source badges : <a href="${source.sourceUrl}" target="_blank" rel="noopener noreferrer">${source.source}</a> · <strong>${label}</strong> · ${badgeDefs.length}/53 badges intégrés.`;
 }

 let list=document.getElementById('badgeList'),unlocked=0,html='';
 badgeDefs.forEach(def=>{
  const st=badgeTier(def,r), ok=st.level>0; if(ok)unlocked++;
  if((filter==='unlocked'&&!ok)||(filter==='locked'&&ok)||(search&&!def.name.toLowerCase().includes(search)))return;
  const reqText=def.req.map(q=>`${q[0]} ${q[1]} / ${q[2]} / ${q[3]} / ${q[4]??'—'}`).join(def.logic==='OR'?'  OU  ':'  +  ');
  const next=st.level<4 ? def.req.map(q=>q[st.level+1]??'—').join(' / ') : 'MAX';
  html+=`<article class="badge-card ${st.cls} ${ok?'unlocked':''}">
   <div class="badge-photo ${st.cls}" role="img" aria-label="${def.name} — ${st.tier}"><span aria-hidden="true">${badgeIcon(def.cat)}</span>${st.level===0?'<i class="badge-lock" aria-hidden="true">🔒</i>':''}</div>
   <div class="badge-main"><div class="badge-title"><b>${def.name}</b><span class="badge-category">${def.cat}</span></div>
   <div class="badge-tier ${st.cls}">${st.tier}</div>
   <div class="badge-levels"><span class="bronze">Bronze</span><span class="silver">Argent</span><span class="gold">Or</span><span class="hof">HOF</span></div>
   <small>${st.level?`Tu peux l'équiper en <strong>${st.tier}</strong>.`:'Tu ne peux pas encore l’équiper.'} • ${def.logic==='OR'?'un des critères':'tous les critères'} requis</small>
   <div class="badge-req">${reqText}</div>
   ${st.level<4&&st.level>0?`<div class="badge-next">Prochain palier : <b>${next}</b></div>`:''}
   </div></article>`;
 });
 list.innerHTML=html||'<div class="empty">Aucun badge dans ce filtre.</div>';
 document.getElementById('badgeUnlocked').textContent=unlocked+' accessibles'; document.getElementById('badgeTotal').textContent=badgeDefs.length;
}

function renderTakeovers(r){let list=document.getElementById('takeoverList'),scores=takeoverDefs.map(([name,attr,need])=>({name,attr,need,score:Math.min(100,Math.round((r[attr]||0)/need*100))})).sort((a,b)=>b.score-a.score);list.innerHTML=scores.map(x=>`<button class="takeover ${x.score>=100?'ready':''}" data-take="${x.name}"><span>${x.name}<small>${x.attr} requis : ${x.need}</small></span><b>${x.score}%</b></button>`).join('');document.getElementById('takeoverScore').textContent=scores[0].score+' / 100';list.querySelectorAll('.takeover').forEach(b=>b.onclick=()=>{list.querySelectorAll('.takeover').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')})}
function buildBodySignature(){
 const p=[position.value,height.value,weight.value,wing.value].join('|');
 let h=0; for(let i=0;i<p.length;i++) h=((h<<5)-h+p.charCodeAt(i))|0;
 return 'v19_'+Math.abs(h).toString(36);
}
function breakerStorageKey(attr){return 'nba2k27_cb_'+buildBodySignature()+'_'+attr.replace(/[^a-z0-9]/gi,'');}
function tokenStorageKey(){return 'nba2k27_tokens_'+buildBodySignature();}
function getBreaker(attr){return +(localStorage.getItem(breakerStorageKey(attr))||0)}
function setBreaker(attr,value){localStorage.setItem(breakerStorageKey(attr),String(Math.max(0,Math.min(5,Math.round(value)))))}
function renderBreakers(r){
 const list=document.getElementById('breakerList');
 list.innerHTML=inputs.map(x=>{
  const id=x.dataset.name.replace(/[^a-z0-9]/gi,''), used=+(getBreaker(x.dataset.name)||0), cap=+x.max;
  return `<div class="breaker-row"><div><b>${x.dataset.name}</b><small>${r[x.dataset.name]}/${cap}</small></div><button data-b="${id}" data-dir="-">−</button><strong>${used}</strong><button data-b="${id}" data-dir="+">+</button></div>`;
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
function renderAnimations(){const r=ratings(),h=heightInches(),cat=document.getElementById('animCategory').value,status=document.getElementById('animStatus').value,search=document.getElementById('animSearch').value.toLowerCase().trim();let all=ANIMATIONS.filter(a=>(cat==='all'||a.category===cat)&&(!search||a.name.toLowerCase().includes(search)||a.category.toLowerCase().includes(search))),unlocked=0,list=document.getElementById('animationList');list.innerHTML='';all.forEach(a=>{const heightOK=h>=a.minH&&h<=a.maxH,fails=Object.entries(a.req).filter(([k,v])=>(r[k]??0)<v),ok=heightOK&&!fails.length;if(ok)unlocked++;if(status==='yes'&&!ok||status==='no'&&ok)return;const reqHtml=Object.entries(a.req).map(([k,v])=>`<span class="req ${r[k]>=v?'pass':'fail'}">${k}: ${r[k]??0}/${v}</span>`).join('');list.insertAdjacentHTML('beforeend',`<article class="anim-card ${ok?'ok':''}"><div class="anim-top"><div class="anim-name">${a.name}</div><span class="anim-badge">${ok?'✓ ACCESSIBLE':'🔒 BLOQUÉE'}</span></div><div class="anim-meta">${a.category} • ${heightText(a.minH)} – ${heightText(a.maxH)}</div><div class="reqs">${reqHtml||'<span class="req pass">Aucun attribut requis</span>'}</div>${!heightOK?`<div class="missing">Taille requise : ${heightText(a.minH)} à ${heightText(a.maxH)}.</div>`:''}${fails.length?`<div class="missing">Il manque : ${fails.map(([k,v])=>`${k} ${v-(r[k]??0)} pts`).join(' • ')}</div>`:''}<small>${ok?'Équipable avec ce build.':'Modifie le build pour débloquer cette animation.'}</small></article>`)});document.getElementById('animUnlocked').textContent=unlocked;document.getElementById('animTotal').textContent=ANIMATIONS.length}
function handValue(){return document.getElementById('dominantHand')?.value||'Droite'}
function serialize(){let obj={position:position.value,height:height.value,weight:weight.value,wing:wing.value,style:style.value,hand:handValue(),attrs:Object.fromEntries(inputs.map(x=>[x.dataset.name,x.value]))};return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))}
function apply(obj){position.value=obj.position||'SF';height.value=obj.height||80;weight.value=obj.weight||210;wing.value=obj.wing||84;style.value=obj.style||'Équilibré';const handEl=document.getElementById('dominantHand');if(handEl&&obj.hand)handEl.value=obj.hand;update();if(obj.attrs)inputs.forEach(x=>{if(obj.attrs[x.dataset.name])x.value=Math.min(+obj.attrs[x.dataset.name],+x.max)});update()}
inputs.forEach(x=>x.addEventListener('input',update));['position','height','weight','wing','style'].forEach(id=>document.getElementById(id).addEventListener('input',update));['animCategory','animStatus'].forEach(id=>document.getElementById(id).addEventListener('change',renderAnimations));document.getElementById('animSearch').addEventListener('input',renderAnimations);['badgeFilter'].forEach(id=>document.getElementById(id).addEventListener('change',()=>renderBadges(ratings())));document.getElementById('badgeSearch').addEventListener('input',()=>renderBadges(ratings()));
function optimizerProfile(style){
 const profiles={
  'Shooter':{'Three-Point':1.35,'Mid-Range':1.05,'Free Throw':.45,'Speed':.65,'Agility':.7,'Ball Handle':.55,'Perimeter Defense':.55},
  'Slasher':{'Driving Dunk':1.35,'Driving Layup':1.05,'Vertical':1.0,'Speed':.8,'Agility':.75,'Ball Handle':.45,'Strength':.55},
  'Playmaker':{'Ball Handle':1.25,'Pass Accuracy':1.15,'Speed With Ball':1.15,'Speed':.8,'Agility':.8,'Three-Point':.55,'Perimeter Defense':.45},
  'Lockdown':{'Perimeter Defense':1.3,'Steal':1.15,'Agility':1.0,'Strength':.9,'Block':.75,'Speed':.8,'Vertical':.6},
  'Big':{'Interior Defense':1.1,'Block':1.15,'Defensive Rebound':1.3,'Offensive Rebound':1.15,'Strength':1.15,'Standing Dunk':.9,'Vertical':.75,'Post Control':.8},
  'Équilibré':{'Three-Point':.8,'Driving Dunk':.8,'Ball Handle':.8,'Pass Accuracy':.8,'Perimeter Defense':.8,'Speed':.75,'Agility':.75,'Strength':.7,'Vertical':.7}
 };
 return profiles[style]||profiles['Équilibré'];
}
function badgeTargetScore(r, height){
 let score=0, unlocked=0;
 for(const d of badgeDefs){
  if(height<d.minH||height>d.maxH) continue;
  const st=badgeTier(d,r); if(st.level>0){unlocked++; score+=12+st.level*5;}
 }
 return {score,unlocked};
}
function optimizerScore(r,style,height){
 const weights=optimizerProfile(style); let score=0;
 for(const [k,w] of Object.entries(weights)) score+=(r[k]||0)*w;
 const b=badgeTargetScore(r,height); score+=b.score;
 const cats=categoryAverages(r); const avg=Object.values(cats).reduce((a,b)=>a+b,0)/Object.keys(cats).length;
 if(style==='Équilibré') score+=avg*2;
 return score;
}
function optimizeBuild(){
 const style=document.getElementById('style').value, caps=bodyCaps(), original=ratings(), height=heightInches();
 const target=optimizerProfile(style), names=inputs.map(x=>x.dataset.name);
 let base={...original};
 // Keep the current simulated investment roughly constant: the optimizer only redistributes points.
 const budget=simulatedCost(base);
 const protectedAttrs=new Set(Object.entries(target).filter(([,w])=>w>=1.0).map(([k])=>k));
 const candidates=[];
 for(let pass=0;pass<4;pass++){
  let improved=true;
  while(improved){
   improved=false; let best=null;
   // base ne change pas durant ce passage : un seul calcul, pas un par paire (up,down).
   const baseScore=optimizerScore(base,style,height);
   for(const up of names){
    if(!(target[up]>0) || base[up]>=caps[up]) continue;
    for(const down of names){
     if(up===down || base[down]<=25) continue;
     const trial={...base,[up]:base[up]+1,[down]:base[down]-1};
     const cost=simulatedCost(trial);
     if(cost>budget+1.2 || cost<budget-1.2) continue;
     const delta=optimizerScore(trial,style,height)-baseScore;
     if(delta>0.05 && (!best||delta>best.delta)) best={up,down,delta,trial};
    }
   }
   if(best){base=best.trial;improved=true}
  }
  // Small targeted bump toward the next badge threshold when there is spare budget.
  for(const attr of protectedAttrs){
   if(base[attr]>=caps[attr]) continue;
   let next=badgeDefs.flatMap(d=>d.req.filter(q=>q[0]===attr).map(q=>q[1])).filter(v=>v>base[attr]).sort((a,b)=>a-b)[0];
   if(next && next-base[attr]<=3){const trial={...base,[attr]:Math.min(caps[attr],next)};if(simulatedCost(trial)<=budget+1.2)base=trial}
  }
 }
 const before=badgeTargetScore(original,height),after=badgeTargetScore(base,height);
 const changed=names.filter(k=>base[k]!==original[k]).map(k=>({name:k,from:original[k],to:base[k],delta:base[k]-original[k]}));
 inputs.forEach(x=>x.value=Math.min(+x.max,Math.max(+x.min,base[x.dataset.name]??+x.value)));
 update();
 const top=changed.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,10);
 const content=`<div class="modal-kicker">OPTIMISEUR V20.4 • ${style.toUpperCase()}</div><h2>Optimisation terminée</h2><p class="sub">Le moteur a redistribué les points à coût simulé quasi constant. Les caps et coûts utilisés restent <strong>indicatifs</strong> tant que les tables internes complètes de 2K27 ne sont pas publiques.</p><div class="modal-stats"><div><b>${before.unlocked}</b><span>badges avant</span></div><div><b>${after.unlocked}</b><span>badges après</span></div><div><b>${simulatedCost(original)}</b><span>coût avant</span></div><div><b>${simulatedCost(base)}</b><span>coût après</span></div></div><h3>Principaux changements</h3><div class="modal-attrs">${top.length?top.map(x=>`<div><span>${x.name}</span><b>${x.from} → ${x.to}</b></div>`).join(''):'<div><span>Build déjà optimisé</span><b>Aucun changement</b></div>'}</div><div class="modal-actions"><button data-close-modal>Garder ce build</button><button class="secondary" data-close-modal>Fermer</button></div>`;
 const modal=document.getElementById('buildModal');document.getElementById('buildModalContent').innerHTML=content;modal.classList.add('open');modal.setAttribute('aria-hidden','false');
}
document.getElementById('optimize').onclick=optimizeBuild;

document.getElementById('reset').onclick=()=>{localStorage.removeItem('nba2k27_build');location.reload()};document.getElementById('save').onclick=()=>{localStorage.setItem('nba2k27_build',serialize());alert('Build sauvegardé sur cet appareil.')};document.getElementById('load').onclick=()=>{let s=localStorage.getItem('nba2k27_build');if(!s)return alert('Aucun build sauvegardé.');apply(JSON.parse(decodeURIComponent(escape(atob(s)))))};document.getElementById('share').onclick=()=>{navigator.clipboard?.writeText(location.origin+location.pathname+'?build='+serialize()).then(()=>alert('Lien du build copié.')).catch(()=>alert('Copie automatique indisponible.'))};
document.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',()=>{const m=document.getElementById('buildModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}));
let params=new URLSearchParams(location.search);if(params.get('build')){try{apply(JSON.parse(decodeURIComponent(escape(atob(params.get('build'))))))}catch(e){update()}}else update();

// V9 — Build Validator: explicit consistency checks without claiming undocumented 2K internals.
function validateBuild(r,caps){
  const errors=[]; const warnings=[];
  const h=heightInches(), w=+document.getElementById('weight').value, wing=+document.getElementById('wing').value;
  const wingEl=document.getElementById('wing'), wingSliderMax=+wingEl.max, wingSliderMin=+wingEl.min;
  const minWing=Math.max(wingSliderMin,h+2), maxWing=Math.min(wingSliderMax,h+6);
  if(wing<minWing||wing>maxWing) errors.push(`Envergure invalide pour ${heightText(h)} : ${heightText(minWing)} à ${heightText(maxWing)}.`);
  inputs.forEach(x=>{const v=+x.value, cap=+(caps[x.dataset.name]??99); if(v>cap) errors.push(`${x.dataset.name} ${v} dépasse le cap calculé de ${cap}.`);});
  const animFailures=[]; ANIMATIONS.forEach(a=>{const heightOK=h>=a.minH&&h<=a.maxH; const fails=Object.entries(a.req).filter(([k,v])=>(r[k]??0)<v); if(!heightOK||fails.length) animFailures.push(a)});
  // Badge engine itself is the source of truth for the embedded badge table: no impossible tier is displayed.
  // renderBadges() vient de parcourir les 53 badges pour le même r : on relit son
  // total plutôt que de refaire la boucle badgeTier().
  const badgeCount=unlockedBadgeCount();
  const used=simulatedCost(r), budget=1000;
  if(used>budget) warnings.push(`Le budget indicatif simulé est dépassé de ${used-budget}.`);
  warnings.push('Le coût des attributs et les caps sont indicatifs tant que les tables internes complètes de 2K27 ne sont pas publiées.');
  return {errors,warnings,animFailures,badgeCount,used,budget};
}
function renderValidation(r,caps){
  const v=validateBuild(r,caps), status=document.getElementById('validationStatus'), head=document.getElementById('validationHeadline'), list=document.getElementById('validationErrors');
  const valid=v.errors.length===0; const hasWarn=v.warnings.length>0;
  status.className='validation-status '+(valid?'valid': 'invalid'); status.textContent=valid?'BUILD COHÉRENT':'BUILD À CORRIGER';
  head.className='validation-headline '+(valid?'valid':'invalid'); head.textContent=valid?'🟢 Build cohérent avec les règles intégrées':'🔴 Build non valide selon les règles intégrées';
  document.getElementById('validationText').textContent=valid?'Aucune contradiction détectée entre le gabarit, les caps calculés et les données de badges/animations embarquées.':'Le site a détecté au moins une contradiction. Corrige les points ci-dessous avant de considérer le build comme reproductible.';
  document.getElementById('checkBody').textContent=(v.errors.some(e=>e.includes('Envergure'))?'✕':'✓');
  document.getElementById('checkCaps').textContent=(v.errors.some(e=>e.includes('dépasse le cap'))?'✕':'✓');
  document.getElementById('checkBadges').textContent=`✓ ${v.badgeCount} accessibles`;
  document.getElementById('checkAnimations').textContent=`✓ ${ANIMATIONS.length-v.animFailures.length}/${ANIMATIONS.length}`;
  const budgetEl=document.getElementById('checkBudget');budgetEl.textContent=`${v.used>v.budget?'✕':'✓'} ${v.used}/${v.budget}`;
  ['checkBody','checkCaps','checkBadges','checkAnimations','checkBudget'].forEach(id=>{const el=document.getElementById(id);el.className=(el.textContent.includes('✕')?'fail':(el.textContent.includes('✓')?'pass':'warn'))});
  let html=v.errors.map(e=>`<div class="validation-error">❌ ${e}</div>`).join(''); if(!html) html='<div class="validation-ok">✅ Aucun conflit détecté avec les règles actuellement intégrées.</div>'; list.innerHTML=html;
  if(v.warnings.length) list.insertAdjacentHTML('beforeend',`<div class="validation-error" style="background:rgba(255,190,50,.07);border-color:rgba(255,190,50,.18)">⚠️ ${v.warnings[0]}</div>`);
}


/* V10 — Build Hub / Compare / Badge Tokens / Synergy / Takeover Loadout */
const V10_KEY='nba2k27_build_hub_v19';
const DISCIPLINES=['Finition','Tir','Création','Défense','Rebond','Physique'];
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
function unlockedBadgeCount(){const el=document.getElementById('badgeUnlocked');if(!el)return 0;const m=String(el.textContent).match(/\d+/);return m?+m[0]:0;}
function unlockedAnimationCount(){const el=document.getElementById('animUnlocked');return el?Math.max(0,+el.textContent||0):0;}
function currentBuildObject(){
 const r=ratings();
 const id='b-'+Date.now();
 const caps=bodyCaps();
 const validation=validateBuild(r,caps);
 return {
   id,name:document.getElementById('buildname').textContent,position:position.value,
   height:+height.value,weight:+weight.value,wing:+wing.value,
   score:+document.getElementById('score').textContent,style:style.value,
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

function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function breakerTotalValue(){return inputs.reduce((s,x)=>s+ +(getBreaker(x.dataset.name)||0),0)}
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
   <div class="modal-stats"><div><b>${x.score||0}</b><span>Score</span></div><div><b>${x.badges||0}</b><span>Badges</span></div><div><b>${x.animations||0}</b><span>Animations</span></div><div><b>${x.capBreakers||0}</b><span>CB</span></div></div>
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
 const url=location.origin+location.pathname+'?build='+btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
 navigator.clipboard?.writeText(url).then(()=>alert('Lien du build copié.')).catch(()=>prompt('Copie ce lien :',url));
}

function hubById(id){return [...readHub(),...demoCommunity].find(x=>x.id===id)}
function loadHubBuild(id){const x=hubById(id);if(!x)return;apply({position:x.position,height:x.height,weight:x.weight,wing:x.wing,style:x.style,attrs:x.attributes});location.hash='builder';window.scrollTo({top:document.getElementById('builder').offsetTop-80,behavior:'smooth'})}
function addCurrentToHub(){const x=currentBuildObject();const arr=readHub();arr.unshift(x);writeHub(arr.slice(0,30));renderCommunity();alert('Build ajouté à ta bibliothèque locale.')}

let compareBuilds=[];
function addCompareById(id){const x=hubById(id);if(!x)return;if(compareBuilds.some(b=>b.id===x.id))return;if(compareBuilds.length>=3){alert('Maximum 3 builds.');return}compareBuilds.push(x);renderCompare()}
function renderCompare(){
 const slots=document.getElementById('compareSlots');if(!slots)return;
 slots.innerHTML=[0,1,2].map(i=>{const x=compareBuilds[i];return x?`<div class="compare-slot filled"><b>${x.name}</b><small>${x.position} • ${heightLabel(x.height)} • ${x.score}/100</small><button data-remove-compare="${x.id}">×</button></div>`:`<div class="compare-slot"><span>Emplacement ${i+1}</span><small>Ajoute un build depuis le Build Hub</small></div>`}).join('');
 slots.querySelectorAll('[data-remove-compare]').forEach(b=>b.onclick=()=>{compareBuilds=compareBuilds.filter(x=>x.id!==b.dataset.removeCompare);renderCompare()});
 const wrap=document.getElementById('compareTable'); if(compareBuilds.length<2){wrap.innerHTML='<div class="empty">Sélectionne au moins 2 builds pour lancer la comparaison.</div>';return}
 const keys=['Close Shot','Driving Layup','Driving Dunk','Three-Point','Mid-Range','Pass Accuracy','Ball Handle','Speed With Ball','Perimeter Defense','Steal','Block','Defensive Rebound','Speed','Agility','Strength','Vertical'];
 wrap.innerHTML=`<table class="compare-table"><thead><tr><th>Attribut</th>${compareBuilds.map(x=>`<th>${x.name}<small>${x.position} • ${heightLabel(x.height)}</small></th>`).join('')}</tr></thead><tbody>${keys.map(k=>`<tr><td>${k}</td>${compareBuilds.map(x=>`<td>${x.attributes?.[k]??'—'}</td>`).join('')}</tr>`).join('')}<tr class="compare-total"><td>Score</td>${compareBuilds.map(x=>`<td>${x.score}</td>`).join('')}</tr></tbody></table>`;
}

function renderProDashboard(){
 const caps=bodyCaps(), r=ratings(), v=validateBuild(r,caps);
 const badgeCount=+document.getElementById('badgeTotal').textContent||0;
 const animCount=+document.getElementById('animTotal').textContent||0;
 const bodyOK=v.errors.filter(e=>e.includes('Envergure')).length===0;
 const capOK=v.errors.filter(e=>e.includes('dépasse le cap')).length===0;
 const badgeOK=badgeCount>0;
 const animOK=animCount>0;
 const budgetOK=v.used<=v.budget;
 const checks=[bodyOK,capOK,badgeOK,animOK,budgetOK];
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
   ['Animations calculées pour ce profil',animOK],
   ['Budget indicatif non dépassé',budgetOK]
 ];
 const rp=document.getElementById('reproList'); if(rp)rp.innerHTML=repro.map(([n,ok])=>`<div class="repro-row"><span>${ok?'✓':'✕'} ${n}</span><b class="${ok?'pass':'fail'}">${ok?'OK':'À corriger'}</b></div>`).join('');
 const rpp=document.getElementById('reproPercent');if(rpp)rpp.textContent=pct+'%';
 const ul=document.getElementById('uncertaintyList');if(ul)ul.innerHTML=[
   'Caps et coûts internes exacts : non publiés comme table complète.',
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
document.getElementById('addCurrentBuild')?.addEventListener('click',addCurrentToHub);
document.getElementById('communitySearch')?.addEventListener('input',renderCommunity);document.getElementById('communityPos')?.addEventListener('change',renderCommunity);
document.getElementById('clearCompare')?.addEventListener('click',()=>{compareBuilds=[];renderCompare()});
const oldUpdate=update; update=function(){oldUpdate();renderSynergy();renderTakeoverLoadout()};
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
 const q=new URLSearchParams(location.search).get('build');
 if(q){try{apply(JSON.parse(decodeURIComponent(escape(atob(q)))))}catch(e){}}
})();

renderCommunity();renderCompare();renderTokens();renderProDashboard();renderCBProgression();

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
// Les onglets du hub (community.js) redemandent un rendu de la liste.
window.renderCommunity=renderCommunity;
