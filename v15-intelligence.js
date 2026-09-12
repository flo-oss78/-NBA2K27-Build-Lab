/* V15 — Build Intelligence. Additive layer: does not replace the existing builder engine. */
(function(){
  const CATS={Finition:'finish',Tir:'shoot',Création:'play',Défense:'defense',Rebond:'rebound',Physique:'physical'};
  const LABELS={Finition:'Finition',Tir:'Tir',Création:'Organisation',Défense:'Défense',Rebond:'Rebond',Physique:'Physique'};
  let simple=true,lastNext=null;
  const $=id=>document.getElementById(id);
  const esc=window.escHtml;
  function current(){
    const r=ratings();
    const vals=categoryAverages(r);
    return {r,vals,h:+$('height').value,w:+$('weight').value,wing:+$('wing').value,pos:$('position').value};
  }
  function scoreLevel(v){return v>=90?'exceptional':v>=85?'elite':v>=75?'good':v>=60?'developing':'low'}
  function identity(vals){
    const order=Object.entries(vals).sort((a,b)=>b[1]-a[1]);
    const top=order.slice(0,2).map(([k])=>k);
    const names={
      'Tir|Création':'Shot Creator / Handler','Tir|Finition':'Scoring Wing','Tir|Défense':'Two-Way Shooter','Création|Défense':'Two-Way Creator','Création|Finition':'Slashing Creator','Défense|Finition':'Two-Way Slasher','Physique|Défense':'Athletic Stopper','Physique|Finition':'Athletic Finisher','Physique|Tir':'Athletic Shooter'
    };
    const key=top.slice().sort().join('|');
    return names[key] || (top[0]==='Défense'?'Defensive Specialist':top[0]==='Tir'?'Shooter':top[0]==='Création'?'Playmaker':top[0]==='Finition'?'Finisher':'Two-Way Build');
  }
  function renderCategories(vals){
    $('v15CategoryScores').innerHTML=Object.entries(vals).map(([k,v])=>`<div class="v15-cat ${CATS[k]||''}"><span>${LABELS[k]||k}</span><b>${v}</b><i><em style="width:${v}%"></em></i></div>`).join('');
  }
  function candidateUnlocks(r){
    const out=[];
    badgeDefs.forEach(d=>{
      const st=badgeTier(d,r); if(st.level>=4) return;
      const missing=[];
      d.req.forEach(q=>{
        const threshold=q[st.level+1]; if(threshold!=null && (r[q[0]]??0)<threshold) missing.push({attr:q[0],need:threshold,delta:threshold-(r[q[0]]??0)});
      });
      if(missing.length===1) out.push({type:'badge',name:d.name,cat:d.cat,attr:missing[0].attr,need:missing[0].need,delta:missing[0].delta,tier:st.level+1});
    });
    return out.sort((a,b)=>a.delta-b.delta).slice(0,8);
  }
  function renderUnlocks(r){
    const arr=candidateUnlocks(r); $('v15UnlockCount').textContent=`${arr.length} objectif${arr.length>1?'s':''} proche${arr.length>1?'s':''}`;
    $('v15Unlocks').innerHTML=arr.length?arr.map((x,i)=>`<button class="v15-unlock ${CATS[x.cat]||''}" data-next-attr="${esc(x.attr)}"><div><b>${esc(x.name)}</b><small>${esc(x.cat)} • niveau ${['','Bronze','Argent','Or','HOF'][x.tier]||x.tier}</small></div><strong>+${x.delta}</strong><span>${esc(x.attr)} → ${x.need}</span></button>`).join(''):'<div class="v15-empty">Aucun palier à 1 seul attribut n’est actuellement identifié.</div>';
    $('v15Unlocks').querySelectorAll('[data-next-attr]').forEach(b=>b.onclick=()=>jumpToAttribute(b.dataset.nextAttr));
    lastNext=arr[0]||null;
    $('v15NextTitle').textContent=lastNext?`${lastNext.name} — ${lastNext.attr}`:'Aucun objectif proche';
    $('v15NextText').textContent=lastNext?`Il te manque ${lastNext.delta} point${lastNext.delta>1?'s':''} sur ${lastNext.attr} pour le prochain niveau intégré.`:'Monte un attribut ou change ton profil pour générer de nouveaux objectifs.';
    $('v15JumpNext').disabled=!lastNext; $('v15JumpNext').onclick=()=>lastNext&&jumpToAttribute(lastNext.attr);
  }
  function playerSimilarity(build,p){
    const keys=['Finition','Tir','Création','Défense','Physique'];
    let sum=0,weight=0;
    const weights={Finition:1.15,Tir:1.15,Création:1.1,Défense:1,Physique:.9};
    keys.forEach(k=>{sum+=(100-Math.abs(build.vals[k]-p.axes[k]))*weights[k];weight+=100*weights[k]});
    const body=100-(Math.abs(build.h-p.height)*3+Math.abs(build.w-p.weight)*.08+Math.abs(build.wing-p.wingspan)*2);
    let score=(sum/weight)*85+Math.max(0,body)*.15;
    if(p.positions.includes(build.pos))score+=4;
    return Math.max(0,Math.min(99,Math.round(score)));
  }
  function renderPlayers(build){
    const ranked=PLAYERS_DATA.map(p=>({...p,match:playerSimilarity(build,p)})).sort((a,b)=>b.match-a.match).slice(0,5);
    $('v15Players').innerHTML=ranked.map((p,i)=>{
      const diff=Object.entries(build.vals).map(([k,v])=>({k,d:Math.abs(v-p.axes[k])})).sort((a,b)=>b.d-a.d)[0];
      return `<article class="v15-player"><div class="v15-rank">${i+1}</div><div class="v15-player-main"><div class="v15-player-top"><b>${esc(p.name)}</b><span>${p.match}%</span></div><small>${esc(p.team)} • ${p.positions.join('/')} • ${heightText(p.height)} • ${p.ovr} OVR</small><div class="v15-player-bar"><i style="width:${p.match}%"></i></div><p><b>Profil proche :</b> ${esc(p.archetype)}. <b>Plus gros écart :</b> ${LABELS[diff.k]} (${diff.d} pts).</p></div></article>`;
    }).join('');
    $('v15Why').innerHTML=ranked.slice(0,3).map(p=>`<div><b>${esc(p.name)}</b> — ${p.match}% : comparaison pondérée des 5 axes, du gabarit et d’un bonus de poste compatible.</div>`).join('');
  }
  function render(){
    const b=current(),name=identity(b.vals);
    $('v15IdentityName').textContent=name;
    $('v15IdentityText').textContent=`${b.pos} • ${heightText(b.h)} • ${b.w} lbs • ${heightText(b.wing)} d’envergure. Ton axe dominant est ${LABELS[Object.entries(b.vals).sort((a,c)=>c[1]-a[1])[0][0]]}.`;
    $('v15IdentityTags').innerHTML=Object.entries(b.vals).sort((a,c)=>c[1]-a[1]).slice(0,3).map(([k,v])=>`<span class="${CATS[k]||''}">${LABELS[k]} ${v}</span>`).join('');
    renderCategories(b.vals); renderUnlocks(b.r); renderPlayers(b);
  }
  function jumpToAttribute(name){
    const id='i'+name.replace(/[^a-z0-9]/gi,''); const el=$(id); if(!el)return;
    el.scrollIntoView({behavior:simple?'smooth':'auto',block:'center'}); el.focus({preventScroll:true});
    const row=el.closest('.attr'); if(row){row.classList.add('v15-focus');setTimeout(()=>row.classList.remove('v15-focus'),1300)}
  }
  function setMode(isSimple){simple=isSimple; $('beginnerMode').classList.toggle('active',simple);$('expertMode').classList.toggle('active',!simple);document.body.classList.toggle('v15-expert',!simple);render();}
  // Un slider glissé déclenche 'input' à chaque pixel : render() (boucle sur les
  // 53 badges + tri des 5 joueurs) n'a besoin de tourner qu'une fois par frame.
  var renderQueued=false;
  function renderThrottled(){
    if(renderQueued)return;
    renderQueued=true;
    requestAnimationFrame(function(){renderQueued=false;render();});
  }
  function boot(){
    if(typeof PLAYERS_DATA==='undefined')return;
    $('beginnerMode').onclick=()=>setMode(true); $('expertMode').onclick=()=>setMode(false);
    document.querySelectorAll('#attributeGroups input').forEach(x=>x.addEventListener('input',renderThrottled));
    ['position','height','weight','wing'].forEach(id=>$(id)?.addEventListener('input',renderThrottled));
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
