/* NBA 2K27 Build Lab — Page Builds façon NBA 2K HQ
   Chargé APRÈS app.js et builds-reels.js, sur /hub/ uniquement.

   - Trois onglets : Builds réels, Trios, Communauté. L'onglet ouvert est
     reflété dans l'adresse (?onglet=trios) : les anciennes adresses /trios/
     et /blueprints/ redirigent vers cet onglet.
   - Explorateur des builds réels : les builds complets à 99 et les Signature
     Blueprints officiels de builds-reels.js, filtrables, ouverts dans le
     builder par le même format que les liens de partage (?build=). */
(function(){
  'use strict';

  var page=document.querySelector('.hq-page-builds');
  if(!page)return;
  var $=function(id){return document.getElementById(id)};
  var esc=window.escHtml;

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
    // Changer d'onglet tout en bas d'une liste : on remonte au début des panneaux.
    if(!depuisAdresse&&barre){
      var haut=barre.parentNode.querySelector('.hq-panneau:not([hidden])');
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

  /* ---- Explorateur des builds réels ---- */
  if(typeof BUILDS_REELS==='undefined'||!$('reelsListe'))return;

  var POSTES={PG:'Meneur de jeu',SG:'Arrière',SF:'Ailier',PF:'Ailier fort',C:'Pivot'};
  function virgule(n,d){return n.toFixed(d).replace('.',',')}
  function metres(pouces){return virgule(pouces*0.0254,2)+' m'}
  // Le jeu convertit les kilos en livres par kg × 2,2 arrondi : on refait le chemin inverse.
  function kilos(lbs){return virgule(lbs/2.2,1)+' kg'}
  var nomAttr=window.nomAttribut||String;

  var PAR_PAGE=24, limite=PAR_PAGE;
  var f={poste:'all',taille:'all',origine:'all',texte:''};

  // Modèles officiels d'abord, puis ordre alphabétique : calculé une seule fois.
  var ordre=BUILDS_REELS.map(function(b,i){return i}).sort(function(x,y){
    var a=BUILDS_REELS[x],b=BUILDS_REELS[y];
    return (a[0]==='bp'?0:1)-(b[0]==='bp'?0:1)||a[5].localeCompare(b[5],'fr');
  });

  function remplirTailles(){
    var select=$('reelsTaille'),garde=select.value;
    var tailles={};
    BUILDS_REELS.forEach(function(b){if(f.poste==='all'||b[1]===f.poste)tailles[b[2]]=(tailles[b[2]]||0)+1});
    var liste=Object.keys(tailles).map(Number).sort(function(a,b){return a-b});
    select.innerHTML='<option value="all">Toutes les tailles</option>'+liste.map(function(t){
      return '<option value="'+t+'">'+metres(t)+' ('+tailles[t]+')</option>';
    }).join('');
    select.value=tailles[garde]?garde:'all';
    f.taille=select.value;
  }

  function visibles(){
    return ordre.filter(function(i){
      var b=BUILDS_REELS[i];
      if(f.poste!=='all'&&b[1]!==f.poste)return false;
      if(f.taille!=='all'&&b[2]!==+f.taille)return false;
      if(f.origine!=='all'&&b[0]!==f.origine)return false;
      if(f.texte&&b[5].toLowerCase().indexOf(f.texte)<0)return false;
      return true;
    });
  }

  function carte(i){
    var b=BUILDS_REELS[i],notes=b[6];
    var paires=BUILDS_ATTRIBUTS.map(function(a,j){return [a,notes[j]]});
    var top=paires.slice().sort(function(x,y){return y[1]-x[1]}).slice(0,5);
    var etiquette=function(p){return '<span>'+esc(nomAttr(p[0]))+' <b>'+p[1]+'</b></span>'};
    return '<article class="build-reel">'+
      '<div class="build-reel-tete"><b>'+esc(b[5])+'</b>'+
        '<span class="build-reel-source '+b[0]+'">'+(b[0]==='bp'?'Modèle officiel 2K':'Build réel à 99')+'</span></div>'+
      '<small>'+esc(POSTES[b[1]]||b[1])+' · '+metres(b[2])+' · '+kilos(b[3])+' · envergure '+metres(b[4])+'</small>'+
      '<div class="build-reel-notes">'+top.map(etiquette).join('')+'</div>'+
      '<details><summary>Toutes les notes</summary><div class="build-reel-toutes">'+paires.map(etiquette).join('')+'</div></details>'+
      '<button type="button" class="build-reel-ouvrir" data-ouvrir-reel="'+i+'">Ouvrir dans le builder</button>'+
    '</article>';
  }

  function rendu(){
    var liste=visibles();
    $('reelsCompte').textContent=liste.length.toLocaleString('fr-FR')+' build'+(liste.length>1?'s':'');
    if(!liste.length){
      $('reelsListe').innerHTML='<div class="empty">Aucun build avec ces filtres. Élargis la recherche.</div>';
      $('reelsPlus').hidden=true;
      return;
    }
    $('reelsListe').innerHTML=liste.slice(0,limite).map(carte).join('');
    $('reelsPlus').hidden=liste.length<=limite;
    $('reelsPlus').textContent='Afficher plus ('+Math.min(PAR_PAGE,liste.length-limite)+' sur '+(liste.length-limite).toLocaleString('fr-FR')+' restants)';
  }

  function refiltrer(){limite=PAR_PAGE;rendu()}
  $('reelsPoste').addEventListener('change',function(){f.poste=this.value;remplirTailles();refiltrer()});
  $('reelsTaille').addEventListener('change',function(){f.taille=this.value;refiltrer()});
  $('reelsOrigine').addEventListener('change',function(){f.origine=this.value;refiltrer()});
  var minuterie=null;
  $('reelsRecherche').addEventListener('input',function(){
    var champ=this;
    clearTimeout(minuterie);
    minuterie=setTimeout(function(){f.texte=champ.value.toLowerCase().trim();refiltrer()},150);
  });
  $('reelsPlus').addEventListener('click',function(){limite+=PAR_PAGE;rendu()});

  // Même format que les liens de partage : app.js l'applique à l'arrivée sur le builder.
  $('reelsListe').addEventListener('click',function(e){
    var bouton=e.target.closest('[data-ouvrir-reel]');
    if(!bouton)return;
    var b=BUILDS_REELS[+bouton.dataset.ouvrirReel];
    if(!b)return;
    var attrs={};
    BUILDS_ATTRIBUTS.forEach(function(a,j){attrs[a]=String(b[6][j])});
    var build={position:b[1],height:String(b[2]),weight:String(b[3]),wing:String(b[4]),style:'Équilibré',hand:'Droite',attrs:attrs};
    location.href='/?build='+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(build)))));
  });

  var s=window.BUILDS_SOURCE||(typeof BUILDS_SOURCE!=='undefined'?BUILDS_SOURCE:null);
  if(s&&$('reelsSource')){
    $('reelsSource').innerHTML=s.builds.toLocaleString('fr-FR')+' builds complets à 99 relevés par <a href="'+esc(s.sources[0].url)+'" target="_blank" rel="noopener">LockerCodes</a> et '+
      s.blueprints+' Signature Blueprints officiels de 2K (<a href="'+esc(s.sources[1].url)+'" target="_blank" rel="noopener">NBA2KLab</a>). Ouvre-en un dans le builder pour voir ses badges et ses animations.';
  }

  remplirTailles();
  rendu();
})();
