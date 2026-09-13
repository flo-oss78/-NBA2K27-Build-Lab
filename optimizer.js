/* NBA 2K27 Build Lab — Optimiseur de build
   Extrait d'app.js (phase 1). Redistribue les points à coût simulé constant.
   Chargé APRÈS app.js : rien ici n'est appelé pendant son exécution, seulement
   au clic sur « Optimiser ». dna-engine.js réutilise optimizerProfile().
*/
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
