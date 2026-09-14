/* NBA 2K27 Build Lab — Page Badges façon NBA 2K HQ (/reference/)
   Chargé APRÈS app.js. Onglets Badges / Takeovers / Animations (reflétés dans
   l'adresse : ?onglet=animations) et bandeau du build utilisé pour les paliers. */
(function(){
  'use strict';
  var page=document.querySelector('.hq-page-badges');
  if(!page)return;
  var $=function(id){return document.getElementById(id)};
  var esc=window.escHtml;

  var enTete=document.querySelector('.reference-header');
  function mesurerEnTete(){if(enTete)document.documentElement.style.setProperty('--header-h',enTete.offsetHeight+'px')}
  mesurerEnTete();
  window.addEventListener('resize',mesurerEnTete);

  /* ---- Bandeau : sur quel build les paliers sont calculés ---- */
  var POSTES={PG:'Meneur de jeu',SG:'Arrière',SF:'Ailier',PF:'Ailier fort',C:'Pivot'};
  function virgule(n,d){return n.toFixed(d).replace('.',',')}
  var ctx=typeof lireContexte==='function'?lireContexte():null;
  var bandeau=$('badgesContexte');
  if(bandeau){
    if(ctx){
      var acces=typeof unlockedBadgeCount==='function'?unlockedBadgeCount(ratings()):ctx.badges;
      bandeau.innerHTML='<div><span class="badges-contexte-label">Paliers calculés pour ton build</span>'+
        '<b>'+esc(ctx.name||'Mon build')+'</b>'+
        '<small>'+esc(POSTES[ctx.position]||ctx.position||'')+' · '+virgule(ctx.height*0.0254,2)+' m · '+virgule(ctx.weight/2.2,1)+' kg · envergure '+virgule(ctx.wing*0.0254,2)+' m</small></div>'+
        '<div class="badges-contexte-score"><b>'+acces+'</b><small>badges sur '+(window.badgeDefs||[]).length+'</small></div>'+
        '<a class="hq-pilule" href="/">Modifier le build</a>';
    }else{
      bandeau.classList.add('sans-build');
      bandeau.innerHTML='<div><span class="badges-contexte-label">Aucun build ouvert</span>'+
        '<small>Les paliers affichés sont ceux du build d’exemple. Crée ton build pour voir ce que tu débloques.</small></div>'+
        '<a class="hq-pilule" href="/">Créer mon build</a>';
    }
  }

  /* ---- Onglets ---- */
  var onglets=[].slice.call(page.querySelectorAll('.hq-onglets [role="tab"]'));
  var noms=onglets.map(function(o){return o.dataset.onglet});
  function ouvrir(nom,focus,depuisAdresse){
    if(noms.indexOf(nom)<0)nom=noms[0];
    onglets.forEach(function(o){
      var actif=o.dataset.onglet===nom;
      o.setAttribute('aria-selected',String(actif));
      o.tabIndex=actif?0:-1;
      var panneau=$(o.getAttribute('aria-controls'));
      if(panneau)panneau.hidden=!actif;
      if(actif&&focus)o.focus();
    });
    if(!depuisAdresse){
      try{
        var u=new URL(location.href);
        if(nom===noms[0])u.searchParams.delete('onglet');else u.searchParams.set('onglet',nom);
        history.replaceState(history.state,'',u.pathname+u.search+u.hash);
      }catch(e){}
    }
  }
  onglets.forEach(function(o,i){
    o.addEventListener('click',function(){ouvrir(o.dataset.onglet,false)});
    o.addEventListener('keydown',function(e){
      var j={ArrowRight:i+1,ArrowLeft:i-1,Home:0,End:onglets.length-1}[e.key];
      if(j===undefined)return;
      e.preventDefault();
      ouvrir(onglets[(j+onglets.length)%onglets.length].dataset.onglet,true);
    });
  });
  var demande=null;
  try{demande=new URLSearchParams(location.search).get('onglet')}catch(e){}
  ouvrir(demande||noms[0],false,true);
})();
