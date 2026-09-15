/* NBA 2K27 Build Lab — Builder façon NBA 2K HQ
   Surcouche d'ergonomie posée sur le builder, sans toucher au moteur :
   - sélecteur de corps en roues (poste, taille, poids, envergure) ;
   - en-tête du build (hexagone, nom, gabarit en mètres et kilos, budget) ;
   - sous-onglets Attributs / Badges / Animations.
   Les champs d'origine (#position, #height, #weight, #wing) restent la seule
   source de vérité : une roue ne fait que changer leur valeur et émettre
   l'événement « input » que app.js écoute déjà. L'en-tête ne calcule rien, il
   recopie ce que app.js vient d'afficher. */
(function(){
  'use strict';

  var $=function(id){return document.getElementById(id)};

  /* L'en-tête du site change de hauteur entre mobile et ordinateur : les
     sous-onglets collants s'alignent sur sa hauteur réelle. */
  var enTete=document.querySelector('.reference-header');
  function mesurerEnTete(){
    if(enTete)document.documentElement.style.setProperty('--header-h',enTete.offsetHeight+'px');
  }
  mesurerEnTete();
  window.addEventListener('resize',mesurerEnTete);

  var builder=$('builder');
  if(!builder||!$('height'))return;

  /* ---- Unités du jeu en français ---- */
  var POSTES={PG:['MJ','Meneur de jeu'],SG:['A','Arrière'],SF:['AI','Ailier'],PF:['AF','Ailier fort'],C:['P','Pivot']};
  function virgule(n,d){return n.toFixed(d).replace('.',',')}
  function metres(pouces){return virgule(pouces*0.0254,2)+' m'}
  // Le jeu convertit les kilos en livres par kg × 2,2 arrondi : on refait le chemin inverse.
  function kilos(lbs){return virgule(lbs/2.2,1)+' kg'}
  function posteCourt(v){return (POSTES[v]||[v])[0]}
  function posteLong(v){return (POSTES[v]||[v,v])[1]}

  var ROUES=[
    {cle:'position',nom:'Poste',texte:posteCourt,parole:posteLong,px:26},
    {cle:'height',nom:'Taille',texte:metres,px:16},
    {cle:'weight',nom:'Poids',texte:kilos,px:8},
    {cle:'wing',nom:'Envergure',texte:metres,px:16}
  ];

  /* ---- Lecture et écriture des champs d'origine ---- */
  function voisin(champ,pas){
    if(champ.tagName==='SELECT'){
      var i=champ.selectedIndex+pas;
      return i>=0&&i<champ.options.length?champ.options[i].value:null;
    }
    var v=+champ.value+pas*(+champ.step||1);
    return v>=+champ.min&&v<=+champ.max?v:null;
  }

  function deplacer(champ,n){
    if(!n)return;
    var avant=champ.value;
    if(champ.tagName==='SELECT'){
      champ.selectedIndex=Math.max(0,Math.min(champ.options.length-1,champ.selectedIndex+n));
    }else{
      champ.value=Math.max(+champ.min,Math.min(+champ.max,+champ.value+n*(+champ.step||1)));
    }
    if(champ.value===avant)return;
    champ.dispatchEvent(new Event('input',{bubbles:true}));
    champ.dispatchEvent(new Event('change',{bubbles:true}));
    rafraichir();
  }

  function aller(champ,bout){
    if(champ.tagName==='SELECT')deplacer(champ,bout<0?-champ.selectedIndex:champ.options.length-1-champ.selectedIndex);
    else deplacer(champ,Math.round(((bout<0?+champ.min:+champ.max)-champ.value)/(+champ.step||1)));
  }

  /* ---- Noms des attributs tels qu'affichés par le jeu en français ----
     La table vient de builder-data.js (NOMS_ATTRIBUTS_FR). Le nom anglais reste
     la clé du moteur (data-name) et s'affiche en mode Expert. */
  var NOMS_FR=window.NOMS_ATTRIBUTS_FR||{};
  builder.querySelectorAll('#attributeGroups .attr').forEach(function(ligne){
    var curseur=ligne.querySelector('input[type=range]'),bloc=ligne.querySelector('.attr-name');
    var nom=bloc&&bloc.querySelector('span');
    if(!curseur||!nom)return;
    var en=curseur.dataset.name,fr=NOMS_FR[en];
    if(!fr)return;
    nom.textContent=fr;
    var sous=document.createElement('span'),anglais=document.createElement('em');
    sous.className='attr-sous';
    anglais.className='attr-en';
    anglais.textContent=en;
    sous.appendChild(anglais);
    var cap=bloc.querySelector('small');
    if(cap)sous.appendChild(cap);
    bloc.appendChild(sous);
    curseur.setAttribute('aria-label',fr);
    ligne.querySelectorAll('.attr-step').forEach(function(b){
      b.setAttribute('aria-label',(b.classList.contains('plus')?'Augmenter ':'Diminuer ')+fr);
    });
  });

  /* ---- Roues ---- */
  var zone=$('hqRoues');
  if(zone){
    zone.innerHTML=ROUES.map(function(r){
      return '<div class="roue" data-roue="'+r.cle+'">'+
        '<span class="roue-nom" id="roue-'+r.cle+'">'+r.nom+'</span>'+
        '<div class="cadran" role="spinbutton" tabindex="0" aria-labelledby="roue-'+r.cle+'">'+
          '<button type="button" class="roue-voisin" data-pas="-1" tabindex="-1" aria-hidden="true"></button>'+
          '<strong></strong>'+
          '<button type="button" class="roue-voisin" data-pas="1" tabindex="-1" aria-hidden="true"></button>'+
        '</div></div>';
    }).join('');

    // Les curseurs d'origine sont masqués à l'écran : on les sort aussi de la
    // tabulation pour ne pas faire passer deux fois par le même réglage.
    ROUES.forEach(function(r){var c=$(r.cle);if(c)c.tabIndex=-1});

    ROUES.forEach(function(r){
      var roue=zone.querySelector('[data-roue="'+r.cle+'"]');
      var cadran=roue.querySelector('.cadran');
      var champ=$(r.cle);
      if(!champ)return;

      cadran.addEventListener('keydown',function(e){
        var n={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:5,PageDown:-5}[e.key];
        if(n){e.preventDefault();deplacer(champ,n);return}
        if(e.key==='Home'||e.key==='End'){e.preventDefault();aller(champ,e.key==='Home'?-1:1)}
      });

      // Glisser vers le haut fait défiler vers les valeurs plus grandes, comme
      // une liste qu'on pousse ; un simple appui sur une valeur voisine la choisit.
      cadran.addEventListener('pointerdown',function(e){
        if(e.button!==0)return;
        var y0=e.clientY,faits=0,glisse=false;
        var cible=e.target.closest('.roue-voisin');
        cadran.classList.add('actif');
        try{cadran.setPointerCapture(e.pointerId)}catch(err){}
        function bouge(ev){
          var dy=y0-ev.clientY;
          if(Math.abs(dy)>5)glisse=true;
          if(!glisse)return;
          var n=Math.trunc(dy/r.px);
          if(n!==faits){deplacer(champ,n-faits);faits=n}
        }
        function fin(){
          cadran.removeEventListener('pointermove',bouge);
          cadran.removeEventListener('pointerup',fin);
          cadran.removeEventListener('pointercancel',fin);
          cadran.classList.remove('actif');
          if(!glisse&&cible&&!cible.disabled)deplacer(champ,+cible.dataset.pas);
        }
        cadran.addEventListener('pointermove',bouge);
        cadran.addEventListener('pointerup',fin);
        cadran.addEventListener('pointercancel',fin);
      });

      var cumul=0;
      cadran.addEventListener('wheel',function(e){
        e.preventDefault();
        cumul+=e.deltaY;
        if(Math.abs(cumul)<40)return;
        deplacer(champ,cumul>0?1:-1);
        cumul=0;
      },{passive:false});
    });
  }

  function texte(id){var el=$(id);return el?el.textContent.trim():''}
  function ecrire(id,valeur){var el=$(id);if(el&&el.textContent!==valeur)el.textContent=valeur}

  function rafraichir(){
    if(zone)ROUES.forEach(function(r){
      var champ=$(r.cle),roue=zone.querySelector('[data-roue="'+r.cle+'"]');
      if(!champ||!roue)return;
      var cadran=roue.querySelector('.cadran'),voisins=roue.querySelectorAll('.roue-voisin');
      roue.querySelector('strong').textContent=r.texte(champ.value);
      [-1,1].forEach(function(pas,i){
        var v=voisin(champ,pas);
        voisins[i].textContent=v===null?'':r.texte(v);
        voisins[i].disabled=v===null;
      });
      if(champ.tagName==='SELECT'){
        cadran.setAttribute('aria-valuemin',0);
        cadran.setAttribute('aria-valuemax',champ.options.length-1);
        cadran.setAttribute('aria-valuenow',champ.selectedIndex);
      }else{
        cadran.setAttribute('aria-valuemin',champ.min);
        cadran.setAttribute('aria-valuemax',champ.max);
        cadran.setAttribute('aria-valuenow',champ.value);
      }
      cadran.setAttribute('aria-valuetext',(r.parole||r.texte)(champ.value));
    });

    // En-tête du build
    var pos=$('position'),h=$('height'),w=$('weight'),wing=$('wing');
    ecrire('hqNote',texte('score')||'—');
    ecrire('hqNom',texte('buildname')||'Mon build');
    ecrire('hqPoste',pos?posteLong(pos.value):'');
    ecrire('hqStyle',texte('selectedStyleName'));
    if(h&&w&&wing)ecrire('hqGabarit',metres(+h.value)+' · '+kilos(+w.value)+' · envergure '+metres(+wing.value));

    // Fiabilité des plafonds (calculée par bodyCaps() dans app.js).
    var fiab=$('hqPlafonds');
    if(fiab){
      var niv=window.NBABL_PLAFONDS||'approx', p=typeof CAPS_PRECISION!=='undefined'?CAPS_PRECISION:null;
      var textes={
        exact:'Maximums des attributs exacts du jeu (corps relevé)',
        deduit:'Maximums des attributs estimés'+(p?' : justes à '+Math.round(p.exacts)+' %, sinon '+(p.pire>1?'1 à '+p.pire+' points':'1 point')+' d’écart':' d’après des corps relevés'),
        approx:'Maximums des attributs approximatifs : aucun corps assez proche relevé, écart possible de plusieurs points',
        import:'Maximums des attributs de ton build importé du jeu'
      };
      ecrire('hqPlafonds',textes[niv]||textes.approx);
      if(fiab.dataset.niveau!==niv){fiab.dataset.niveau=niv;fiab.className='hq-plafonds '+niv}
    }

    var budget=$('budgetEstime'),mini=$('hqBudget');
    if(budget&&mini){
      mini.hidden=budget.hidden;
      if(!budget.hidden){
        ecrire('hqBudgetValeur',texte('budgetEstimeValeur'));
        ecrire('hqBudgetMarge',texte('budgetEstimeMarge'));
        mini.classList.toggle('dessus',budget.classList.contains('dessus'));
        [['budgetEstimeBarre','hqBudgetBarre'],['budgetEstimeZone','hqBudgetZone']].forEach(function(p){
          var a=$(p[0]),b=$(p[1]);
          if(a&&b&&b.style.cssText!==a.style.cssText)b.style.cssText=a.style.cssText;
        });
      }
    }
  }

  /* app.js remet à jour le résumé à chaque recalcul (curseur, import, build
     chargé depuis un lien…) : on se cale sur ces éléments plutôt que sur une
     liste d'événements qu'il faudrait tenir à jour. */
  var prevu=false;
  function planifier(){
    if(prevu)return;
    prevu=true;
    requestAnimationFrame(function(){prevu=false;rafraichir()});
  }
  if('MutationObserver' in window){
    var obs=new MutationObserver(planifier);
    ['buildMeta','score','buildname','selectedStyleName','budgetEstime','heightOut','weightOut','wingOut'].forEach(function(id){
      var el=$(id);
      if(el)obs.observe(el,{childList:true,characterData:true,subtree:true,attributes:true});
    });
  }
  document.addEventListener('input',planifier,true);
  document.addEventListener('change',planifier,true);
  rafraichir();

  /* ---- Boutons relais (en-tête, barre du corps) ---- */
  builder.addEventListener('click',function(e){
    var relais=e.target.closest('[data-hq-clic]');
    if(!relais)return;
    var cible=$(relais.dataset.hqClic);
    if(cible)cible.click();
  });

  // « Voir tous les badges » visait une section qui vit désormais sur /reference/.
  var tousBadges=$('viewAllStyleBadges');
  if(tousBadges&&!$('badges'))tousBadges.addEventListener('click',function(){location.href='/reference/'});

  /* ---- Fil conducteur : Corps → Attributs → Badges → Animations → Récap ----
     Une étape à la fois, avec Retour / Suivant. La barre du corps (roues) vit
     dans la carte Corps à l'étape 1 et passe au-dessus des curseurs à l'étape 2 :
     c'est là que les plafonds comptent. Aux autres étapes, elle disparaît. */
  var onglets=[].slice.call(builder.querySelectorAll('.hq-onglets [role="tab"]'));
  var centre=builder.querySelector('.builder-centre');
  var barre=builder.querySelector('.hq-barre-corps');
  var placeCorps=$('barreCorpsCorps'),placeAttributs=$('barreCorpsAttributs');
  var suivant=$('etapeSuivante'),precedent=$('etapePrecedente');
  var courant=0;
  function libelle(i){return onglets[i].dataset.libelle||onglets[i].textContent.trim()}
  function ouvrir(nom,focus){
    // Changer d'étape tout en bas d'une longue liste laissait le lecteur au
    // milieu de nulle part : on remonte au début de l'étape, sous l'en-tête.
    if(centre){
      var haut=centre.getBoundingClientRect().top;
      var enTeteH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))||0;
      if(haut<enTeteH)window.scrollTo({top:window.scrollY+haut-enTeteH,behavior:'auto'});
    }
    var i=0;
    onglets.forEach(function(o,j){if(o.dataset.onglet===nom)i=j});
    courant=i;
    onglets.forEach(function(o,j){
      var actif=j===i;
      o.setAttribute('aria-selected',String(actif));
      o.tabIndex=actif?0:-1;
      o.classList.toggle('fait',j<i);
      var panneau=$(o.getAttribute('aria-controls'));
      if(panneau)panneau.hidden=!actif;
      if(actif&&focus)o.focus();
      document.body.classList.toggle('etape-'+o.dataset.onglet,actif);
    });
    if(barre&&placeCorps&&placeAttributs){
      var place=onglets[i].dataset.onglet==='attributs'?placeAttributs:placeCorps;
      if(barre.parentNode!==place)place.appendChild(barre);
    }
    // Sur téléphone, les étapes défilent : l'étape active reste visible.
    var liste=onglets[i].parentNode;
    if(liste&&liste.scrollWidth>liste.clientWidth)liste.scrollLeft=Math.max(0,onglets[i].offsetLeft-16);
    if(precedent){
      precedent.hidden=i===0;
      if(i>0)precedent.querySelector('span').textContent=libelle(i-1);
    }
    if(suivant)suivant.innerHTML=i<onglets.length-1?'Suivant : <span>'+libelle(i+1)+'</span> →':'Enregistrer le build';
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
  if(suivant)suivant.addEventListener('click',function(){
    if(courant<onglets.length-1)ouvrir(onglets[courant+1].dataset.onglet,false);
    else{var s=$('save');if(s)s.click()}
  });
  if(precedent)precedent.addEventListener('click',function(){if(courant>0)ouvrir(onglets[courant-1].dataset.onglet,false)});
  // ?etape=attributs (lien « Modifier » de la page Mon build) ouvre cette étape.
  // Sinon, un build ouvert depuis un lien de partage est déjà fait : on montre son récapitulatif.
  var etapeDemandee=null;
  try{etapeDemandee=new URLSearchParams(location.search).get('etape')}catch(e){}
  var etapeConnue=onglets.some(function(o){return o.dataset.onglet===etapeDemandee});
  if(onglets.length)ouvrir(etapeConnue?etapeDemandee:(/[?&]build=/.test(location.search)?'recap':onglets[0].dataset.onglet),false);

  document.body.classList.add('avec-roues');
})();
