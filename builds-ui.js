/* NBA 2K27 Build Lab — Budget estimé et builds réels proches (builder)
   Chargé APRÈS app.js et builds-reels.js.

   Le budget n'est pas une règle du jeu recopiée : il est estimé sur des builds
   réels complets à 99, et sa marge d'erreur mesurée est toujours affichée. */
(function(){
  if(!BUILDER_PRESENT||typeof BUILDS_REELS==='undefined')return;
  const $=id=>document.getElementById(id);
  // Pour chaque build réel, l'animation accessible la plus exigeante de ces emplacements.
  const EMPLACEMENTS=['Dribble Style','Signature Size-Up','Jumper Base','Go-To Shot','Dribble Pull-Up','Layup Style','Pass Style'];
  const exigence=a=>Math.max(0,...Object.values(a.req||{}));
  let proches=[];

  function animationsPhares(notes,h){
    if(typeof ANIMATIONS==='undefined')return [];
    return EMPLACEMENTS.map(c=>ANIMATIONS.filter(a=>a.category===c&&animationAccessible(a,notes,h))
      .sort((x,y)=>exigence(y)-exigence(x)||x.name.localeCompare(y.name))[0]).filter(Boolean);
  }

  function renduBudget(){
    const carte=$('budgetEstime'); if(!carte)return;
    const pos=$('position').value, h=+$('height').value, e=budgetEstime(pos,h,+$('weight').value,+$('wing').value,ratings());
    if(!e){carte.hidden=true;return}
    carte.hidden=false;
    const pct=Math.round(e.part*100), marge=Math.round(e.marge*100);
    const zone=pct>100+marge?'dessus':pct<100-marge?'dessous':'dans';
    carte.className='panel exact-card budget-estime '+zone;
    $('budgetEstimeValeur').textContent=pct+' %';
    $('budgetEstimeMarge').textContent='± '+marge+' %';
    $('budgetEstimeBarre').style.width=Math.min(100,pct/1.3)+'%';
    $('budgetEstimeZone').style.left=((100-marge)/1.3)+'%';
    $('budgetEstimeZone').style.width=(2*marge/1.3)+'%';
    const groupe=e.groupe.includes(' ')?`des ${e.n} builds réels ${pos} de ${heightText(h)}`:`des ${e.n} builds réels ${pos}`;
    $('budgetEstimeTexte').textContent=
      zone==='dessous'?`Ton build dépense environ ${pct} % du budget ${groupe} à 99. Tu peux sans doute encore monter des attributs.`
     :zone==='dans'?`Dans la zone d’un build complet à 99 (${groupe}) : pour monter un attribut, il faudra probablement en baisser un autre.`
     :`Au-delà de ce que dépensent les builds réels à 99 (${groupe}) : le jeu refuserait probablement ce build. Baisse des attributs.`;
  }

  function renduProches(){
    const liste=$('buildsProches'); if(!liste)return;
    const pos=$('position').value, h=+$('height').value;
    proches=buildsProches(pos,h,ratings(),5);
    if(!proches.length){liste.innerHTML='<div class="empty">Aucun build réel pour ce poste à cette taille.</div>';return}
    liste.innerHTML=proches.map(({b,d},i)=>{
      const [source,p,hh,w,wing,nom,v]=b;
      const notes=Object.fromEntries(BUILDS_ATTRIBUTS.map((a,j)=>[a,v[j]]));
      const top=BUILDS_ATTRIBUTS.map((a,j)=>[a,v[j]]).sort((x,y)=>y[1]-x[1]).slice(0,5);
      const anims=animationsPhares(notes,hh);
      return `<article class="build-reel">`+
        `<div class="build-reel-tete"><b>${escapeHTML(nom)}</b><span class="build-reel-source ${source}">${source==='bp'?'Modèle officiel 2K':'Build réel à 99'}</span></div>`+
        `<small>${p} • ${heightText(hh)} • ${w} lbs • ${heightText(wing)} envergure • écart moyen ${d.toFixed(1)} pts</small>`+
        `<div class="build-reel-notes">${top.map(([a,n])=>`<span>${escapeHTML(a)} <b>${n}</b></span>`).join('')}</div>`+
        (anims.length?`<details><summary>Animations les plus exigeantes accessibles</summary><div class="build-reel-anims">${anims.map(a=>`<span>${escapeHTML(nomCategorieAnimation(a.category))} : <b>${escapeHTML(a.name)}</b></span>`).join('')}</div></details>`:'')+
        `<button type="button" class="secondary" data-charger-build="${i}">Charger ce build</button></article>`;
    }).join('');
  }

  // Le budget suit le curseur en direct ; la recherche des builds proches (plus
  // de 3 600 builds, puis leurs animations) attend que le curseur s'arrête.
  let minuterie=null;
  function rendu(){
    renduBudget();
    clearTimeout(minuterie);
    minuterie=setTimeout(renduProches,120);
  }

  $('buildsProches')?.addEventListener('click',e=>{
    const i=e.target.closest('[data-charger-build]')?.dataset.chargerBuild; if(i==null||!proches[+i])return;
    const [,p,h,w,wing,,v]=proches[+i].b;
    apply({position:p,height:h,weight:w,wing,style:$('style').value,hand:handValue(),
           attrs:{...ratings(),...Object.fromEntries(BUILDS_ATTRIBUTS.map((a,j)=>[a,v[j]]))}});
    $('budgetEstime')?.scrollIntoView({block:'nearest'});
  });

  const source=$('buildsSource');
  if(source){
    const s=BUILDS_SOURCE;
    source.innerHTML=`${s.builds.toLocaleString('fr-FR')} builds complets à 99 (<a href="${escapeHTML(s.sources[0].url)}" target="_blank" rel="noopener">LockerCodes</a>) et ${s.blueprints} modèles officiels 2K (<a href="${escapeHTML(s.sources[1].url)}" target="_blank" rel="noopener">NBA2KLab</a>). ${escapeHTML(s.avertissement)}`;
  }

  const updateSansBuilds=update;
  update=function(){updateSansBuilds();rendu()};
  // app.js a branché ses curseurs sur la fonction update() d'origine.
  [...inputs,...['position','height','weight','wing'].map($)].forEach(x=>x?.addEventListener('input',rendu));
  renduBudget(); renduProches();
})();
