/* NBA 2K27 Build Lab — Importer un build du jeu
   Chargé APRÈS app.js, dont il utilise apply(), setBreaker(), bodyCaps(),
   ratings(), update() et la clé IMPORT_JEU_KEY.

   Les plafonds du site sont une estimation. Quand le joueur recopie son écran
   « Améliorations d'attribut », on connaît les vrais : pour chaque attribut,
   le Max du jeu et la valeur actuelle. Une valeur au-dessus du Max vient des
   brise-plafonds (5 au plus par attribut : règle officielle 2K).
   bodyCaps() applique ces plafonds tant que le gabarit importé n'a pas changé. */
(function(){
  if(!BUILDER_PRESENT)return;

  // Ordre et libellés de l'écran « Améliorations d'attribut » du jeu en français.
  // Ce sont les 21 attributs du builder : l'endurance n'existe pas dans NBA 2K27.
  const ATTRS_JEU=[
    ['Close Shot','Tirs de près'],['Driving Layup','Double-pas en pénétration'],['Driving Dunk','Dunk en pénétration'],
    ['Standing Dunk','Dunk sans élan'],['Post Control','Contrôle au poste'],
    ['Mid-Range','Tirs à mi-distance'],['Three-Point','Tirs à 3 pts'],['Free Throw','Lancer franc'],
    ['Pass Accuracy','Précision des passes'],['Ball Handle','Contrôle du ballon'],['Speed With Ball','Vitesse avec le ballon'],
    ['Interior Defense','Défense intérieure'],['Perimeter Defense','Défense extérieure'],['Steal','Interception'],['Block','Contre'],
    ['Offensive Rebound','Rebond offensif'],['Defensive Rebound','Rebond défensif'],
    ['Speed','Vitesse'],['Agility','Agilité'],['Strength','Force'],['Vertical','Détente']
  ];
  const POSTES=[['PG','Meneur'],['SG','Arrière'],['SF','Ailier'],['PF','Ailier fort'],['C','Pivot']];
  const BRISE_PLAFONDS_MAX=5;

  const $=id=>document.getElementById(id);
  const cle=n=>n.replace(/[^a-z0-9]/gi,'');
  const note=document.querySelector('.summary-note');
  const NOTE_DEFAUT=note?note.textContent:'';

  function lire(){try{return JSON.parse(localStorage.getItem(IMPORT_JEU_KEY)||'null')}catch(e){return null}}

  function ouvrirModale(html){const m=$('buildModal');$('buildModalContent').innerHTML=html;m.classList.add('open');m.setAttribute('aria-hidden','false')}
  function fermerModale(){const m=$('buildModal');m.classList.remove('open');m.setAttribute('aria-hidden','true')}

  function formulaire(){
    const imp=lire(), r=ratings();
    // Préremplissage : l'import précédent, sinon le build affiché.
    const corps=imp?imp.saisie:{position:$('position').value,taille:cmOf(heightInches()),poids:kgOf(+$('weight').value),envergure:cmOf(+$('wing').value),gnr:''};
    const valeur=(k,type)=>imp?imp[type][k]:r[k];
    const nombre=(nom,v,min,max)=>`<input name="${nom}" type="number" inputmode="numeric" min="${min}" max="${max}" value="${v??''}">`;
    return `<div class="modal-kicker">IMPORT DEPUIS NBA 2K27</div>
      <h2>Importer mon build du jeu</h2>
      <p class="sub">Recopie l’écran <b>Améliorations d’attribut</b> de ton MyPLAYER : pour chaque attribut, le <b>Max</b> (en haut de la barre) et la valeur <b>actuelle</b> (en bas). Les plafonds de ton jeu remplaceront l’estimation du site.</p>
      <form id="importJeuForm" class="ij-form" novalidate>
        <div id="importJeuErreurs" class="ij-erreurs" role="alert" hidden></div>
        <div class="ij-corps">
          <label>Poste<select name="position">${POSTES.map(([v,l])=>`<option value="${v}"${v===corps.position?' selected':''}>${l} (${v})</option>`).join('')}</select></label>
          <label>GNR <small>facultatif</small>${nombre('gnr',corps.gnr,25,99)}</label>
          <label>Taille <small>en cm : 1,91 m → 191</small>${nombre('taille',corps.taille,175,224)}</label>
          <label>Poids <small>en kg</small>${nombre('poids',corps.poids,72,136)}</label>
          <label>Envergure <small>en cm</small>${nombre('envergure',corps.envergure,175,244)}</label>
        </div>
        <div class="ij-table">
          <div class="ij-tete"><span>Attribut</span><span>Max</span><span>Actuel</span></div>
          ${ATTRS_JEU.map(([k,fr])=>`<div class="ij-ligne"><span>${fr}<small>${k}</small></span>
            <input name="max-${cle(k)}" type="number" inputmode="numeric" min="25" max="99" value="${valeur(k,'max')}" aria-label="${fr} : Max">
            <input name="act-${cle(k)}" type="number" inputmode="numeric" min="25" max="99" value="${valeur(k,'actuel')}" aria-label="${fr} : actuel"></div>`).join('')}
        </div>
        <p class="ij-aide">Une valeur actuelle au-dessus du Max vient des brise-plafonds : ${BRISE_PLAFONDS_MAX} au plus par attribut.</p>
        <div class="modal-actions"><button type="submit">Importer ce build</button><button type="button" class="secondary" data-ij-fermer>Annuler</button></div>
      </form>`;
  }

  function lireFormulaire(f){
    const brut=nom=>f.elements[nom].value.trim();
    const nombre=nom=>brut(nom)===''?NaN:Number(brut(nom));
    const entier=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
    const erreurs=[];
    const saisie={position:f.elements.position.value,taille:nombre('taille'),poids:nombre('poids'),envergure:nombre('envergure'),gnr:brut('gnr')===''?null:nombre('gnr')};

    // Le site travaille en pouces et en livres, comme les curseurs.
    const h=Math.round(saisie.taille/2.54), w=Math.round(saisie.poids/0.45359237), wg=Math.round(saisie.envergure/2.54);
    const borne=(id,v,libelle,conv,unite)=>{const el=$(id);if(!(v>=+el.min&&v<=+el.max))erreurs.push(`${libelle} : entre ${conv(+el.min)} et ${conv(+el.max)} ${unite}.`)};
    borne('height',h,'Taille',cmOf,'cm');
    borne('weight',w,'Poids',kgOf,'kg');
    borne('wing',wg,'Envergure',cmOf,'cm');
    if(saisie.gnr!==null&&!entier(saisie.gnr,25,99))erreurs.push('GNR : un nombre entier entre 25 et 99, ou vide.');

    const max={}, actuel={};
    for(const [k,fr] of ATTRS_JEU){
      const m=nombre('max-'+cle(k)), a=nombre('act-'+cle(k));
      if(!entier(m,25,99)||!entier(a,25,99)){erreurs.push(`${fr} : Max et Actuel doivent être des nombres entiers entre 25 et 99.`);continue}
      if(a>m+BRISE_PLAFONDS_MAX){erreurs.push(`${fr} : ${a} dépasse le Max ${m} de plus de ${BRISE_PLAFONDS_MAX}. Impossible, un attribut ne reçoit que ${BRISE_PLAFONDS_MAX} brise-plafonds.`);continue}
      max[k]=m; actuel[k]=a;
    }
    return {erreurs,imp:{saisie,h,w,wg,max,actuel,gnr:saisie.gnr,date:new Date().toISOString()}};
  }

  function appliquer(imp){
    $('position').value=imp.saisie.position; $('height').value=imp.h; $('weight').value=imp.w; $('wing').value=imp.wg;
    bodyCaps(); // ramène l'envergure dans les limites du site si besoin
    imp.corps=[$('position').value,+$('height').value,+$('weight').value,+$('wing').value].join('|');
    imp.envergureCorrigee=+$('wing').value!==imp.wg;
    try{localStorage.setItem(IMPORT_JEU_KEY,JSON.stringify(imp))}
    catch(e){alert('Impossible d’enregistrer l’import sur cet appareil (stockage refusé ou plein).');return false}
    // Les brise-plafonds sont rangés par gabarit : le gabarit est déjà en place.
    for(const [k] of ATTRS_JEU)setBreaker(k,Math.max(0,imp.actuel[k]-imp.max[k]));
    apply({position:$('position').value,height:+$('height').value,weight:+$('weight').value,wing:+$('wing').value,
           style:$('style').value,hand:handValue(),attrs:{...ratings(),...imp.actuel}});
    return true;
  }

  function ouvrir(){
    ouvrirModale(formulaire());
    const f=$('importJeuForm');
    f.querySelector('[data-ij-fermer]').addEventListener('click',fermerModale);
    f.addEventListener('submit',e=>{
      e.preventDefault();
      const {erreurs,imp}=lireFormulaire(f), boite=$('importJeuErreurs');
      if(erreurs.length){
        boite.hidden=false;
        boite.innerHTML='<b>À corriger</b><ul>'+erreurs.map(x=>`<li>${escapeHTML(x)}</li>`).join('')+'</ul>';
        boite.scrollIntoView({block:'nearest'});
        return;
      }
      if(!appliquer(imp))return;
      fermerModale();
      $('importJeuEtat')?.scrollIntoView({block:'center'});
    });
  }

  function rendu(){
    const etat=$('importJeuEtat'); if(!etat)return;
    const imp=lire(), actif=importJeuActif();
    if(note)note.textContent=actif&&actif.gnr!=null
      ?`Moyenne de tes attributs par secteur, calculée par le site. Ta note globale dans le jeu (GNR) : ${actif.gnr}.`
      :NOTE_DEFAUT;
    if(!imp){etat.hidden=true;etat.innerHTML='';return}
    etat.hidden=false;
    if(actif){
      etat.className='import-jeu-etat actif';
      etat.innerHTML=`<b>✓ Build importé du jeu${actif.gnr!=null?` · GNR ${actif.gnr}`:''}</b>
        <span>Les plafonds affichés sont ceux de ton jeu (MAX), plus tes brise-plafonds (BP).${actif.envergureCorrigee?' Le site a dû ajuster ton envergure : vérifie-la.':''}</span>
        <div><button type="button" class="secondary" data-ij="modifier">Modifier</button><button type="button" class="secondary" data-ij="oublier">Oublier l’import</button></div>`;
      for(const x of inputs){
        const k=x.dataset.name; if(!(k in actif.max))continue;
        const b=getBreaker(k), lab=$('cap'+cle(k));
        if(lab)lab.textContent=`MAX ${actif.max[k]}`+(b?` +${b} BP`:'');
      }
    }else{
      etat.className='import-jeu-etat inactif';
      etat.innerHTML=`<b>Gabarit modifié</b>
        <span>Les plafonds de ton jeu ne valent que pour le gabarit importé : le site est revenu à son estimation.</span>
        <div><button type="button" data-ij="revenir">Revenir au build importé</button><button type="button" class="secondary" data-ij="oublier">Oublier l’import</button></div>`;
    }
  }

  $('importJeuOuvrir')?.addEventListener('click',ouvrir);
  $('importJeuEtat')?.addEventListener('click',e=>{
    const action=e.target.closest('[data-ij]')?.dataset.ij;
    if(action==='modifier')ouvrir();
    else if(action==='revenir'){const imp=lire();if(imp)appliquer(imp)}
    else if(action==='oublier'){localStorage.removeItem(IMPORT_JEU_KEY);update()}
  });

  const updateSansImport=update;
  update=function(){updateSansImport();rendu()};
  // app.js a branché ses curseurs sur la fonction update() d'origine, pas sur
  // celle-ci : sans ces écouteurs (appelés après les siens), changer la taille
  // ne mettrait pas l'encart à jour, et chaque curseur effacerait « MAX … BP ».
  [...inputs,...['position','height','weight','wing'].map($)].forEach(x=>x?.addEventListener('input',rendu));
  rendu(); // le premier rendu d'app.js a eu lieu avant le chargement de ce fichier
  // Lien « Importer mon build du jeu » de la page Mon build (?import=1).
  if(/[?&]import=1(&|$)/.test(location.search))ouvrir();
})();
