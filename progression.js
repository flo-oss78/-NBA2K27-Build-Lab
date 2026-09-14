/* NBA 2K27 Build Lab — Systèmes de progression
   Reproduit la structure annoncée par 2K pour NBA 2K27 :
   - Badge Loadouts : plusieurs combinaisons de badges, échangeables avant le match
   - Synergy : 16 slots répartis entre Fuse Badges et Reaction Badges, jusqu'au tier Legend
   - Takeover : 5 emplacements, chacun avec un perk Accelerator / Longevity / Overdrive
   - Spécialisation : 10 quêtes par discipline, +1 slot de Synergy permanent au niveau 10

   Les seuils et coûts restent le modèle indicatif du site : 2K ne publie pas ses tables.
*/
(function(){
  'use strict';

  var DISCIPLINES=['Finition','Tir','Création','Défense','Rebond','Physique'];
  var DISC_CLASS={'Finition':'finish','Tir':'shoot','Création':'play','Défense':'defense','Rebond':'rebound','Physique':'physical'};

  var SYNERGY_BASE=16;           // 16 slots, Fuse + Reaction
  var TAKEOVER_SLOTS=5;
  var PERKS=[
    {id:'accelerator',n:'Accelerator',d:'Remplit la jauge de Takeover plus vite.'},
    {id:'longevity',  n:'Longevity',  d:'Prolonge la durée de la capacité active.'},
    {id:'overdrive',  n:'Overdrive',  d:'Augmente les bonus d\u2019attributs accordés.'}
  ];

  var QUESTS={
    'Finition':['Marquer 50 points dans la peinture','Réussir 25 dunks en pénétration','Réussir 15 layups au contact','Marquer 10 fois après un écran','Réussir 20 finitions main faible','Marquer 30 points en transition','Réussir 10 alley-oops','Réussir 25 tirs au poste','Prendre 40 fautes en attaquant','Marquer 500 points au total'],
    'Tir':['Rentrer 50 tirs à 3 points','Rentrer 25 tirs en catch and shoot','Rentrer 20 tirs en sortie de dribble','Rentrer 15 tirs contestés','Rentrer 30 tirs à mi-distance','Rentrer 10 tirs de très loin','Réussir 40 lancers francs','Rentrer 5 tirs décisifs','Terminer 10 matchs à 50% ou plus','Rentrer 200 tirs au total'],
    'Création':['Délivrer 50 passes décisives','Réussir 25 passes lob','Provoquer 20 franchissements de cheville','Terminer 10 matchs sans perte de balle','Délivrer 15 assists en transition','Réussir 30 pick and roll','Délivrer 5 matchs à 10 assists','Réussir 40 dribbles gagnants','Créer 25 tirs ouverts','Délivrer 300 assists au total'],
    'Défense':['Réussir 25 interceptions','Réussir 25 contres','Forcer 20 pertes de balle','Défendre 30 tirs contestés','Passer 40 écrans sans retard','Tenir un joueur sous 30% de réussite','Réussir 10 charges provoquées','Défendre 15 pick and roll','Terminer 5 matchs à 5 stops','Cumuler 200 actions défensives'],
    'Rebond':['Prendre 50 rebonds défensifs','Prendre 25 rebonds offensifs','Réussir 15 putbacks','Prendre 10 rebonds sur un même match','Réussir 30 box outs','Prendre 20 rebonds en contestation','Enchaîner 5 matchs à 10 rebonds','Prendre 15 rebonds en transition','Réussir 10 tip-ins','Cumuler 400 rebonds'],
    'Physique':['Courir 20 km en match','Terminer 10 matchs sans fatigue critique','Gagner 30 duels de force','Réussir 25 sprints en contre-attaque','Tenir 40 minutes sur un match','Gagner 20 positions au poste','Réussir 15 blocs en verticalité','Enchaîner 5 matchs complets','Gagner 50 duels physiques','Cumuler 100 actions athlétiques']
  };

  /* Badges éligibles à la Synergy, par rôle.
     Fuse = badge renforcé en permanence ; Reaction = badge déclenché par une situation. */
  // Uniquement des badges de NBA 2K27 : Precision Dunker, Slithery, Agent 3,
  // Rebound Chaser, Green Machine, Killer Combos et Speed Booster étaient des
  // badges de 2K26, absents du jeu.
  var FUSE_POOL=['Posterizer','Aerial Wizard','Physical Finisher',
    'Limitless Range','Deadeye','Quick Trigger','Set and Fire',
    'Handles for Days','Ankle Assassin','Versatile Visionary','Pace',
    'Challenger','Glove','Interceptor','Pick Dodger','Immovable Enforcer',
    'Boxout Boss','Brick Wall','Paint Patroller','Wall Up','Rise Up',
    'Work Horse','Pogo Stick'];
  var REACTION_POOL=['Lightning Launch',
    'Float Game','Ghost Stepper','Hook Specialist','Post Spin Catalyst','Layup Mixmaster',
    'Paint Prodigy','Post Powerhouse','Arc Cadence','Mini Marksman','Smooth Operator',
    'Static Middy','Post Fade Phenom'];

  /* Badges dont NBA2KLab a publié un test. Les autres sont « test en attente » chez eux :
     on le signale au lieu de présenter toutes les valeurs avec la même autorité. */
  var TESTED=['Deadeye','Limitless Range','Quick Trigger','Set and Fire',
    'Challenger','Glove','Interceptor','Pick Dodger','Handles for Days','Ankle Assassin',
    'Posterizer','Physical Finisher','Boxout Boss','Immovable Enforcer'];

  function el(id){return document.getElementById(id)}
  var esc=window.escHtml;

  function sig(){
    try{
      return [el('position').value,el('height').value,el('weight').value,el('wing').value].join('_');
    }catch(e){return 'default'}
  }
  function read(key,fallback){
    try{
      var raw=localStorage.getItem(key);
      return raw?JSON.parse(raw):fallback;
    }catch(e){return fallback}
  }
  function write(key,val){
    try{localStorage.setItem(key,JSON.stringify(val))}catch(e){}
  }

  /* ================= 1. Badge Loadouts ================= */
  var LOADOUT_KEY=function(){return 'nba2k27_loadouts_'+sig()};
  var MAX_LOADOUTS=4, SLOTS_PER_LOADOUT=20;

  function loadouts(){
    var l=read(LOADOUT_KEY(),null);
    if(!l||!l.items||!l.items.length){
      l={active:0,items:[{name:'Principal',badges:[]}]};
      write(LOADOUT_KEY(),l);
    }
    return l;
  }

  function accessibleBadges(){
    var defs=window.badgeDefs||[];
    // ratings() (app.js) lit les curseurs, ou le dernier build quand la page n'en a pas (/progression/).
    var r=typeof ratings==='function'?ratings():{};
    return defs.map(function(d){
      var st={level:0,tier:'—',cls:'none'};
      try{st=window.badgeTier?window.badgeTier(d,r):st}catch(e){}
      return {name:d.name,cat:d.cat,level:st.level,tier:st.tier,cls:st.cls};
    }).filter(function(b){return b.level>0}).sort(function(a,b){return b.level-a.level});
  }

  function renderLoadouts(){
    var root=el('loadoutPanel');
    if(!root)return;
    var l=loadouts();
    var avail=accessibleBadges();
    var active=l.items[l.active]||l.items[0];
    active.badges=active.badges.filter(function(n){
      return avail.some(function(b){return b.name===n});
    });

    var tabs=l.items.map(function(it,i){
      return '<button type="button" class="lo-tab'+(i===l.active?' active':'')+'" data-lo="'+i+'">'+
             esc(it.name)+'<small>'+it.badges.length+'/'+SLOTS_PER_LOADOUT+'</small></button>';
    }).join('');
    if(l.items.length<MAX_LOADOUTS)tabs+='<button type="button" class="lo-tab lo-add" id="loAdd">+ Loadout</button>';

    var chips=avail.length?avail.map(function(b){
      var on=active.badges.indexOf(b.name)>=0;
      var tested=TESTED.indexOf(b.name)>=0;
      return '<button type="button" class="lo-chip '+b.cls+(on?' on':'')+'" data-badge="'+esc(b.name)+'"'+
             ' aria-pressed="'+(on?'true':'false')+'">'+
             '<span>'+nomBadgeHTML(b.name)+'</span><small>'+esc(b.tier)+'</small>'+
             (tested?'<i class="lo-tested" title="Testé par NBA2KLab">✓</i>':'<i class="lo-untested" title="Test NBA2KLab en attente">·</i>')+
             '</button>';
    }).join(''):'<div class="empty">Aucun badge accessible avec ce build. Monte des attributs pour débloquer des badges.</div>';

    root.innerHTML=
      '<div class="lo-tabs">'+tabs+'</div>'+
      '<div class="lo-head">'+
        '<input id="loName" value="'+esc(active.name)+'" maxlength="22" aria-label="Nom du loadout">'+
        '<span class="lo-count"><b>'+active.badges.length+'</b> / '+SLOTS_PER_LOADOUT+' slots</span>'+
        (l.items.length>1?'<button type="button" class="secondary small-btn" id="loDelete">Supprimer</button>':'')+
      '</div>'+
      '<p class="lo-hint">Les emplacements sont remplis avec des Badge Tokens gagnés en match. Prépare plusieurs loadouts et change avant l\u2019engagement selon l\u2019adversaire.</p>'+
      '<div class="lo-chips">'+chips+'</div>';

    root.querySelectorAll('[data-lo]').forEach(function(b){
      b.addEventListener('click',function(){l.active=+b.dataset.lo;write(LOADOUT_KEY(),l);renderLoadouts()});
    });
    var add=el('loAdd');
    if(add)add.addEventListener('click',function(){
      l.items.push({name:'Loadout '+(l.items.length+1),badges:[]});
      l.active=l.items.length-1;write(LOADOUT_KEY(),l);renderLoadouts();
    });
    var del=el('loDelete');
    if(del)del.addEventListener('click',function(){
      l.items.splice(l.active,1);l.active=0;write(LOADOUT_KEY(),l);renderLoadouts();
    });
    var name=el('loName');
    if(name)name.addEventListener('change',function(){
      active.name=name.value.trim()||'Loadout';write(LOADOUT_KEY(),l);renderLoadouts();
    });
    // Bascule en place : re-rendre toute la liste ferait perdre la position de
    // défilement et le focus à chaque badge coché.
    root.querySelectorAll('[data-badge]').forEach(function(b){
      b.addEventListener('click',function(){
        var n=b.dataset.badge,i=active.badges.indexOf(n);
        if(i>=0)active.badges.splice(i,1);
        else{
          if(active.badges.length>=SLOTS_PER_LOADOUT)return;
          active.badges.push(n);
        }
        b.classList.toggle('on',active.badges.indexOf(n)>=0);
        b.setAttribute('aria-pressed',active.badges.indexOf(n)>=0?'true':'false');
        var counter=root.querySelector('.lo-count b');
        if(counter)counter.textContent=active.badges.length;
        var tab=root.querySelector('.lo-tab.active small');
        if(tab)tab.textContent=active.badges.length+'/'+SLOTS_PER_LOADOUT;
        write(LOADOUT_KEY(),l);
        renderSynergy();
      });
    });
  }

  /* ================= 2. Synergy : Fuse + Reaction ================= */
  var SYN_KEY=function(){return 'nba2k27_synergy_'+sig()};

  function synergyState(){
    return read(SYN_KEY(),{fuse:[],reaction:[]});
  }
  function synergySlots(){
    // +1 slot permanent par piste de spécialisation terminée (niveau 10)
    var q=questState(),bonus=0;
    DISCIPLINES.forEach(function(d){if((q[d]||[]).filter(Boolean).length>=10)bonus++});
    return {total:SYNERGY_BASE+bonus,bonus:bonus,fuse:Math.ceil((SYNERGY_BASE+bonus)/2),reaction:Math.floor((SYNERGY_BASE+bonus)/2)};
  }

  function renderSynergy(){
    var root=el('synergyPlanner');
    if(!root)return;
    var st=synergyState(),slots=synergySlots();
    var equipped=(function(){
      var l=loadouts();var a=l.items[l.active]||l.items[0];return a.badges;
    })();

    st.fuse=st.fuse.filter(function(n){return equipped.indexOf(n)>=0});
    st.reaction=st.reaction.filter(function(n){return equipped.indexOf(n)>=0});

    function pool(kind,list,max,available){
      var used=list.length;
      return '<div class="syn-col syn-'+kind+'">'+
        '<div class="syn-col-head"><b>'+(kind==='fuse'?'Fuse Badges':'Reaction Badges')+'</b>'+
        '<span>'+used+' / '+max+'</span></div>'+
        '<p class="syn-col-desc">'+(kind==='fuse'
          ? 'Renfort permanent : le badge dépasse son potentiel de base.'
          : 'Déclenché par une situation de jeu, jusqu\u2019au tier Legend.')+'</p>'+
        (available.length?available.map(function(n){
          var on=list.indexOf(n)>=0;
          return '<button type="button" class="syn-chip'+(on?' on':'')+'" data-syn="'+kind+'" data-name="'+esc(n)+'" title="'+esc(n)+'"'+
                 ' aria-pressed="'+(on?'true':'false')+'">'+esc(nomBadge(n))+'</button>';
        }).join(''):'<div class="empty">Équipe d\u2019abord des badges dans ton loadout.</div>')+
      '</div>';
    }

    var fuseAvail=equipped.filter(function(n){return FUSE_POOL.indexOf(n)>=0});
    var reactAvail=equipped.filter(function(n){return REACTION_POOL.indexOf(n)>=0});

    var filled=st.fuse.length+st.reaction.length;
    var pct=Math.round(filled/slots.total*100);

    root.innerHTML=
      '<div class="syn-summary">'+
        '<div><b>'+filled+' / '+slots.total+'</b><span>slots de Synergy utilisés</span></div>'+
        (slots.bonus?'<div class="syn-bonus">+'+slots.bonus+' slot'+(slots.bonus>1?'s':'')+' gagné'+(slots.bonus>1?'s':'')+' en spécialisation</div>':'')+
      '</div>'+
      '<i class="syn-bar"><em style="width:'+pct+'%"></em></i>'+
      '<div class="syn-cols">'+pool('fuse',st.fuse,slots.fuse,fuseAvail)+pool('reaction',st.reaction,slots.reaction,reactAvail)+'</div>';

    root.querySelectorAll('[data-syn]').forEach(function(b){
      b.addEventListener('click',function(){
        var kind=b.dataset.syn,n=b.dataset.name,list=st[kind];
        var max=kind==='fuse'?slots.fuse:slots.reaction;
        var i=list.indexOf(n);
        if(i>=0)list.splice(i,1);
        else{if(list.length>=max)return;list.push(n)}
        write(SYN_KEY(),st);renderSynergy();
      });
    });
  }

  /* ================= 3. Takeover : 5 slots + perks ================= */
  var TK_KEY=function(){return 'nba2k27_takeover_'+sig()};

  function takeoverState(){
    var s=read(TK_KEY(),null);
    if(!s||!s.slots)s={slots:[null,null,null,null,null]};
    return s;
  }

  function renderTakeoverLoadout(){
    var root=el('takeoverLoadout');
    if(!root)return;
    var st=takeoverState();
    var defs=window.takeoverDefs||[];
    // ratings() (app.js) lit les curseurs, ou le dernier build quand la page n'en a pas (/progression/).
    var r=typeof ratings==='function'?ratings():{};

    var options=defs.map(function(d){
      return {name:d[0],attr:d[1],need:d[2],ok:(r[d[1]]||0)>=d[2]};
    });

    root.innerHTML=st.slots.map(function(slot,i){
      var chosen=slot&&slot.takeover;
      var def=options.filter(function(o){return o.name===chosen})[0];
      return '<div class="tk-slot'+(chosen?' filled':'')+'">'+
        '<div class="tk-slot-head"><span>Slot '+(i+1)+'</span>'+
        (def?'<em class="'+(def.ok?'ok':'locked')+'">'+esc(def.attr)+' ≥ '+def.need+'</em>':'')+'</div>'+
        '<select data-tk="'+i+'" aria-label="Takeover du slot '+(i+1)+'">'+
          '<option value="">— Vide —</option>'+
          options.map(function(o){
            return '<option value="'+esc(o.name)+'"'+(o.name===chosen?' selected':'')+'>'+
                   esc(o.name)+(o.ok?'':' (à atteindre)')+'</option>';
          }).join('')+
        '</select>'+
        (chosen?'<div class="tk-perks">'+PERKS.map(function(p){
          var on=slot.perk===p.id;
          return '<button type="button" class="tk-perk'+(on?' on':'')+'" data-perk="'+i+'" data-pid="'+p.id+'"'+
                 ' title="'+esc(p.d)+'" aria-pressed="'+(on?'true':'false')+'">'+esc(p.n)+'</button>';
        }).join('')+'</div>':'')+
      '</div>';
    }).join('');

    root.querySelectorAll('[data-tk]').forEach(function(sel){
      sel.addEventListener('change',function(){
        var i=+sel.dataset.tk;
        st.slots[i]=sel.value?{takeover:sel.value,perk:(st.slots[i]&&st.slots[i].perk)||'accelerator'}:null;
        write(TK_KEY(),st);renderTakeoverLoadout();
      });
    });
    root.querySelectorAll('[data-perk]').forEach(function(b){
      b.addEventListener('click',function(){
        var i=+b.dataset.perk;
        if(!st.slots[i])return;
        st.slots[i].perk=b.dataset.pid;
        write(TK_KEY(),st);renderTakeoverLoadout();
      });
    });
  }

  /* ================= 4. Quêtes de spécialisation ================= */
  var QUEST_KEY='nba2k27_quests_v1';

  function questState(){
    var q=read(QUEST_KEY,{});
    DISCIPLINES.forEach(function(d){
      if(!Array.isArray(q[d])||q[d].length!==10)q[d]=new Array(10).fill(false);
    });
    return q;
  }

  var openTrack=null;

  function renderQuests(){
    var root=el('questTracks');
    if(!root)return;
    var q=questState();
    root.innerHTML=DISCIPLINES.map(function(d){
      var done=q[d].filter(Boolean).length;
      var pct=done*10;
      var isOpen=openTrack===d;
      return '<div class="quest-track '+DISC_CLASS[d]+(done>=10?' complete':'')+'">'+
        '<button type="button" class="quest-head" data-track="'+d+'" aria-expanded="'+(isOpen?'true':'false')+'">'+
          '<b>'+esc(d)+'</b>'+
          '<span class="quest-level">Niv. '+done+'</span>'+
          '<i class="quest-bar"><em style="width:'+pct+'%"></em></i>'+
          (done>=10?'<em class="quest-reward">+1 slot Synergy</em>':'<em class="quest-reward muted">'+(10-done)+' restantes</em>')+
        '</button>'+
        (isOpen?'<ol class="quest-list">'+QUESTS[d].map(function(label,i){
          return '<li><label><input type="checkbox" data-q="'+d+'" data-i="'+i+'"'+(q[d][i]?' checked':'')+'> '+esc(label)+'</label></li>';
        }).join('')+'</ol>':'')+
      '</div>';
    }).join('');

    var totalDone=DISCIPLINES.reduce(function(s,d){return s+q[d].filter(Boolean).length},0);
    var pill=el('questProgress');
    if(pill)pill.textContent=totalDone+' / 60 quêtes';

    root.querySelectorAll('[data-track]').forEach(function(b){
      b.addEventListener('click',function(){
        openTrack=openTrack===b.dataset.track?null:b.dataset.track;
        renderQuests();
      });
    });
    root.querySelectorAll('[data-q]').forEach(function(cb){
      cb.addEventListener('change',function(){
        q[cb.dataset.q][+cb.dataset.i]=cb.checked;
        write(QUEST_KEY,q);renderQuests();renderSynergy();
      });
    });
  }

  /* ================= Amorçage ================= */
  function renderAll(){
    renderLoadouts();
    renderSynergy();
    renderTakeoverLoadout();
    renderQuests();
  }

  function boot(){
    renderAll();
    ['position','height','weight','wing'].forEach(function(id){
      var e=el(id);
      if(e)e.addEventListener('change',renderAll);
    });
    (window.inputs||[]).forEach(function(x){
      x.addEventListener('change',function(){renderLoadouts();renderTakeoverLoadout()});
    });
    var reset=el('questReset');
    if(reset)reset.addEventListener('click',function(){
      if(!confirm('Remettre toutes les quêtes à zéro ?'))return;
      localStorage.removeItem(QUEST_KEY);renderQuests();renderSynergy();
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();

  window.NBABL_PROGRESSION={
    refresh:renderAll,
    tested:TESTED,
    activeLoadout:function(){var l=loadouts();return l.items[l.active]||l.items[0]},
    takeovers:takeoverState,
    perks:PERKS
  };
})();
