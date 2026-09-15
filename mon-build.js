/* NBA 2K27 Build Lab — Page « Mon build » (/mon-build/)
   Chargé APRÈS app.js, build-sheet.js et progression.js.
   Le moteur du builder tourne caché sur cette page (#moteurBuild) : app.js y
   recharge le build en cours, ce qui fait fonctionner fiche, brise-plafonds,
   jetons et progression sans les recoder. Ce fichier gère les onglets
   (reflétés dans l'adresse : ?onglet=brise), le bandeau et les actions. */
(function(){
  'use strict';
  var page=document.querySelector('.hq-page-monbuild');
  if(!page)return;
  var $=function(id){return document.getElementById(id)};

  // Les onglets collants s'alignent sous l'en-tête, dont la hauteur varie.
  var enTete=document.querySelector('.reference-header');
  function mesurerEnTete(){
    if(enTete)document.documentElement.style.setProperty('--header-h',enTete.offsetHeight+'px');
  }
  mesurerEnTete();
  window.addEventListener('resize',mesurerEnTete);

  /* ---- Onglets ---- */
  var onglets=[].slice.call(page.querySelectorAll('.hq-onglets [role="tab"]'));
  var noms=onglets.map(function(o){return o.dataset.onglet});
  var barre=page.querySelector('.hq-onglets');
  function ouvrir(nom,focus,depuisAdresse){
    if(noms.indexOf(nom)<0)nom=noms[0];
    if(!depuisAdresse&&barre){
      var haut=page.querySelector('.hq-panneau:not([hidden])');
      var enTeteH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))||0;
      if(haut){
        var y=haut.getBoundingClientRect().top-barre.offsetHeight-enTeteH;
        if(y<0)window.scrollTo({top:window.scrollY+y,behavior:'auto'});
      }
    }
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

  /* ---- Aucun build en cours : on invite à en créer un ---- */
  var ctx=typeof lireContexte==='function'?lireContexte():null;
  if(!ctx){
    page.classList.add('sans-build');
    $('monBuildVide').hidden=false;
    return;
  }

  /* ---- Bandeau du build (valeurs du moteur caché, recalculées par app.js) ---- */
  var POSTES={PG:'Meneur de jeu',SG:'Arrière',SF:'Ailier',PF:'Ailier fort',C:'Pivot'};
  function virgule(n,d){return n.toFixed(d).replace('.',',')}
  function metres(pouces){return virgule(pouces*0.0254,2)+' m'}
  function kilos(lbs){return virgule(lbs/2.2,1)+' kg'}
  var pos=$('position').value, h=+$('height').value, w=+$('weight').value, wing=+$('wing').value;
  $('monBuildPoste').textContent=(POSTES[pos]||pos)+' · '+$('style').value;
  $('monBuildGabarit').textContent=metres(h)+' · '+kilos(w)+' · envergure '+metres(wing);
  if(typeof unlockedAnimationCount==='function')$('monBuildAnims').textContent=unlockedAnimationCount();

  var niv=window.NBABL_PLAFONDS||'approx', p=typeof CAPS_PRECISION!=='undefined'?CAPS_PRECISION:null;
  var fiab={
    exact:'Maximums des attributs exacts du jeu (corps relevé)',
    deduit:'Maximums des attributs estimés'+(p?' : justes à '+Math.round(p.exacts)+' %':' d’après des corps relevés'),
    approx:'Maximums des attributs approximatifs : écart possible de plusieurs points',
    import:'Maximums des attributs de ton build importé du jeu'
  };
  var plaf=$('monBuildPlafonds');
  plaf.textContent=fiab[niv]||fiab.approx;
  plaf.className='hq-plafonds '+niv;

  /* ---- Actions : le build part vers le builder par le lien de partage ---- */
  function lien(extra){
    return '/?build='+encodeURIComponent(window.serializeBuild())+(extra||'');
  }
  if(typeof window.serializeBuild==='function'){
    $('monBuildModifier').href=lien('&etape=attributs');
    $('monBuildImporter').href=lien('&etape=corps&import=1');
    var copier=$('monBuildCopier'), libelle=copier.textContent;
    copier.addEventListener('click',function(){
      var url=location.origin+lien();
      var fait=function(t){copier.textContent=t;setTimeout(function(){copier.textContent=libelle},2000)};
      if(navigator.clipboard)navigator.clipboard.writeText(url).then(function(){fait('Lien copié')},function(){fait('Copie impossible')});
      else fait('Copie impossible');
    });
  }
})();
