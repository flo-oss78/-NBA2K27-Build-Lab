/* NBA 2K27 Build Lab — Étape Attributs façon « Éditeur d'attributs » du jeu
   Chargé APRÈS app.js, badge-icones.js et hq-builder.js.

   Reprend la logique de l'écran du builder MyPLAYER de NBA 2K27 (vidéo de
   l'utilisateur IMG_5223, 15/09/2026) :
   - chaque attribut affiché « valeur / maximum » ;
   - l'attribut choisi : sa description officielle et les badges qu'il fait progresser ;
   - le badge choisi : ses 4 paliers, ce qu'il demande, ce que tu as, et son coût
     en jetons quand il a été relevé dans le jeu ;
   - les autres attributs demandés par ce badge ressortent en jaune.
   Rien n'est deviné : description ou coût non relevé = non affiché. */
(function(){
  'use strict';
  var root=document.getElementById('attributeGroups');
  if(!root||!root.closest('.attributes-exact-card')||typeof badgeDefs==='undefined'||!window.inputs||!window.inputs.length)return;

  /* Descriptions officielles des attributs, lues dans le jeu en français (vidéo IMG_5223).
     Les 9 autres n'y apparaissent pas : pas de texte plutôt qu'un texte inventé. */
  var DESC_ATTR={
    'Driving Layup':"Aptitude du joueur à réussir tout type de doubles-pas en allant vers le panier.",
    'Driving Dunk':"Aptitude du joueur à réussir des dunks classiques, des dunks après contact, des alley-oops et des claquettes en allant vers le panier.",
    'Mid-Range':"Aptitude du joueur à réussir ses tirs à mi-distance, y compris les tirs au poste.",
    'Pass Accuracy':"Aptitude du joueur à réussir ses passes dans toutes les situations (passe à rebond, passe poitrine, lobée, spectaculaires et passes pour alley-oop).",
    'Ball Handle':"Détermine l'aptitude du joueur à dribbler, autant au niveau des dribbles autorisés que de la capacité à éviter les interceptions.",
    'Interior Defense':"Détermine l'aptitude du joueur à défendre la raquette près ou loin du ballon et à contester les tirs près du panier.",
    'Perimeter Defense':"Détermine l'aptitude du joueur à défendre le périmètre près ou loin du ballon et à contester les tirs longue distance.",
    'Steal':"Aptitude du joueur à réussir des interceptions ou à dévier les passes ainsi qu'à subtiliser le ballon à l'adversaire dans toutes les situations.",
    'Block':"Détermine l'aptitude du joueur à bloquer les tirs adverses.",
    'Defensive Rebound':"Aptitude du joueur à prendre des rebonds défensifs. Avec la détente, permet de récupérer le ballon plus facilement après un tir manqué. Aide à protéger le rebond ou à contourner les joueurs adverses faisant de même.",
    'Agility':"Affecte la vitesse à laquelle le joueur peut accélérer, se déplacer rapidement et latéralement quand il n'a pas le ballon.",
    'Strength':"Détermine le vainqueur d'un duel au contact offensivement et défensivement ainsi que l'aptitude d'un joueur à faire reculer un adversaire ou à lui résister au poste, avec ou sans ballon."
  };

  // Lue par i18n.js sur les pages /en/ : la description anglaise vient du jeu.
  window.DESC_ATTR_FR=DESC_ATTR;

  /* Coût en jetons de chaque palier (Bronze, Argent, Or, Hall of Fame), relevé
     dans le jeu (vidéo IMG_5223). Les autres badges : coût pas encore relevé. */
  var COUT_JETONS={
    'Sync Snatcher':[1,3,4,5], 'Dimer':[1,3,4,5],
    'Boxout Boss':[2,4,5,6], 'Glove':[2,4,5,6], 'High-Flying Denier':[2,4,5,6], 'Post Lockdown':[2,4,5,6],
    'Ankle Assassin':[3,5,6,7], 'Flash':[3,5,6,7], 'Float Game':[3,5,6,7],
    'Posterizer':[3,5,6,7], 'Quick Trigger':[3,5,6,7], 'Seatbelt':[3,5,6,7]
  };
  window.NBABL_COUT_JETONS=COUT_JETONS;

  var PALIERS=['Bronze','Argent','Or','Hall of Fame'];
  var CLS={Finition:'finish',Tir:'shoot','Création':'play','Défense':'defense',Rebond:'rebound',Physique:'physical'};
  var ENT={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return ENT[c]})}
  function nomA(n){return (window.NOMS_ATTRIBUTS_FR||{})[n]||n}
  function nomB(n){return typeof nomBadge==='function'?nomBadge(n):n}
  function descB(n){return (typeof BADGE_DESC_FR!=='undefined'&&BADGE_DESC_FR[n])||''}
  function hauteur(){return typeof heightInches==='function'?heightInches():78}
  function lireS(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
  function ecrireS(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}

  var inputs=window.inputs;
  var choixAttr=lireS('nbabl_attr_choisi'), choixBadge=null, cache='';
  if(!inputs.some(function(x){return x.dataset.name===choixAttr}))choixAttr=inputs[0].dataset.name;

  // « / maximum » après chaque note, et repère de l'attribut sur sa ligne.
  inputs.forEach(function(x){
    var ligne=x.closest('.attr'); if(!ligne)return;
    ligne.dataset.attr=x.dataset.name;
    var note=ligne.querySelector('.attr-rating');
    if(note&&!ligne.querySelector('.attr-sur')){
      var sur=document.createElement('span');
      sur.className='attr-sur';
      note.insertAdjacentElement('afterend',sur);
    }
  });

  // Panneau des badges : colonne à droite sur grand écran, sous la catégorie choisie sur téléphone.
  var corps=document.createElement('div');
  corps.className='editeur-corps';
  root.parentNode.insertBefore(corps,root);
  corps.appendChild(root);
  var aside=document.createElement('aside');
  aside.id='editeurBadges';
  aside.className='editeur-badges';
  aside.setAttribute('aria-label','Badges liés à l’attribut choisi');
  corps.appendChild(aside);
  var large=window.matchMedia('(min-width:1100px)');

  function placer(){
    if(large.matches){if(aside.parentNode!==corps)corps.appendChild(aside);return}
    var ligne=root.querySelector('.attr[data-attr="'+choixAttr.replace(/"/g,'\\"')+'"]');
    var groupe=ligne&&ligne.closest('.attr-group');
    if(!groupe||groupe.nextSibling===aside)return;
    // Déplacer le panneau ne doit pas faire sauter la ligne touchée à l'écran.
    var avant=ligne.getBoundingClientRect().top;
    root.insertBefore(aside,groupe.nextSibling);
    var ecart=ligne.getBoundingClientRect().top-avant;
    if(ecart)window.scrollBy(0,ecart);
  }

  function atteint(b,r,i){
    return b.req[b.logic==='OR'?'some':'every'](function(q){return (r[q[0]]||0)>=(q[i+1]==null?999:q[i+1])});
  }

  function detail(b,r,h){
    var hors=h<b.minH||h>b.maxH, couts=COUT_JETONS[b.name], lien=b.logic==='OR'?'ou':'et';
    var s='<div class="eb-detail"><h4>'+esc(nomB(b.name))+'</h4>';
    if(descB(b.name))s+='<p class="eb-desc">'+esc(descB(b.name))+'</p>';
    if(hors){var t=badgeTier(b,r);s+='<p class="eb-alerte">'+esc(t.missing||'Pas disponible à ta taille')+'</p>'}
    s+='<ol class="eb-paliers">';
    for(var i=0;i<4;i++){
      var ok=!hors&&atteint(b,r,i);
      var lignes=b.req.filter(function(q){return typeof q[i+1]==='number'});
      s+='<li class="eb-palier eb-p'+(i+1)+(ok?' ok':'')+'"><div class="eb-palier-tete">'+
        '<span class="eb-niv">'+PALIERS[i]+'</span>'+
        (couts?'<span class="eb-cout">'+couts[i]+' jeton'+(couts[i]>1?'s':'')+'</span>':'')+
        '<span class="eb-etat" aria-label="'+(ok?'atteint':'pas atteint')+'">'+(ok?'✓':'✗')+'</span></div><ul>'+
        lignes.map(function(q,j){
          var v=r[q[0]]||0;
          return '<li class="'+(v>=q[i+1]?'ok':'ko')+'">'+(j?'<em>'+lien+'</em> ':'')+q[i+1]+' '+esc(nomA(q[0]))+' <span>(toi : '+v+')</span></li>';
        }).join('')+'</ul></li>';
    }
    s+='</ol><p class="eb-note">'+(couts?'Coût en jetons relevé dans le jeu.':'Coût en jetons pas encore relevé pour ce badge.')+'</p></div>';
    return s;
  }

  function rendre(){
    var r=typeof ratings==='function'?ratings():{}, h=hauteur();
    var input=inputs.filter(function(x){return x.dataset.name===choixAttr})[0];
    var cls=CLS[input.dataset.group]||'finish';
    var lies=badgeDefs.filter(function(d){return d.req.some(function(q){return q[0]===choixAttr})})
      .sort(function(a,b){return nomB(a.name).localeCompare(nomB(b.name),'fr')});
    if(!lies.some(function(d){return d.name===choixBadge}))choixBadge=lies.length?lies[0].name:null;
    var def=lies.filter(function(d){return d.name===choixBadge})[0];
    var demandes=def?def.req.map(function(q){return q[0]}):[];

    inputs.forEach(function(x){
      var ligne=x.closest('.attr'); if(!ligne)return;
      var sur=ligne.querySelector('.attr-sur'), t='/ '+x.max;
      if(sur&&sur.textContent!==t)sur.textContent=t;
      ligne.classList.toggle('attr-choisi',x.dataset.name===choixAttr);
      ligne.classList.toggle('attr-lie',x.dataset.name!==choixAttr&&demandes.indexOf(x.dataset.name)>=0);
    });

    var d=DESC_ATTR[choixAttr];
    var html='<div class="eb-attr"><div class="eb-attr-tete"><b>'+esc(nomA(choixAttr))+'</b><span>'+(r[choixAttr]||0)+' / '+input.max+'</span></div>'+
      (d?'<p>'+esc(d)+'</p>':'')+'</div>';

    /* Pourquoi monter cet attribut : les notes qui débloquent vraiment quelque
       chose, et ce qu'elles coûtent. Entre deux paliers, un point ne fait que
       monter une statistique — autant le savoir avant de le dépenser. */
    var suite=window.NBABL_PALIERS?window.NBABL_PALIERS.paliers(choixAttr,r,h,+input.max):[];
    html+='<div class="eb-gains"><h3 class="eb-titre">Pourquoi monter cet attribut&nbsp;?</h3>';
    if(!suite.length){
      html+='<p class="eb-vide">Aucun nouveau palier jusqu’à '+input.max+' : les points suivants ne feront que monter la note.</p>';
    }else{
      html+='<ol class="eb-paliers-suite">';
      suite.slice(0,4).forEach(function(p){
        var manque=p.note-(+r[choixAttr]||0);
        html+='<li><span class="eb-gain-note">'+p.note+'</span><span class="eb-gain-cout">+'+manque+' point'+(manque>1?'s':'')+'</span><span class="eb-gain-liste">'+
          p.gains.slice(0,3).map(function(g){return '<span class="eb-gain eb-gain-'+g.type+'">'+esc(g.texte)+'</span>'}).join('')+
          (p.gains.length>3?'<span class="eb-gain-plus">et '+(p.gains.length-3)+' de plus</span>':'')+'</span></li>';
      });
      html+='</ol>';
    }
    html+='</div>';
    if(!lies.length){
      html+='<p class="eb-vide">Aucun badge ne dépend de cet attribut.</p>';
    }else{
      html+='<h3 class="eb-titre">Badges liés <span>'+lies.length+'</span></h3><div class="eb-grille">';
      lies.forEach(function(b){
        var hors=h<b.minH||h>b.maxH, t=badgeTier(b,r);
        html+='<button type="button" class="eb-badge'+(hors?' eb-hors':'')+'" data-badge="'+esc(b.name)+'" aria-pressed="'+(b.name===choixBadge)+'">'+
          '<span class="eb-icone" aria-hidden="true">'+(typeof window.iconeBadge==='function'?window.iconeBadge(b.name,b.cat,t.level):'')+'</span>'+
          '<span class="eb-nom">'+esc(nomB(b.name))+'</span><small>'+esc(hors?'Pas à ta taille':t.level?t.tier:'Non débloqué')+'</small></button>';
      });
      html+='</div>'+detail(def,r,h);
    }
    aside.className='editeur-badges eb-'+cls;
    if(html!==cache){aside.innerHTML=html;cache=html}
    placer();
  }

  var prevu=false;
  function planifier(){
    if(prevu)return;
    prevu=true;
    requestAnimationFrame(function(){prevu=false;rendre()});
  }

  // Choisir un attribut : au clic (pas au premier contact, pour ne pas bouger la page pendant
  // qu'on fait glisser un curseur) ou au clavier.
  var contact=0;
  root.addEventListener('pointerdown',function(){contact=Date.now()},true);
  function choisir(e){
    var ligne=e.target.closest&&e.target.closest('.attr[data-attr]');
    if(!ligne||ligne.dataset.attr===choixAttr)return;
    choixAttr=ligne.dataset.attr;
    choixBadge=null;
    ecrireS('nbabl_attr_choisi',choixAttr);
    rendre();
  }
  root.addEventListener('click',choisir);
  root.addEventListener('focusin',function(e){if(Date.now()-contact>800)choisir(e)});
  aside.addEventListener('click',function(e){
    var bouton=e.target.closest('.eb-badge');
    if(!bouton||bouton.dataset.badge===choixBadge)return;
    choixBadge=bouton.dataset.badge;
    rendre();
    var neuf=aside.querySelector('.eb-badge[data-badge="'+choixBadge.replace(/"/g,'\\"')+'"]');
    if(neuf)neuf.focus({preventScroll:true});
  });

  document.addEventListener('input',planifier,true);
  document.addEventListener('change',planifier,true);
  if('MutationObserver' in window){
    new MutationObserver(planifier).observe(root,{attributes:true,subtree:true,attributeFilter:['max']});
    ['score','heightOut'].forEach(function(id){
      var el=document.getElementById(id);
      if(el)new MutationObserver(planifier).observe(el,{childList:true,characterData:true,subtree:true});
    });
  }
  if(large.addEventListener)large.addEventListener('change',placer);else if(large.addListener)large.addListener(placer);
  window.NBABL_EDITEUR_ATTRIBUTS={choisirAttribut:function(n){choixAttr=n;choixBadge=null;rendre()},choisirBadge:function(n){choixBadge=n;rendre()}};
  rendre();
})();
