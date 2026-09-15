/* NBA 2K27 Build Lab — Signature Blueprints
   NBA 2K27 remplace les Pro-Tuned et templates NBA par des Signature Blueprints :
   des modèles pré-construits façonnés chacun par trois comparaisons d'athlètes
   NBA et WNBA, mêlant leurs attributs et leurs animations.

   IMPORTANT : 2K ne publie pas la table des blueprints officiels. La bibliothèque
   ci-dessous est un MODÈLE INDICATIF construit par le site à partir des profils
   publics des joueurs. Elle reproduit le principe (trois athlètes → un gabarit et
   un profil d'attributs), pas la liste officielle du jeu.
*/
(function(){
  'use strict';

  var POS=['PG','SG','SF','PF','C'];

  /* h = taille en pouces, w = poids, wing = envergure
     a = attributs clés ; les autres sont dérivés du profil de discipline. */
  var BLUEPRINTS=[
    // ---- Meneurs ----
    {id:'orbit',n:'Orbit Sniper',pos:'PG',tri:['Stephen Curry','Sabrina Ionescu','Damian Lillard'],h:75,w:185,wing:77,d:'Tir de très loin, sortie de dribble rapide, création en mouvement.',disc:'Tir',a:{'Three-Point':95,'Mid-Range':88,'Ball Handle':92,'Speed With Ball':88,'Pass Accuracy':84,'Close Shot':76,'Driving Layup':84,'Free Throw':88,'Speed':86,'Agility':88,'Perimeter Defense':72,'Steal':74}},
    {id:'metronome',n:'Metronome',pos:'PG',tri:['Chris Paul','Courtney Vandersloot','Tyrese Haliburton'],h:74,w:180,wing:76,d:'Contrôle du tempo, passe chirurgicale, mi-distance fiable.',disc:'Création',a:{'Pass Accuracy':95,'Ball Handle':92,'Mid-Range':88,'Three-Point':85,'Speed With Ball':84,'Steal':82,'Perimeter Defense':78,'Free Throw':86,'Agility':84}},
    {id:'blur',n:'Blur',pos:'PG',tri:["De'Aaron Fox",'Ja Morant','Jewell Loyd'],h:76,w:185,wing:80,d:'Vitesse pure balle en main, finition acrobatique au cercle.',disc:'Finition',a:{'Speed With Ball':94,'Speed':95,'Agility':92,'Driving Layup':92,'Driving Dunk':88,'Ball Handle':90,'Close Shot':84,'Pass Accuracy':78,'Three-Point':78,'Vertical':86}},
    {id:'conductor',n:'Conductor',pos:'PG',tri:['LaMelo Ball','Nikola Jokic','Alyssa Thomas'],h:79,w:200,wing:82,d:'Grand meneur, vision panoramique, rebond offensif surprise.',disc:'Création',a:{'Pass Accuracy':94,'Ball Handle':90,'Defensive Rebound':80,'Three-Point':84,'Mid-Range':82,'Speed With Ball':82,'Close Shot':80,'Steal':78,'Perimeter Defense':76}},
    {id:'pickpocket',n:'Pickpocket',pos:'PG',tri:['Marcus Smart','Gabby Williams','Jrue Holiday'],h:76,w:205,wing:81,d:'Défense de meneur agressive, interception, physique au-dessus du poste.',disc:'Défense',a:{'Steal':94,'Perimeter Defense':92,'Strength':84,'Agility':88,'Speed':86,'Ball Handle':82,'Three-Point':80,'Pass Accuracy':80,'Block':66}},
    {id:'downhill',n:'Downhill Engine',pos:'PG',tri:['Shai Gilgeous-Alexander','Kelsey Plum','Jalen Brunson'],h:77,w:195,wing:83,d:'Attaque au mi-poste, floaters, création de fautes.',disc:'Finition',a:{'Close Shot':92,'Driving Layup':94,'Mid-Range':92,'Ball Handle':92,'Pass Accuracy':88,'Free Throw':88,'Three-Point':80,'Agility':86,'Speed':84}},

    // ---- Arrières ----
    {id:'flamethrower',n:'Flamethrower',pos:'SG',tri:['Klay Thompson','Arike Ogunbowale','Buddy Hield'],h:78,w:200,wing:82,d:'Catch and shoot pur, déplacement sans ballon, spacing maximal.',disc:'Tir',a:{'Three-Point':96,'Mid-Range':90,'Free Throw':88,'Close Shot':80,'Speed':82,'Agility':84,'Perimeter Defense':78,'Ball Handle':76,'Pass Accuracy':72}},
    {id:'twoway-wing',n:'Two-Way Wing',pos:'SG',tri:['Anthony Edwards','Napheesa Collier','Devin Booker'],h:78,w:215,wing:83,d:'Scoring complet et défense périmétrique solide. Le couteau suisse.',disc:'Équilibré',a:{'Three-Point':86,'Mid-Range':86,'Driving Dunk':90,'Driving Layup':88,'Close Shot':84,'Ball Handle':84,'Perimeter Defense':86,'Steal':78,'Speed':86,'Vertical':88,'Strength':78}},
    {id:'contact-artist',n:'Contact Artist',pos:'SG',tri:['Zach LaVine','Ja Morant','Aaliyah Edwards'],h:78,w:205,wing:84,d:'Dunk en pénétration, alley-oops, verticalité explosive.',disc:'Finition',a:{'Driving Dunk':96,'Vertical':94,'Driving Layup':90,'Close Shot':86,'Speed':88,'Agility':88,'Ball Handle':84,'Three-Point':78,'Strength':76}},
    {id:'iso-sniper',n:'Iso Sniper',pos:'SG',tri:['Kyrie Irving','Jewell Loyd','Devin Booker'],h:76,w:195,wing:80,d:'Création isolée, handle élite, tir en sortie de dribble.',disc:'Création',a:{'Ball Handle':96,'Three-Point':88,'Mid-Range':90,'Driving Layup':92,'Speed With Ball':90,'Close Shot':86,'Agility':90,'Pass Accuracy':78,'Free Throw':86}},
    {id:'glove',n:'The Glove',pos:'SG',tri:['Alex Caruso','Gabby Williams','Derrick White'],h:78,w:195,wing:84,d:'Spécialiste défensif : mains rapides, passage d\u2019écrans, 3 de coin.',disc:'Défense',a:{'Perimeter Defense':95,'Steal':92,'Agility':90,'Speed':88,'Three-Point':82,'Block':72,'Strength':78,'Defensive Rebound':74,'Ball Handle':74}},
    {id:'microwave',n:'Microwave',pos:'SG',tri:['Jordan Poole','Sabrina Ionescu','Tyler Herro'],h:76,w:190,wing:79,d:'Scoring instantané en sortie de banc, tir profond et handle libre.',disc:'Tir',a:{'Three-Point':92,'Mid-Range':86,'Ball Handle':90,'Speed With Ball':88,'Driving Layup':84,'Close Shot':80,'Free Throw':86,'Agility':86,'Pass Accuracy':76}},

    // ---- Ailiers ----
    {id:'point-forward',n:'Point Forward',pos:'SF',tri:['Luka Doncic','Alyssa Thomas','LeBron James'],h:80,w:225,wing:84,d:'Ailier créateur : ballon dans les mains, passe et poids au poste.',disc:'Création',a:{'Pass Accuracy':94,'Ball Handle':92,'Post Control':84,'Driving Layup':90,'Close Shot':88,'Three-Point':84,'Mid-Range':86,'Strength':82,'Defensive Rebound':80}},
    {id:'3andd',n:'3&D Wing',pos:'SF',tri:['Mikal Bridges','Breanna Stewart','OG Anunoby'],h:80,w:210,wing:86,d:'Le standard moderne : 3 points fiable, défense multi-postes.',disc:'Défense',a:{'Three-Point':90,'Perimeter Defense':92,'Steal':84,'Block':76,'Agility':86,'Speed':84,'Driving Dunk':82,'Close Shot':80,'Defensive Rebound':78,'Strength':78}},
    {id:'bucket-chaser',n:'Bucket Chaser',pos:'SF',tri:['Jayson Tatum','Napheesa Collier','Kevin Durant'],h:81,w:210,wing:85,d:'Scoring à trois niveaux, tir par-dessus la défense.',disc:'Tir',a:{'Three-Point':90,'Mid-Range':94,'Close Shot':90,'Driving Layup':92,'Post Control':84,'Ball Handle':84,'Perimeter Defense':82,'Defensive Rebound':80,'Free Throw':88}},
    {id:'freight',n:'Freight Train',pos:'SF',tri:['Zion Williamson','A\u2019ja Wilson','Giannis Antetokounmpo'],h:81,w:250,wing:86,d:'Pénétration en force, finition dans le contact, transition.',disc:'Finition',a:{'Driving Dunk':95,'Close Shot':92,'Driving Layup':90,'Strength':92,'Vertical':88,'Post Control':82,'Speed':84,'Offensive Rebound':80,'Defensive Rebound':82}},
    {id:'swiss',n:'Swiss Army',pos:'SF',tri:['Draymond Green','Alyssa Thomas','Josh Hart'],h:79,w:230,wing:85,d:'Aucun trou : passe, rebond, défense de toutes tailles.',disc:'Équilibré',a:{'Pass Accuracy':90,'Defensive Rebound':88,'Offensive Rebound':80,'Interior Defense':84,'Perimeter Defense':86,'Steal':82,'Block':78,'Strength':86,'Close Shot':80,'Three-Point':76}},
    {id:'sky-hunter',n:'Sky Hunter',pos:'SF',tri:['Aaron Gordon','Jonquel Jones','Anthony Edwards'],h:80,w:235,wing:85,d:'Verticalité au sommet, lobs, rebond offensif.',disc:'Physique',a:{'Vertical':96,'Driving Dunk':92,'Standing Dunk':86,'Offensive Rebound':86,'Defensive Rebound':84,'Strength':86,'Speed':84,'Close Shot':86,'Block':76}},
    {id:'stopper',n:'Perimeter Stopper',pos:'SF',tri:['Kawhi Leonard','Gabby Williams','Jaden McDaniels'],h:80,w:220,wing:86,d:'Défense d\u2019élimination sur l\u2019extérieur, mains énormes, mi-distance.',disc:'Défense',a:{'Perimeter Defense':96,'Steal':90,'Strength':84,'Agility':86,'Mid-Range':86,'Three-Point':82,'Close Shot':84,'Block':74,'Defensive Rebound':80}},

    // ---- Ailiers forts ----
    {id:'stretch-four',n:'Stretch Four',pos:'PF',tri:['Karl-Anthony Towns','Breanna Stewart','Lauri Markkanen'],h:82,w:240,wing:86,d:'Intérieur qui ouvre le terrain : 3 points et finition au cercle.',disc:'Tir',a:{'Three-Point':90,'Mid-Range':86,'Close Shot':90,'Standing Dunk':84,'Post Control':82,'Defensive Rebound':86,'Offensive Rebound':76,'Strength':84,'Block':76,'Free Throw':84}},
    {id:'glass-cleaner',n:'Glass Cleaner',pos:'PF',tri:['Rudy Gobert','Jonquel Jones','Steven Adams'],h:83,w:255,wing:86,d:'Domination au rebond des deux côtés, deuxièmes chances.',disc:'Rebond',a:{'Defensive Rebound':96,'Offensive Rebound':92,'Standing Dunk':88,'Strength':92,'Block':86,'Interior Defense':86,'Close Shot':84,'Vertical':82}},
    {id:'enforcer',n:'Enforcer',pos:'PF',tri:['Bam Adebayo','A\u2019ja Wilson','Draymond Green'],h:81,w:250,wing:86,d:'Défense de tous les postes, écrans solides, passe depuis le poste haut.',disc:'Défense',a:{'Interior Defense':92,'Perimeter Defense':84,'Block':86,'Strength':92,'Defensive Rebound':88,'Pass Accuracy':84,'Close Shot':88,'Mid-Range':80,'Agility':78}},
    {id:'post-hammer',n:'Post Hammer',pos:'PF',tri:['Julius Randle','A\u2019ja Wilson','Zion Williamson'],h:81,w:255,wing:85,d:'Jeu au poste dominant, drop steps, finition en force.',disc:'Finition',a:{'Post Control':94,'Close Shot':92,'Standing Dunk':88,'Driving Dunk':86,'Strength':92,'Offensive Rebound':84,'Defensive Rebound':84,'Mid-Range':80}},
    {id:'point-four',n:'Point Four',pos:'PF',tri:['Nikola Jokic','Alyssa Thomas','Domantas Sabonis'],h:82,w:260,wing:85,d:'Intérieur passeur : le jeu passe par le poste haut.',disc:'Création',a:{'Pass Accuracy':94,'Post Control':90,'Close Shot':92,'Mid-Range':86,'Defensive Rebound':90,'Offensive Rebound':84,'Ball Handle':80,'Strength':88,'Three-Point':78}},
    {id:'unicorn',n:'Unicorn',pos:'PF',tri:['Victor Wembanyama','Breanna Stewart','Chet Holmgren'],h:84,w:230,wing:86,d:'Envergure extrême, contres et tir extérieur sur le même joueur.',disc:'Défense',a:{'Block':96,'Interior Defense':90,'Three-Point':86,'Close Shot':88,'Defensive Rebound':90,'Mid-Range':84,'Standing Dunk':88,'Agility':78,'Vertical':84}},

    // ---- Pivots ----
    {id:'rim-fortress',n:'Rim Fortress',pos:'C',tri:['Rudy Gobert','Brittney Griner','Walker Kessler'],h:85,w:265,wing:86,d:'Protection du cercle absolue, lobs, rebond défensif.',disc:'Défense',a:{'Block':97,'Interior Defense':94,'Defensive Rebound':94,'Standing Dunk':92,'Strength':92,'Offensive Rebound':86,'Close Shot':82,'Vertical':82}},
    {id:'hub',n:'Offensive Hub',pos:'C',tri:['Nikola Jokic','Jonquel Jones','Domantas Sabonis'],h:84,w:265,wing:85,d:'Le centre de gravité de l\u2019attaque : passe, poste, tir.',disc:'Création',a:{'Pass Accuracy':96,'Post Control':92,'Close Shot':94,'Mid-Range':88,'Three-Point':80,'Defensive Rebound':92,'Offensive Rebound':84,'Strength':88}},
    {id:'lob-threat',n:'Lob Threat',pos:'C',tri:['Jarrett Allen','A\u2019ja Wilson','Daniel Gafford'],h:84,w:250,wing:86,d:'Roll vers le cercle, finition au-dessus du panier, deuxième chance.',disc:'Finition',a:{'Standing Dunk':96,'Driving Dunk':88,'Vertical':92,'Offensive Rebound':90,'Defensive Rebound':88,'Close Shot':90,'Strength':88,'Block':84,'Interior Defense':86}},
    {id:'modern-five',n:'Modern Five',pos:'C',tri:['Karl-Anthony Towns','Jonquel Jones','Myles Turner'],h:84,w:250,wing:86,d:'Pivot qui tire à 3 et protège quand même le cercle.',disc:'Tir',a:{'Three-Point':88,'Mid-Range':84,'Close Shot':90,'Block':88,'Interior Defense':84,'Defensive Rebound':88,'Standing Dunk':86,'Free Throw':84,'Strength':84}},
    {id:'bruiser',n:'Bruiser',pos:'C',tri:['Steven Adams','Brittney Griner','Nikola Vucevic'],h:84,w:275,wing:86,d:'Masse pure : écrans, rebond offensif, impossible à déplacer.',disc:'Physique',a:{'Strength':97,'Offensive Rebound':94,'Defensive Rebound':92,'Standing Dunk':90,'Close Shot':86,'Post Control':86,'Interior Defense':88,'Block':82}},
    {id:'switch-five',n:'Switch Five',pos:'C',tri:['Bam Adebayo','Napheesa Collier','Draymond Green'],h:82,w:250,wing:86,d:'Pivot capable de switcher sur un meneur sans perdre le cercle.',disc:'Défense',a:{'Perimeter Defense':88,'Interior Defense':92,'Block':86,'Agility':84,'Speed':82,'Steal':80,'Defensive Rebound':90,'Close Shot':88,'Pass Accuracy':84,'Strength':88}},

    // ---- Profils hybrides ----
    {id:'combo',n:'Combo Guard',pos:'SG',tri:['Damian Lillard','Kelsey Plum','Jalen Brunson'],h:75,w:195,wing:79,d:'Scoreur et meneur à parts égales, tir très loin.',disc:'Équilibré',a:{'Three-Point':92,'Ball Handle':90,'Pass Accuracy':86,'Mid-Range':88,'Driving Layup':88,'Speed With Ball':88,'Close Shot':82,'Free Throw':88,'Agility':86}},
    {id:'slash-sniper',n:'Slashing Sniper',pos:'SF',tri:['Paul George','Breanna Stewart','Anthony Edwards'],h:80,w:215,wing:85,d:'Tir extérieur et pénétration, avec une vraie défense.',disc:'Équilibré',a:{'Three-Point':88,'Driving Dunk':88,'Driving Layup':88,'Perimeter Defense':86,'Mid-Range':84,'Ball Handle':84,'Steal':80,'Speed':84,'Vertical':86}},
    {id:'grinder',n:'Grinder',pos:'SF',tri:['Josh Hart','Alyssa Thomas','Jimmy Butler'],h:78,w:220,wing:84,d:'Rebond depuis l\u2019extérieur, transition, défense sans relâche.',disc:'Rebond',a:{'Defensive Rebound':90,'Offensive Rebound':84,'Perimeter Defense':86,'Steal':82,'Strength':86,'Close Shot':84,'Driving Layup':86,'Speed':84}},
    {id:'floor-general',n:'Floor General',pos:'PG',tri:['Tyrese Haliburton','Courtney Vandersloot','Chris Paul'],h:77,w:190,wing:80,d:'Le build de passeur pur : assists, spacing, zéro perte.',disc:'Création',a:{'Pass Accuracy':97,'Ball Handle':90,'Three-Point':88,'Speed With Ball':84,'Mid-Range':82,'Close Shot':78,'Free Throw':86,'Perimeter Defense':76}},
    {id:'energy',n:'Energy Big',pos:'PF',tri:['Aaron Gordon','Aaliyah Edwards','Jarrett Allen'],h:82,w:240,wing:86,d:'Intérieur de transition : lobs, rebond offensif, contres.',disc:'Physique',a:{'Vertical':94,'Standing Dunk':92,'Offensive Rebound':88,'Defensive Rebound':86,'Block':84,'Speed':84,'Strength':86,'Close Shot':86,'Driving Dunk':86}},
    {id:'shot-creator',n:'Shot Creator',pos:'SG',tri:['Devin Booker','Arike Ogunbowale','Kyrie Irving'],h:78,w:200,wing:81,d:'Création de son propre tir en toutes situations.',disc:'Tir',a:{'Mid-Range':94,'Three-Point':88,'Ball Handle':92,'Close Shot':86,'Driving Layup':88,'Speed With Ball':86,'Free Throw':88,'Pass Accuracy':80}},
    {id:'wall',n:'The Wall',pos:'C',tri:['Rudy Gobert','Brittney Griner','Bam Adebayo'],h:85,w:270,wing:86,d:'Écrans indéplaçables et défense intérieure maximale.',disc:'Physique',a:{'Strength':96,'Interior Defense':92,'Block':90,'Defensive Rebound':92,'Standing Dunk':88,'Offensive Rebound':86,'Close Shot':84}},
    {id:'wnba-engine',n:'Two-Way Engine',pos:'SF',tri:['Napheesa Collier','Alyssa Thomas','Jimmy Butler'],h:79,w:215,wing:84,d:'Impact des deux côtés sans dépendre du ballon.',disc:'Équilibré',a:{'Mid-Range':86,'Close Shot':88,'Driving Layup':88,'Perimeter Defense':88,'Steal':86,'Defensive Rebound':84,'Strength':84,'Three-Point':80,'Pass Accuracy':82}},
    {id:'deep-threat',n:'Deep Threat',pos:'PG',tri:['Damian Lillard','Sabrina Ionescu','Stephen Curry'],h:75,w:190,wing:78,d:'Menace à 10 mètres du panier. Le spacing est l\u2019arme.',disc:'Tir',a:{'Three-Point':97,'Free Throw':90,'Mid-Range':86,'Ball Handle':90,'Speed With Ball':86,'Pass Accuracy':84,'Close Shot':78,'Agility':84}}
  ];

  /* Valeurs par défaut appliquées aux attributs non listés, selon la discipline. */
  var FILL={
    'Tir':      {def:62,low:52},
    'Finition': {def:64,low:54},
    'Création': {def:62,low:52},
    'Défense':  {def:64,low:54},
    'Rebond':   {def:62,low:52},
    'Physique': {def:68,low:56},
    'Équilibré':{def:70,low:60}
  };

  var ALL_ATTRS=['Close Shot','Driving Layup','Driving Dunk','Standing Dunk','Post Control',
    'Mid-Range','Three-Point','Free Throw','Pass Accuracy','Ball Handle','Speed With Ball',
    'Interior Defense','Perimeter Defense','Steal','Block','Offensive Rebound','Defensive Rebound',
    'Speed','Agility','Strength','Vertical'];

  var COST_W={'Close Shot':1.00,'Driving Layup':1.05,'Driving Dunk':1.35,'Standing Dunk':1.15,'Post Control':1.05,
    'Mid-Range':1.10,'Three-Point':1.35,'Free Throw':0.55,'Pass Accuracy':0.95,'Ball Handle':1.30,'Speed With Ball':1.20,
    'Interior Defense':0.95,'Perimeter Defense':1.15,'Steal':1.10,'Block':1.10,'Offensive Rebound':0.80,'Defensive Rebound':0.90,
    'Speed':1.15,'Agility':1.10,'Strength':0.95,'Vertical':1.00};

  /* Le style de build le plus proche, pour réutiliser badges et animations. */
  var DISC_TO_STYLE={'Tir':'Shooter','Finition':'Slasher','Création':'Playmaker',
    'Défense':'Lockdown','Rebond':'Big','Physique':'Big','Équilibré':'Équilibré'};

  var BUDGET=1000;

  function fullTargets(bp){
    var fill=FILL[bp.disc]||FILL['Équilibré'];
    var t={};
    ALL_ATTRS.forEach(function(k){
      t[k]=bp.a[k]!=null?bp.a[k]:(bp.disc==='Physique'?fill.def:fill.low);
    });
    t['Free Throw']=Math.max(t['Free Throw'],70);
    return fitBudget(t,bp);
  }

  function cost(t){
    var s=0;
    for(var k in t)s+=Math.max(0,t[k]-25)*(COST_W[k]||1);
    return Math.round(s);
  }

  /* Ramène le blueprint dans le budget indicatif sans toucher à ses six piliers. */
  function fitBudget(t,bp){
    var pillars=Object.keys(bp.a).sort(function(a,b){return bp.a[b]-bp.a[a]}).slice(0,6);
    var guard=0;
    while(cost(t)>BUDGET&&guard<4000){
      var best=null,bestW=-1;
      for(var k in t){
        if(pillars.indexOf(k)>=0)continue;
        if(t[k]<=30)continue;
        var w=COST_W[k]||1;
        if(w>bestW){bestW=w;best=k}
      }
      if(!best)break;
      t[best]--;guard++;
    }
    return t;
  }

  function el(id){return document.getElementById(id)}
  var esc=window.escHtml;

  var filterPos='all',filterDisc='all',search='';

  function visible(){
    return BLUEPRINTS.filter(function(b){
      if(filterPos!=='all'&&b.pos!==filterPos)return false;
      if(filterDisc!=='all'&&b.disc!==filterDisc)return false;
      if(search){
        var hay=(b.n+' '+b.tri.join(' ')+' '+b.d).toLowerCase();
        if(hay.indexOf(search)<0)return false;
      }
      return true;
    });
  }

  function heightText(h){return Math.floor(h/12)+"'"+(h%12)+'"'}

  function render(){
    var grid=el('blueprintGrid');
    if(!grid)return;
    var list=visible();
    var count=el('blueprintCount');
    if(count)count.textContent=list.length+' trio'+(list.length>1?'s':'');
    if(!list.length){
      grid.innerHTML='<div class="empty">Aucun trio avec ces filtres. Élargis la recherche.</div>';
      return;
    }
    grid.innerHTML=list.map(function(b){
      return '<article class="bp-card" data-bp="'+b.id+'">'+
        '<div class="bp-top"><h3>'+esc(b.n)+'</h3><span class="bp-pos">'+b.pos+'</span></div>'+
        '<div class="bp-tri">'+b.tri.map(function(p){
          return '<span><i aria-hidden="true">'+esc(initials(p))+'</i>'+esc(p)+'</span>';
        }).join('<em aria-hidden="true">+</em>')+'</div>'+
        '<p class="bp-desc">'+esc(b.d)+'</p>'+
        '<div class="bp-meta"><span>'+heightText(b.h)+'</span><span>'+b.w+' lbs</span>'+
        '<span>'+heightText(b.wing)+'</span><span class="bp-disc bp-'+discClass(b.disc)+'">'+esc(b.disc)+'</span></div>'+
        '<button type="button" class="bp-apply" data-apply="'+b.id+'">Utiliser ce trio</button>'+
      '</article>';
    }).join('');
    grid.querySelectorAll('[data-apply]').forEach(function(btn){
      btn.addEventListener('click',function(){applyBlueprint(btn.dataset.apply)});
    });
  }

  function initials(name){
    return name.split(/\s+/).map(function(w){return w[0]}).join('').slice(0,2).toUpperCase();
  }
  function discClass(d){
    return {'Tir':'shoot','Finition':'finish','Création':'play','Défense':'defense',
            'Rebond':'rebound','Physique':'physical','Équilibré':'balanced'}[d]||'balanced';
  }

  /* Le style découle du poste et de la discipline du blueprint. */
  function styleFor(bp){
    var style=DISC_TO_STYLE[bp.disc]||'Équilibré';
    if((bp.pos==='C'||bp.pos==='PF')&&(bp.disc==='Défense'||bp.disc==='Rebond'||bp.disc==='Physique'))style='Big';
    if((bp.pos==='PG'||bp.pos==='SG')&&bp.disc==='Rebond')style='Lockdown';
    return style;
  }

  /* Sur la page /trios/, le builder n'est pas dans le DOM : on encode le
     blueprint dans l'URL et on laisse app.js l'appliquer à l'arrivée (il sait
     déjà lire ?build=, c'est le format des liens de partage). */
  function ouvrirDansLeBuilder(bp){
    var cibles=fullTargets(bp), attrs={};
    Object.keys(cibles).forEach(function(k){attrs[k]=String(cibles[k])});
    var obj={position:bp.pos,height:String(bp.h),weight:String(bp.w),
             wing:String(bp.wing),style:styleFor(bp),hand:'Droite',attrs:attrs};
    location.href='/?build='+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(obj)))));
  }

  function applyBlueprint(id){
    var bp=BLUEPRINTS.filter(function(b){return b.id===id})[0];
    if(!bp)return;
    if(!el('position')){ouvrirDansLeBuilder(bp);return}
    if(window.NBABL_HISTORY)window.NBABL_HISTORY.snapshot();

    el('position').value=bp.pos;
    el('height').value=bp.h;
    el('weight').value=bp.w;
    el('wing').value=Math.min(+el('wing').max,Math.max(+el('wing').min,bp.wing));

    var targets=fullTargets(bp);
    (window.inputs||[]).forEach(function(x){
      var v=targets[x.dataset.name];
      if(v!=null)x.value=Math.min(+x.max,Math.max(+x.min,v));
    });

    var style=styleFor(bp);
    el('style').value=style;
    if(window.NBABL_APPLY_STYLE_VISUALS)window.NBABL_APPLY_STYLE_VISUALS(style);
    if(window.setAttributeBaseline)window.setAttributeBaseline(targets);
    if(window.appUpdate)window.appUpdate();

    var badge=el('activeBlueprint');
    if(badge){
      badge.hidden=false;
      badge.innerHTML='<b>'+esc(bp.n)+'</b><span>'+b3(bp.tri)+'</span>'+
        '<button type="button" id="clearBlueprint" aria-label="Retirer le trio">×</button>';
      el('clearBlueprint').addEventListener('click',function(){badge.hidden=true});
    }
    var builder=el('builder');
    if(builder)builder.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function b3(tri){return tri.join(' + ')}

  function boot(){
    var grid=el('blueprintGrid');
    if(!grid)return;
    var posSel=el('blueprintPos'),discSel=el('blueprintDisc'),searchIn=el('blueprintSearch');
    if(posSel)posSel.addEventListener('change',function(){filterPos=posSel.value;render()});
    if(discSel)discSel.addEventListener('change',function(){filterDisc=discSel.value;render()});
    if(searchIn)searchIn.addEventListener('input',function(){search=searchIn.value.toLowerCase().trim();render()});
    render();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();

  window.NBABL_BLUEPRINTS={list:BLUEPRINTS,apply:applyBlueprint,targets:fullTargets};
})();
