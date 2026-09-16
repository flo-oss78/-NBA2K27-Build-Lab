/* NBA 2K27 Build Lab — Version anglaise : traduction de ce qu'affichent les scripts.
   Chargé UNIQUEMENT par les pages /en/, après tous les autres scripts.

   Les pages /en/ sont déjà en anglais (générées par outils/i18n-generer.mjs), mais
   une trentaine de scripts écrivent encore du français dans la page : noms
   d'attributs, catégories, badges, messages. Plutôt que de modifier ces scripts un
   par un — trente fichiers, autant d'occasions de casser la version française —
   ce module traduit ce qu'ils viennent d'écrire, à chaque rendu.

   Trois sources, dans cet ordre de confiance :
   1. les tables du jeu déjà présentes dans le site (NOMS_ATTRIBUTS_FR, BADGE_FR,
      ANIMATION_CATEGORIES_FR), inversées : le français retrouve le terme anglais
      OFFICIEL, celui que le jeu affiche, sans traduction maison ;
   2. donnees/en-jeu.json (via i18n-en.js) : descriptions officielles du jeu ;
   3. donnees/en.json : les textes d'interface écrits pour le site. */
(function(){
  if(window.NBABL_LANG!=='en'||!window.NBABL_EN)return;
  var EN=window.NBABL_EN, AS=String.fromCharCode(92);
  // Les tables du jeu sont déclarées en const dans builder-data.js et animations.js :
  // elles vivent dans la portée globale sans être accrochées à window.
  function globale(nom){
    try{ return window[nom]||eval(nom)||null; }catch(e){ return null; }
  }
  var NOMS=globale('NOMS_ATTRIBUTS_FR'), BADGES=globale('BADGE_FR'),
      CATS_ANIM=globale('ANIMATION_CATEGORIES_FR'), DESCS=globale('BADGE_DESC_FR'),
      DESCS_ATTR=globale('DESC_ATTR_FR');

  /* ---- Table française → anglais ---- */
  var TABLE=Object.create(null);
  function ajouter(fr,en){
    if(!fr||!en||fr===en)return;
    var cle=String(fr).replace(/\s+/g,' ').trim();
    if(cle&&!TABLE[cle])TABLE[cle]=en;
  }
  Object.entries(EN.textes||{}).forEach(function(p){ajouter(p[0],p[1])});
  Object.entries(EN.scripts||{}).forEach(function(p){ajouter(p[0],p[1])});
  // Tables du jeu, inversées : « Tirs de près » → « Close Shot ».
  function inverser(table,noms){
    if(!table)return;
    Object.keys(table).forEach(function(en){
      var officiel=(noms&&noms[en])||en;
      ajouter(table[en],officiel);
    });
  }
  inverser(NOMS,EN.jeu&&EN.jeu.attributs);
  inverser(BADGES);
  inverser(CATS_ANIM);
  Object.entries((EN.jeu&&EN.jeu.categories)||{}).forEach(function(p){ajouter(p[0],p[1])});
  Object.entries((EN.jeu&&EN.jeu.paliers)||{}).forEach(function(p){ajouter(p[0],p[1])});
  Object.entries((EN.jeu&&EN.jeu.postes)||{}).forEach(function(p){ajouter(p[0],p[1])});
  // Descriptions officielles : la version française est remplacée par l'anglaise.
  if(DESCS&&EN.jeu&&EN.jeu.badgesDescriptions){
    Object.keys(DESCS).forEach(function(nom){
      ajouter(DESCS[nom],EN.jeu.badgesDescriptions[nom]);
    });
  }
  // Mêmes descriptions, côté attributs (étape Attributs, relevées dans le jeu).
  if(DESCS_ATTR&&EN.jeu&&EN.jeu.attributsDescriptions){
    Object.keys(DESCS_ATTR).forEach(function(nom){
      ajouter(DESCS_ATTR[nom],EN.jeu.attributsDescriptions[nom]);
    });
  }
  window.NBABL_TABLE_EN=TABLE;

  /* ---- Phrases dont le milieu est une valeur calculée ----
     « Afficher plus (12 sur 340 restants) » ne peut pas figurer dans une table :
     le nombre change à chaque rendu. Une expression régulière la couvre. */
  var MOTIFS=(EN.motifs||[]).map(function(p){
    try{ return [new RegExp(p[0],'g'),p[1]]; }catch(e){ return null; }
  }).filter(Boolean);

  /* ---- Termes à remplacer à l'intérieur d'une phrase ----
     « 65 Tirs de près (toi : 75) » n'est dans aucune table : seuls les termes
     du jeu qu'elle contient doivent changer. Les plus longs d'abord, sinon
     « Défense » écraserait « Défense intérieure ». */
  var TERMES=[];
  function terme(fr,en){ if(fr&&en&&fr!==en)TERMES.push([fr,en]); }
  Object.keys(NOMS||{}).forEach(function(en){
    terme(NOMS[en],(EN.jeu&&EN.jeu.attributs&&EN.jeu.attributs[en])||en);
  });
  Object.keys(BADGES||{}).forEach(function(en){terme(BADGES[en],en)});
  // Les listes d'animations affichent « Hésitation (Hesitation) » : le nom français
  // doit céder la place au nom du jeu, quitte à laisser un doublon que l'on retire.
  Object.keys(CATS_ANIM||{}).forEach(function(en){terme(CATS_ANIM[en],en)});
  Object.entries((EN.jeu&&EN.jeu.categories)||{}).forEach(function(p){terme(p[0],p[1])});
  Object.entries((EN.jeu&&EN.jeu.paliers)||{}).forEach(function(p){terme(p[0],p[1])});
  Object.entries((EN.jeu&&EN.jeu.termes)||{}).forEach(function(p){terme(p[0],p[1])});
  terme('Taille requise','Height required');
  // Les plus longs d'abord : sinon « Défense » écraserait « Défense intérieure ».
  TERMES.sort(function(a,b){return b[0].length-a[0].length});

  /* ---- Unités : le jeu anglais parle en pieds, pouces et livres ---- */
  function pieds(metres){
    var pouces=Math.round(parseFloat(String(metres).replace(',','.'))*100/2.54);
    return Math.floor(pouces/12)+"'"+(pouces%12)+'"';
  }
  // Typographie : l'anglais ne met pas d'espace avant : ; ! ? %, et « 1 à 2 » se dit « 1 to 2 ».
  function typographie(t){
    return t
      // « 1 à 2 », mais aussi « 5'9" à 7'4" » : une fourchette se dit « to ».
      .replace(/(\d|")\s+à\s+(\d)/g,'$1 to $2')
      // Milliers : « 2 595 » en français, « 2,595 » en anglais.
      .replace(/(\d)[   ](\d\d\d)\b/g,'$1,$2')
      .replace(new RegExp('[ ' + String.fromCharCode(160,8239) + ']+([:;!?%])','g'),'$1')
      // « Hesitation (Hesitation) » : le nom traduit a rejoint le nom d'origine,
      // y compris au milieu d'une phrase (« Rise Up (Rise Up) — locked »).
      .replace(/([^()]{2,}?) \(\1\)/g,'$1');
  }

  function unites(t){
    return t
      .replace(/(\d+),(\d+)\s*m\b/g,function(m,a,b){return pieds(a+'.'+b)})
      .replace(/(\d+),(\d+)\s*kg\b/g,function(m,a,b){return Math.round(parseFloat(a+'.'+b)*2.2046)+' lbs'})
      .replace(/(\d+)\s*kg\b/g,function(m,a){return Math.round(+a*2.2046)+' lbs'});
  }

  function traduire(texte){
    var t=texte.replace(/\s+/g,' ').trim();
    if(!t)return null;
    var direct=TABLE[t];
    if(direct!==undefined)return texte.replace(t,direct);
    var sortie=texte;
    for(var m=0;m<MOTIFS.length;m++){
      MOTIFS[m][0].lastIndex=0;
      sortie=sortie.replace(MOTIFS[m][0],MOTIFS[m][1]);
    }
    for(var i=0;i<TERMES.length;i++){
      if(sortie.indexOf(TERMES[i][0])>=0)sortie=sortie.split(TERMES[i][0]).join(TERMES[i][1]);
    }
    sortie=typographie(unites(sortie));
    return sortie===texte?null:sortie;
  }

  /* ---- Application au document ---- */
  var ATTRS=['aria-label','placeholder','title','alt','value'];
  var IGNORE={SCRIPT:1,STYLE:1,NOSCRIPT:1};
  function parcourir(racine){
    if(racine.nodeType===3){
      var neuf=traduire(racine.nodeValue);
      if(neuf!==null)racine.nodeValue=neuf;
      return;
    }
    if(racine.nodeType!==1||IGNORE[racine.tagName])return;
    ATTRS.forEach(function(a){
      if(!racine.hasAttribute||!racine.hasAttribute(a))return;
      if(a==='value'&&racine.tagName!=='OPTION'&&racine.tagName!=='BUTTON')return;
      var neuf=traduire(racine.getAttribute(a));
      if(neuf!==null)racine.setAttribute(a,neuf);
    });
    for(var n=racine.firstChild;n;n=n.nextSibling)parcourir(n);
  }

  var prevu=false;
  function planifier(){
    if(prevu)return;
    prevu=true;
    requestAnimationFrame(function(){prevu=false;parcourir(document.body)});
  }

  if(document.body)parcourir(document.body);
  else document.addEventListener('DOMContentLoaded',planifier);
  // Les scripts réécrivent la page à chaque changement de curseur : on suit.
  if('MutationObserver' in window){
    new MutationObserver(planifier).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  }
  document.addEventListener('input',planifier,true);
  document.addEventListener('change',planifier,true);
  document.addEventListener('click',planifier,true);
})();
