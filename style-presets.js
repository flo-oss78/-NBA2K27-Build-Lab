/* NBA 2K27 Build Lab — Presets de style (V23)
   Extrait des scripts inline de la V22 puis corrigé :
   - icônes SVG conservées (l'ancienne version écrasait le SVG par un emoji)
   - les six styles ont désormais des recommandations complètes
   - baseline d'attributs transmise à app.js pour afficher les écarts (+12, +16…)
*/
(function(){
  'use strict';

  var STYLE_ICONS={
    'Équilibré':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v14M5 7h14M7 7l-2 5h4L7 7Zm10 0-2 5h4l-2-5ZM8 20h8M9 17h6"/></svg>',
    'Shooter':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m18 6 2-2M4 12H2"/></svg>',
    'Slasher':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="5" r="2"/><path d="m12 8-3 5 3 2 1-4 2 3 3-1-3-5M12 15l-2 6M12 15l4 6"/></svg>',
    'Playmaker':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2 2 3 5 3 8s-1 6-3 8M12 4c-2 2-3 5-3 8s1 6 3 8"/></svg>',
    'Lockdown':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/></svg>',
    'Big':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16M4 15h16M7 6v12M17 6v12M9 8v8M15 8v8"/></svg>'
  };

  var PRESETS={
    'Équilibré':{
      text:"Polyvalent, aucune faiblesse majeure, prêt à jouer dans plusieurs rôles.",
      targets:{'Close Shot':78,'Driving Layup':84,'Driving Dunk':85,'Standing Dunk':45,'Post Control':55,'Mid-Range':52,'Three-Point':85,'Free Throw':76,'Pass Accuracy':82,'Ball Handle':84,'Speed With Ball':45,'Interior Defense':62,'Perimeter Defense':45,'Steal':45,'Block':45,'Offensive Rebound':52,'Defensive Rebound':66,'Speed':84,'Agility':84,'Strength':75,'Vertical':78,'Stamina':92}
    },
    'Shooter':{
      text:"Tir à 3 points prioritaire, création secondaire et assez de mobilité pour rester dangereux.",
      targets:{'Close Shot':74,'Driving Layup':78,'Driving Dunk':45,'Standing Dunk':45,'Post Control':45,'Mid-Range':88,'Three-Point':93,'Free Throw':82,'Pass Accuracy':78,'Ball Handle':86,'Speed With Ball':46,'Interior Defense':45,'Perimeter Defense':80,'Steal':74,'Block':45,'Offensive Rebound':45,'Defensive Rebound':58,'Speed':84,'Agility':84,'Strength':62,'Vertical':70,'Stamina':90}
    },
    'Slasher':{
      text:"Attaque le cercle, finition élite, crée de l'espace et peut finir en force.",
      targets:{'Close Shot':88,'Driving Layup':93,'Driving Dunk':94,'Standing Dunk':45,'Post Control':52,'Mid-Range':50,'Three-Point':45,'Free Throw':70,'Pass Accuracy':78,'Ball Handle':86,'Speed With Ball':88,'Interior Defense':60,'Perimeter Defense':45,'Steal':73,'Block':45,'Offensive Rebound':50,'Defensive Rebound':60,'Speed':45,'Agility':84,'Strength':73,'Vertical':85,'Stamina':90}
    },
    'Playmaker':{
      text:"Création de jeu prioritaire : gros handle, vitesse balle en main et passe de haut niveau.",
      targets:{'Close Shot':76,'Driving Layup':84,'Driving Dunk':45,'Standing Dunk':45,'Post Control':45,'Mid-Range':80,'Three-Point':45,'Free Throw':76,'Pass Accuracy':90,'Ball Handle':93,'Speed With Ball':88,'Interior Defense':45,'Perimeter Defense':59,'Steal':80,'Block':45,'Offensive Rebound':45,'Defensive Rebound':56,'Speed':90,'Agility':88,'Strength':62,'Vertical':74,'Stamina':92}
    },
    'Lockdown':{
      text:"Défense extérieure prioritaire : interception, mobilité et résistance physique.",
      targets:{'Close Shot':74,'Driving Layup':80,'Driving Dunk':82,'Standing Dunk':45,'Post Control':45,'Mid-Range':45,'Three-Point':45,'Free Throw':72,'Pass Accuracy':72,'Ball Handle':45,'Speed With Ball':45,'Interior Defense':70,'Perimeter Defense':92,'Steal':93,'Block':61,'Offensive Rebound':50,'Defensive Rebound':70,'Speed':88,'Agility':89,'Strength':82,'Vertical':74,'Stamina':92}
    },
    'Big':{
      text:"Intérieur dominant : protection du cercle, rebond, force et finition près du panier.",
      targets:{'Close Shot':88,'Driving Layup':70,'Driving Dunk':45,'Standing Dunk':90,'Post Control':85,'Mid-Range':66,'Three-Point':45,'Free Throw':66,'Pass Accuracy':66,'Ball Handle':45,'Speed With Ball':45,'Interior Defense':85,'Perimeter Defense':45,'Steal':52,'Block':93,'Offensive Rebound':82,'Defensive Rebound':90,'Speed':52,'Agility':66,'Strength':90,'Vertical':80,'Stamina':88}
    }
  };

  /* Badges recommandés par style — libellé, groupe et palier visé. */
  var STYLE_BADGE_PLAN={
    'Slasher':[
      ['Finition','Posterizer','HOF'],['Finition','Aerial Wizard','HOF'],['Finition','Slithery','Gold'],
      ['Finition','Physical Finisher','HOF'],['Finition','Precision Dunker','Gold'],
      ['Création / Tir','Handles for Days','Gold'],['Création / Tir','Speed Booster','Gold'],['Création / Tir','Killer Combos','Gold'],
      ['Création / Tir','Agent 3','Silver'],['Création / Tir','Green Machine','Silver'],
      ['Défense','Glove','Silver'],['Défense','Interceptor','Silver'],['Défense','Challenger','Silver'],
      ['Défense','Immovable Enforcer','Silver'],['Défense','Pick Dodger','Silver']
    ],
    'Shooter':[
      ['Tir','Limitless Range','HOF'],['Tir','Deadeye','HOF'],['Tir','Quick Trigger','Gold'],
      ['Tir','Set and Fire','Gold'],['Tir','Arc Cadence','Gold'],
      ['Création / Finition','Handles for Days','Gold'],['Création / Finition','Ankle Assassin','Silver'],['Création / Finition','Slithery','Silver'],
      ['Création / Finition','Pace','Silver'],['Création / Finition','Green Machine','Gold'],
      ['Défense','Challenger','Silver'],['Défense','Pick Dodger','Silver'],['Défense','Interceptor','Bronze'],
      ['Défense','Glove','Bronze'],['Défense','Work Horse','Bronze']
    ],
    'Playmaker':[
      ['Création','Handles for Days','HOF'],['Création','Ankle Assassin','HOF'],['Création','Lightning Launch','Gold'],
      ['Création','Versatile Visionary','Gold'],['Création','Pace','Gold'],
      ['Tir / Finition','Agent 3','Gold'],['Tir / Finition','Deadeye','Silver'],['Tir / Finition','Slithery','Gold'],
      ['Tir / Finition','Float Game','Silver'],['Tir / Finition','Green Machine','Silver'],
      ['Défense','Interceptor','Gold'],['Défense','Glove','Silver'],['Défense','Challenger','Silver'],
      ['Défense','Pick Dodger','Silver'],['Défense','Work Horse','Bronze']
    ],
    'Lockdown':[
      ['Défense','Challenger','HOF'],['Défense','Glove','HOF'],['Défense','Interceptor','Gold'],
      ['Défense','Pick Dodger','Gold'],['Défense','Immovable Enforcer','Gold'],
      ['Physique / Rebond','Work Horse','Gold'],['Physique / Rebond','Boxout Boss','Silver'],['Physique / Rebond','Brick Wall','Silver'],
      ['Physique / Rebond','Pogo Stick','Silver'],['Physique / Rebond','Rebound Chaser','Silver'],
      ['Attaque','Agent 3','Silver'],['Attaque','Handles for Days','Silver'],['Attaque','Physical Finisher','Silver'],
      ['Attaque','Deadeye','Bronze'],['Attaque','Slithery','Bronze']
    ],
    'Big':[
      ['Intérieur','Paint Patroller','HOF'],['Intérieur','Wall Up','HOF'],['Intérieur','Post Powerhouse','Gold'],
      ['Intérieur','Rise Up','Gold'],['Intérieur','Physical Finisher','Gold'],
      ['Rebond','Boxout Boss','Gold'],['Rebond','Rebound Chaser','Gold'],['Rebond','Brick Wall','Gold'],
      ['Rebond','Work Horse','Silver'],['Rebond','Pogo Stick','Silver'],
      ['Attaque','Post Fade Phenom','Silver'],['Attaque','Hook Specialist','Silver'],['Attaque','Precision Dunker','Silver'],
      ['Attaque','Deadeye','Bronze'],['Attaque','Handles for Days','Bronze']
    ],
    'Équilibré':[
      ['Attaque','Deadeye','Gold'],['Attaque','Physical Finisher','Gold'],['Attaque','Slithery','Gold'],
      ['Attaque','Agent 3','Gold'],['Attaque','Precision Dunker','Silver'],
      ['Création','Handles for Days','Gold'],['Création','Pace','Silver'],['Création','Killer Combos','Silver'],
      ['Création','Versatile Visionary','Silver'],['Création','Green Machine','Silver'],
      ['Défense','Challenger','Gold'],['Défense','Interceptor','Silver'],['Défense','Glove','Silver'],
      ['Défense','Pick Dodger','Silver'],['Défense','Work Horse','Silver']
    ]
  };

  var GROUP_HINT={
    'Finition':'prioritaires','Tir':'prioritaires','Création':'prioritaires','Intérieur':'prioritaires',
    'Défense':'utiles','Rebond':'recommandés','Attaque':'recommandés',
    'Création / Tir':'recommandés','Création / Finition':'recommandés','Tir / Finition':'recommandés',
    'Physique / Rebond':'recommandés'
  };

  var BADGE_GLYPH={
    'Posterizer':'◤','Aerial Wizard':'◬','Slithery':'◇','Physical Finisher':'✦','Precision Dunker':'◈',
    'Handles for Days':'⌁','Speed Booster':'↯','Killer Combos':'◉','Agent 3':'A3','Green Machine':'✓',
    'Glove':'◆','Interceptor':'◇','Challenger':'◈','Immovable Enforcer':'⬟','Pick Dodger':'✕',
    'Limitless Range':'◎','Deadeye':'◉','Quick Trigger':'↯','Set and Fire':'✦','Arc Cadence':'◠',
    'Ankle Assassin':'⌁','Lightning Launch':'↯','Versatile Visionary':'◈','Pace':'▷','Float Game':'◌',
    'Work Horse':'⬟','Boxout Boss':'▣','Brick Wall':'▤','Pogo Stick':'↥','Rebound Chaser':'◍',
    'Paint Patroller':'▩','Wall Up':'▦','Post Powerhouse':'▬','Rise Up':'↥','Post Fade Phenom':'◐',
    'Hook Specialist':'◑'
  };

  /* Animations recommandées, par style. */
  var STYLE_ANIMATIONS={
    'Slasher':[["Dribble Style","De'Aaron Fox",'Dribble Style'],['Signature Size-Up','Ja Morant','Signature Size-Up'],['Escape Moves','Kyrie Irving','Dribble • Behind the Back'],['Moving Crossover','Ja Morant','Dribble • Behind the Back'],['Moving Behind the Back','Devin Booker','Dribble • Behind the Back'],['Moving Spin','LaMelo Ball','Dribble Style'],['Moving Hesitation','Zach LaVine','Dribble Style'],['Triple Threat Style','Ja Morant','Dribble Style'],['Dunk Packages','Ja Morant + Zach LaVine','Alley-Oops / Contact'],['Layup Package',"De'Aaron Fox",'Layup Style']],
    'Shooter':[['Jumpshot • Base','Stephen Curry','Jumpshot • Base'],['Go-To Shot','Klay Thompson','Shooting • Go-To Shot'],['Dribble Pull-Up','Devin Booker','Shooting • Dribble Pull-Up'],['Dribble Style','Stephen Curry','Dribble Style'],['Signature Size-Up','Devin Booker','Signature Size-Up'],['Escape Moves','Kyrie Irving','Dribble • Behind the Back'],['Moving Crossover','Stephen Curry','Dribble • Behind the Back'],['Motion Style','Pro','Motion Style'],['Layup Package','Kyrie Irving','Layup Style'],['Pass Style','Pro','Pass Style']],
    'Playmaker':[['Dribble Style','Kyrie Irving','Dribble Style'],['Signature Size-Up','LaMelo Ball','Signature Size-Up'],['Escape Moves','Kyrie Irving','Dribble • Behind the Back'],['Moving Crossover','LaMelo Ball','Dribble • Behind the Back'],['Moving Behind the Back','Kyrie Irving','Dribble • Behind the Back'],['Moving Spin','LaMelo Ball','Dribble Style'],['Pass Style','LaMelo Ball','Pass Style'],['Triple Threat Style','Kyrie Irving','Dribble Style'],['Layup Package','Kyrie Irving','Layup Style'],['Jumpshot • Base','Pro','Jumpshot • Base']],
    'Lockdown':[['Motion Style','Pro','Motion Style'],['Dribble Style','Devin Booker','Dribble Style'],['Jumpshot • Base','Pro','Jumpshot • Base'],['Go-To Shot','Devin Booker','Shooting • Go-To Shot'],['Signature Size-Up','Devin Booker','Signature Size-Up'],['Escape Moves','Kyrie Irving','Dribble • Behind the Back'],['Layup Package','Pro','Layup Style'],['Dunk Packages','Zach LaVine','Alley-Oops / Contact'],['Pass Style','Pro','Pass Style'],['Triple Threat Style','Pro','Dribble Style']],
    'Big':[['Dunk Packages','Pro','Alley-Oops / Contact'],['Layup Package','Pro','Layup Style'],['Jumpshot • Base','Pro','Jumpshot • Base'],['Go-To Shot','Pro','Shooting • Go-To Shot'],['Motion Style','Pro','Motion Style'],['Pass Style','Pro','Pass Style'],['Dribble Style','Pro','Dribble Style'],['Triple Threat Style','Pro','Dribble Style'],['Signature Size-Up','Pro','Signature Size-Up'],['Moving Spin','Pro','Dribble Style']],
    'Équilibré':[['Dribble Style','Devin Booker','Dribble Style'],['Signature Size-Up','Devin Booker','Signature Size-Up'],['Jumpshot • Base','Pro','Jumpshot • Base'],['Go-To Shot','Devin Booker','Shooting • Go-To Shot'],['Dribble Pull-Up','Devin Booker','Shooting • Dribble Pull-Up'],['Escape Moves','Kyrie Irving','Dribble • Behind the Back'],['Moving Crossover','Pro','Dribble • Behind the Back'],['Layup Package','Pro','Layup Style'],['Dunk Packages','Zach LaVine','Alley-Oops / Contact'],['Motion Style','Pro','Motion Style']]
  };

  var STYLE_TAKEOVERS={
    'Shooter':['Sharpshooter','Shot Creator'],
    'Slasher':['Slasher','Ball Handler'],
    'Playmaker':['Playmaker','Ball Handler'],
    'Lockdown':['Perimeter Lock','Pick Pocket'],
    'Big':['Rim Protector','Glass Cleaner'],
    'Équilibré':['Two-Way','Ball Handler']
  };

  var TAKEOVER_GLYPH={
    'Sharpshooter':'◎','Shot Creator':'✦','Slasher':'♛','Ball Handler':'⚡','Playmaker':'◈',
    'Perimeter Lock':'⛨','Pick Pocket':'◇','Rim Protector':'⛨','Glass Cleaner':'◍','Two-Way':'⇄','Post Scorer':'▬'
  };

  var TIER_CLASS={HOF:'hof',Gold:'gold',Silver:'silver',Bronze:'bronze'};

  function el(id){return document.getElementById(id)}
  function inputsList(){return window.inputs||[]}
  function currentRatings(){
    var out={};
    inputsList().forEach(function(x){out[x.dataset.name]=+x.value});
    return out;
  }
  function setAttr(name,value){
    var input=inputsList().find(function(x){return x.dataset.name===name});
    if(!input)return;
    input.value=Math.min(+input.max,Math.max(+input.min,value));
  }
  var esc=window.escHtml;

  /* ---------- Badges ---------- */
  function renderStyleBadges(style){
    var box=el('styleBadgeRecommendations');
    if(!box)return;
    var plan=STYLE_BADGE_PLAN[style]||STYLE_BADGE_PLAN['Équilibré'];
    var html='',last='';
    plan.forEach(function(row){
      var group=row[0],name=row[1],tier=row[2];
      if(group!==last){
        html+='<div class="badge-group-label">'+esc(group)+' <span>('+(GROUP_HINT[group]||'recommandés')+')</span></div>';
        last=group;
      }
      var cls=TIER_CLASS[tier]||'none';
      var glyph=BADGE_GLYPH[name]||'✦';
      html+='<div class="style-badge-item"><div class="style-badge-icon '+cls+'" aria-hidden="true">'+glyph+'</div>'+
            '<b>'+esc(name)+'</b><small>'+esc(tier)+'</small></div>';
    });
    box.innerHTML=html;
  }

  /* ---------- Animations ---------- */
  function renderStyleAnimations(style,r){
    var box=el('styleAnimationRecommendations');
    if(!box)return;
    var rows=STYLE_ANIMATIONS[style]||STYLE_ANIMATIONS['Équilibré'];
    var anims=window.ANIMATIONS||[];
    var h=typeof heightInches==='function'?heightInches():78;
    box.innerHTML=rows.map(function(row){
      var label=row[0],name=row[1],cat=row[2];
      // Le nom seul (sans catégorie) sert de dernier repli, mais uniquement
      // s'il n'existe qu'une seule entrée sous ce nom dans ANIMATIONS — sinon
      // la catégorie voulue prime pour éviter d'afficher les mauvaises
      // exigences (ex. plusieurs "Pro" dans des catégories différentes).
      var sameName=anims.filter(function(a){return a.name===name});
      var match=anims.find(function(a){return a.name===name&&a.category===cat})||
                (sameName.length===1?sameName[0]:null);
      var ok=false;
      if(match){
        ok=Object.keys(match.req||{}).every(function(k){return (r[k]||0)>=match.req[k]})&&
           h>=match.minH&&h<=match.maxH;
      }
      return '<div class="style-animation-item '+(ok?'ok':'locked')+'">'+
             '<b>'+esc(label)+'</b><span>'+esc(name)+'</span></div>';
    }).join('');
  }

  /* ---------- Takeovers ---------- */
  function renderStyleTakeovers(style,r){
    var box=el('styleTakeoverRecommendations');
    if(!box)return;
    var prefs=STYLE_TAKEOVERS[style]||STYLE_TAKEOVERS['Équilibré'];
    var defs=window.takeoverDefs||[];
    box.innerHTML=prefs.map(function(name){
      var d=defs.find(function(x){return x[0]===name})||[name,'Three-Point',88];
      var ok=(r[d[1]]||0)>=d[2];
      return '<div class="style-takeover"><div class="to-icon" aria-hidden="true">'+(TAKEOVER_GLYPH[name]||'★')+'</div>'+
             '<b>'+esc(name)+'</b><small>'+esc(d[1])+' ≥ '+d[2]+(ok?' — accessible':' — à atteindre')+'</small></div>';
    }).join('');
  }

  /* ---------- Application d'un style ---------- */
  function applyStyle(style,reset){
    if(window.NBABL_HISTORY)window.NBABL_HISTORY.snapshot();
    var preset=PRESETS[style]||PRESETS['Équilibré'];
    var select=el('style');
    if(select)select.value=style;

    Object.keys(preset.targets).forEach(function(k){
      var v=preset.targets[k];
      if(reset){setAttr(k,v);return}
      var input=inputsList().find(function(x){return x.dataset.name===k});
      if(input&&+input.value<v)setAttr(k,v);
    });

    if(typeof window.setAttributeBaseline==='function')window.setAttributeBaseline(window.NBABL_BASE_ATTRIBUTES||preset.targets);
    if(typeof window.appUpdate==='function')window.appUpdate();

    var r=currentRatings();
    var icon=el('selectedStyleIcon');
    if(icon)icon.innerHTML=STYLE_ICONS[style]||STYLE_ICONS['Équilibré'];
    if(el('selectedStyleName'))el('selectedStyleName').textContent=style;
    if(el('selectedStyleText'))el('selectedStyleText').textContent=preset.text;
    if(el('selectedStyleAttrTitle'))el('selectedStyleAttrTitle').textContent='(optimisés '+style+')';

    renderStyleBadges(style);
    renderStyleAnimations(style,r);
    renderStyleTakeovers(style,r);

    document.querySelectorAll('.style-card').forEach(function(b){
      var active=b.dataset.stylePreset===style;
      b.classList.toggle('active',active);
      b.setAttribute('aria-selected',active?'true':'false');
    });
    if(el('styleAppliedStatus'))el('styleAppliedStatus').textContent='Style appliqué automatiquement';
  }

  function refreshRecommendations(){
    var style=(el('style')||{}).value||'Slasher';
    var r=currentRatings();
    renderStyleBadges(style);
    renderStyleAnimations(style,r);
    renderStyleTakeovers(style,r);
  }

  function boot(){
    document.querySelectorAll('.style-card').forEach(function(b){
      b.addEventListener('click',function(){applyStyle(b.dataset.stylePreset,false)});
    });

    var change=el('changeStyleBtn');
    if(change)change.addEventListener('click',function(){
      var strip=document.querySelector('.style-strip');
      if(!strip)return;
      strip.scrollIntoView({behavior:'smooth',block:'center'});
      var first=strip.querySelector('.style-card');
      if(first)first.focus({preventScroll:true});
    });

    var resetBtn=el('resetStylePreset');
    if(resetBtn)resetBtn.addEventListener('click',function(){
      applyStyle((el('style')||{}).value||'Slasher',true);
    });

    var select=el('style');
    if(select)select.addEventListener('change',function(){applyStyle(select.value,false)});

    inputsList().forEach(function(x){x.addEventListener('input',refreshRecommendations)});
    ['height','weight','wing','position'].forEach(function(id){
      var e=el(id);
      if(e)e.addEventListener('input',refreshRecommendations);
    });

    var viewAll=el('viewAllStyleBadges');
    if(viewAll)viewAll.addEventListener('click',function(){
      var target=el('badges');
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    });

    applyStyle((el('style')||{}).value||'Slasher',true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();

  /* Applique uniquement la couche visuelle d'un style (icône, texte, recommandations)
     sans toucher aux attributs — utilisé par les Signature Blueprints. */
  function applyVisualsOnly(style){
    var preset=PRESETS[style]||PRESETS['Équilibré'];
    var r=currentRatings();
    var icon=el('selectedStyleIcon');
    if(icon)icon.innerHTML=STYLE_ICONS[style]||STYLE_ICONS['Équilibré'];
    if(el('selectedStyleName'))el('selectedStyleName').textContent=style;
    if(el('selectedStyleText'))el('selectedStyleText').textContent=preset.text;
    if(el('selectedStyleAttrTitle'))el('selectedStyleAttrTitle').textContent='(optimisés '+style+')';
    renderStyleBadges(style);
    renderStyleAnimations(style,r);
    renderStyleTakeovers(style,r);
    document.querySelectorAll('.style-card').forEach(function(b){
      var active=b.dataset.stylePreset===style;
      b.classList.toggle('active',active);
      b.setAttribute('aria-selected',active?'true':'false');
    });
  }
  window.NBABL_APPLY_STYLE_VISUALS=applyVisualsOnly;
  window.NBABL_REFRESH_RECO=refreshRecommendations;
  window.NBABL_STYLE_PRESETS=PRESETS;
})();
