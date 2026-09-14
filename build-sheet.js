/* NBA 2K27 Build Lab — Fiche de build
   Reprend ce que my2kbuilds présente le mieux :
   - grille de badges par discipline avec compteur « accessibles / total »
   - jetons et emplacements par discipline
   - guide Cap Breaker ordonné, écrit par le créateur
   - étiquettes de style de jeu et de mode (Park, REC, Pro-Am, 1v1)
   - lien d'import NBA 2K HQ
*/
(function(){
  'use strict';

  function el(id){return document.getElementById(id)}
  var esc=window.escHtml;
  function ratings(){
    var r={};(window.inputs||[]).forEach(function(x){r[x.dataset.name]=+x.value});return r;
  }

  var DISCIPLINES=['Finition','Tir','Création','Défense','Rebond','Physique'];
  var DISC_CLASS={'Finition':'finish','Tir':'shoot','Création':'play','Défense':'defense','Rebond':'rebound','Physique':'physical'};
  var DISC_ICON={'Finition':'◆','Tir':'◎','Création':'◈','Défense':'⛨','Rebond':'◍','Physique':'⬟'};

  /* Les 53 badges de 2K27 rangés par discipline. La catégorie vient de badgeDefs
     quand elle existe, sinon de cette table de repli. */
  var BADGE_DISC={
    'Posterizer':'Finition','Aerial Wizard':'Finition','Physical Finisher':'Finition',
    'Float Game':'Finition','Ghost Stepper':'Finition','Hook Specialist':'Finition',
    'Layup Mixmaster':'Finition','Paint Prodigy':'Finition','Post Powerhouse':'Finition','Post Spin Catalyst':'Finition',
    'Rise Up':'Finition',
    'Limitless Range':'Tir','Deadeye':'Tir','Quick Trigger':'Tir','Set and Fire':'Tir','Arc Cadence':'Tir',
    'Mini Marksman':'Tir','Smooth Operator':'Tir','Static Middy':'Tir',
    'Post Fade Phenom':'Tir',
    'Handles for Days':'Création','Ankle Assassin':'Création','Lightning Launch':'Création','Versatile Visionary':'Création',
    'Pace':'Création','Break Starter':'Création',
    'Dimer':'Création','Unpluckable':'Création','Strong Handle':'Création','Bail Out':'Création',
    'Challenger':'Défense','Glove':'Défense','Interceptor':'Défense','Pick Dodger':'Défense',
    'Immovable Enforcer':'Défense','Paint Patroller':'Défense','Wall Up':'Défense','Off-Ball Pest':'Défense',
    'High-Flying Denier':'Défense','Post Lockdown':'Défense','Ankle Braces':'Défense','Seatbelt':'Défense',
    'Boxout Boss':'Rebond','Crasher':'Rebond','Possession Closer':'Rebond',
    'Sync Snatcher':'Rebond','Breaker':'Rebond',
    'Work Horse':'Physique','Pogo Stick':'Physique','Brick Wall':'Physique','Bruiser':'Physique',
    'Flash':'Physique','Slippery Off-Ball':'Physique'
  };

  var CAT_TO_DISC={
    'Finishing':'Finition','Shooting':'Tir','Playmaking':'Création',
    'Defense':'Défense','Rebounding':'Rebond','Physicals':'Physique',
    'Finition':'Finition','Tir':'Tir','Création':'Création','Défense':'Défense',
    'Rebond':'Rebond','Physique':'Physique'
  };

  function discOf(def){
    return BADGE_DISC[def.name]||CAT_TO_DISC[def.cat]||'Physique';
  }

  /* ---------- 1. Grille de badges par discipline ---------- */
  function tokenPlan(){
    try{
      var raw=localStorage.getItem('nba2k27_tokens_'+
        [el('position').value,el('height').value,el('weight').value,el('wing').value].join('_'));
      if(raw)return JSON.parse(raw);
    }catch(e){}
    try{
      // Repli : ancienne clé du planificateur de jetons
      var keys=Object.keys(localStorage).filter(function(k){return k.indexOf('nba2k27_tokens')===0});
      if(keys.length)return JSON.parse(localStorage.getItem(keys[0])||'{}');
    }catch(e){}
    return {};
  }

  function renderBadgeGrid(){
    var root=el('badgeDisciplineGrid');
    if(!root)return;
    var defs=window.badgeDefs||[];
    var r=ratings();
    var plan=tokenPlan();

    var byDisc={},openCount=0;
    DISCIPLINES.forEach(function(d){byDisc[d]=[]});
    defs.forEach(function(def){
      var st={level:0,tier:'—',cls:'none'};
      try{st=window.badgeTier?window.badgeTier(def,r):st}catch(e){}
      if(st.level>0)openCount++;
      (byDisc[discOf(def)]=byDisc[discOf(def)]||[]).push({def:def,st:st});
    });

    root.innerHTML=DISCIPLINES.map(function(d){
      var items=(byDisc[d]||[]).sort(function(a,b){return b.st.level-a.st.level});
      var reachable=items.filter(function(i){return i.st.level>0}).length;
      var slots=plan[d]||0;
      return '<section class="bg-disc '+DISC_CLASS[d]+'">'+
        '<div class="bg-disc-head">'+
          '<i aria-hidden="true">'+DISC_ICON[d]+'</i>'+
          '<b>'+esc(d)+'</b>'+
          '<span class="bg-count">'+reachable+'/'+items.length+'</span>'+
          '<em class="bg-slots" title="Emplacements planifiés">'+slots+' slot'+(slots>1?'s':'')+'</em>'+
        '</div>'+
        '<div class="bg-items">'+items.map(function(i){
          var locked=i.st.level===0;
          return '<div class="bg-item '+i.st.cls+(locked?' locked':'')+'" '+
                 'title="'+esc(nomBadge(i.def.name))+' ('+esc(i.def.name)+') — '+esc(locked?'non accessible':i.st.tier)+'">'+
                 '<span class="bg-shield" aria-hidden="true"></span>'+
                 '<b>'+nomBadgeHTML(i.def.name)+'</b>'+
                 '<small>'+esc(locked?'✕':i.st.tier)+'</small>'+
                 '</div>';
        }).join('')+'</div>'+
      '</section>';
    }).join('');

    var pill=el('badgeGridSummary');
    if(pill) pill.textContent=openCount+' / '+defs.length+' accessibles';
  }

  /* ---------- 2. Guide Cap Breaker ordonné ---------- */
  var CB_KEY=function(){
    return 'nba2k27_cbguide_'+[el('position').value,el('height').value,el('weight').value,el('wing').value].join('_');
  };

  function cbPlan(){
    try{
      var p=JSON.parse(localStorage.getItem(CB_KEY())||'[]');
      return Array.isArray(p)?p:[];
    }catch(e){return []}
  }
  function saveCB(p){try{localStorage.setItem(CB_KEY(),JSON.stringify(p))}catch(e){}}

  function renderCBGuide(){
    var root=el('cbGuide');
    if(!root)return;
    var plan=cbPlan();
    var names=(window.inputs||[]).map(function(x){return x.dataset.name});
    var caps={};
    try{caps=window.bodyCaps?window.bodyCaps():{}}catch(e){}
    var r=ratings();

    root.innerHTML=
      '<div class="cbg-add">'+
        '<select id="cbgAttr" aria-label="Attribut à faire monter">'+
          names.map(function(n){
            var room=Math.max(0,(caps[n]||99)-(r[n]||0));
            return '<option value="'+esc(n)+'">'+esc(nomAttribut(n))+' ('+(r[n]||0)+' → cap '+(caps[n]||99)+')</option>';
          }).join('')+
        '</select>'+
        '<select id="cbgGain" aria-label="Points gagnés">'+
          [1,2,3,4,5].map(function(v){return '<option value="'+v+'">+'+v+'</option>'}).join('')+
        '</select>'+
        '<button type="button" id="cbgAdd">Ajouter une étape</button>'+
      '</div>'+
      (plan.length?
        '<ol class="cbg-list">'+plan.map(function(s,i){
          return '<li class="cbg-step">'+
            '<span class="cbg-num">CB #'+(i+1)+'</span>'+
            '<b>'+esc(nomAttribut(s.attr))+'</b>'+
            '<em>+'+(+s.gain||1)+'</em>'+
            '<span class="cbg-actions">'+
              (i>0?'<button type="button" data-cbg-up="'+i+'" aria-label="Monter">↑</button>':'')+
              (i<plan.length-1?'<button type="button" data-cbg-down="'+i+'" aria-label="Descendre">↓</button>':'')+
              '<button type="button" data-cbg-del="'+i+'" aria-label="Retirer">×</button>'+
            '</span>'+
          '</li>';
        }).join('')+'</ol>'+
        '<div class="cbg-foot"><b>'+plan.length+'</b> Cap Breakers · <b>+'+
          plan.reduce(function(a,s){return a+(+s.gain||1)},0)+'</b> points au total'+
        '<button type="button" id="cbgClear" class="secondary small-btn">Vider</button></div>'
        :'<div class="empty">Aucune étape. Ajoute les Cap Breakers dans l\u2019ordre où tu conseilles de les appliquer — c\u2019est ce que les autres joueurs liront en premier.</div>');

    var add=el('cbgAdd');
    if(add)add.addEventListener('click',function(){
      var p=cbPlan();
      if(p.length>=25)return;
      p.push({attr:el('cbgAttr').value,gain:+el('cbgGain').value});
      saveCB(p);renderCBGuide();
      if(window.NBABL_COMMUNITY)window.NBABL_COMMUNITY.award('cb_planned');
    });
    root.querySelectorAll('[data-cbg-up]').forEach(function(b){
      b.addEventListener('click',function(){
        var p=cbPlan(),i=+b.dataset.cbgUp;
        var t=p[i];p[i]=p[i-1];p[i-1]=t;saveCB(p);renderCBGuide();
      });
    });
    root.querySelectorAll('[data-cbg-down]').forEach(function(b){
      b.addEventListener('click',function(){
        var p=cbPlan(),i=+b.dataset.cbgDown;
        var t=p[i];p[i]=p[i+1];p[i+1]=t;saveCB(p);renderCBGuide();
      });
    });
    root.querySelectorAll('[data-cbg-del]').forEach(function(b){
      b.addEventListener('click',function(){
        var p=cbPlan();p.splice(+b.dataset.cbgDel,1);saveCB(p);renderCBGuide();
      });
    });
    var clear=el('cbgClear');
    if(clear)clear.addEventListener('click',function(){saveCB([]);renderCBGuide()});
  }

  /* ---------- 3. Étiquettes et identité du build ---------- */
  var META_KEY='nba2k27_buildmeta_v1';
  var MODES=[
    {id:'park',n:'Park (3v3)',icon:'◍'},
    {id:'rec',n:'REC (5v5)',icon:'▣'},
    {id:'proam',n:'Pro-Am',icon:'⛨'},
    {id:'1v1',n:'1v1',icon:'⚡'},
    {id:'mycareer',n:'MyCAREER',icon:'★'}
  ];
  var PLAYSTYLES=['Inside Scorer','Post Scorer','Three-Level Scorer','Shooter','Slasher','Playmaker',
    'Floor General','Lockdown','Rim Protector','Rebounder','Glass Cleaner','All-Around',
    'Athletic','Strong','Fast','Agile','Beginner-Friendly'];

  function meta(){
    try{
      var m=JSON.parse(localStorage.getItem(META_KEY)||'null');
      if(m&&typeof m==='object')return m;
    }catch(e){}
    return {modes:[],tags:[],inspired:'',hq:'',description:''};
  }
  function saveMeta(m){try{localStorage.setItem(META_KEY,JSON.stringify(m))}catch(e){}}

  function renderMeta(){
    var root=el('buildMetaPanel');
    if(!root)return;
    var m=meta();
    root.innerHTML=
      '<label class="bm-field">Description du build'+
        '<textarea id="bmDesc" rows="2" maxlength="400" placeholder="À quoi sert ce build, comment le jouer, ce qu\u2019il sacrifie…">'+esc(m.description)+'</textarea>'+
      '</label>'+
      '<div class="bm-block"><span class="bm-label">Modes conseillés</span>'+
        '<div class="bm-chips">'+MODES.map(function(o){
          var on=m.modes.indexOf(o.id)>=0;
          return '<button type="button" class="bm-chip'+(on?' on':'')+'" data-mode="'+o.id+'" aria-pressed="'+(on?'true':'false')+'">'+
                 '<i aria-hidden="true">'+o.icon+'</i>'+esc(o.n)+'</button>';
        }).join('')+'</div></div>'+
      '<div class="bm-block"><span class="bm-label">Style de jeu <small>(3 maximum)</small></span>'+
        '<div class="bm-chips">'+PLAYSTYLES.map(function(t){
          var on=m.tags.indexOf(t)>=0;
          return '<button type="button" class="bm-chip'+(on?' on':'')+'" data-tag="'+esc(t)+'" aria-pressed="'+(on?'true':'false')+'">'+esc(t)+'</button>';
        }).join('')+'</div></div>'+
      '<label class="bm-field">Inspiré par'+
        '<input id="bmInspired" maxlength="60" value="'+esc(m.inspired)+'" placeholder="Charles Barkley, Sabrina Ionescu…">'+
      '</label>'+
      '<div class="bm-hq">'+
        '<span class="bm-label">Lien d\u2019import NBA 2K HQ</span>'+
        '<p class="bm-hq-note">NBA 2K27 génère un lien de partage depuis l\u2019app NBA 2K HQ. Colle-le ici : le site en fera un QR scannable qui importe le build <strong>directement en jeu</strong>. Ce site ne peut pas fabriquer ce lien lui-même — seul 2K peut le produire.</p>'+
        '<input id="bmHq" value="'+esc(m.hq)+'" placeholder="https://nba.2k.com/nba-2k-hq?playerBuildData=…">'+
        '<div id="bmHqQr" class="bm-hq-qr"></div>'+
      '</div>';

    function commit(){
      saveMeta(m);
      renderTagPreview();
    }
    el('bmDesc').addEventListener('change',function(){m.description=this.value.trim();commit()});
    el('bmInspired').addEventListener('change',function(){m.inspired=this.value.trim();commit();});
    root.querySelectorAll('[data-mode]').forEach(function(b){
      b.addEventListener('click',function(){
        var i=m.modes.indexOf(b.dataset.mode);
        if(i>=0)m.modes.splice(i,1);else m.modes.push(b.dataset.mode);
        commit();renderMeta();
      });
    });
    root.querySelectorAll('[data-tag]').forEach(function(b){
      b.addEventListener('click',function(){
        var i=m.tags.indexOf(b.dataset.tag);
        if(i>=0)m.tags.splice(i,1);
        else{if(m.tags.length>=3)return;m.tags.push(b.dataset.tag)}
        commit();renderMeta();
      });
    });
    var hq=el('bmHq');
    hq.addEventListener('change',function(){
      m.hq=this.value.trim();commit();renderHqQr();
    });
    renderHqQr();
  }

  function renderHqQr(){
    var box=el('bmHqQr');
    if(!box)return;
    var m=meta();
    if(!m.hq){box.innerHTML='';return}
    if(!/^https?:\/\/(www\.)?nba\.2k\.com\//i.test(m.hq)){
      box.innerHTML='<div class="bm-hq-warn">Ce lien ne vient pas de nba.2k.com. Vérifie que tu as bien copié le lien de partage depuis l\u2019app NBA 2K HQ.</div>';
      return;
    }
    try{
      box.innerHTML='<div class="bm-hq-ok">'+
        window.NBABL_QR.toSVG(m.hq,{quiet:3})+
        '<p>Scanne ce code dans NBA 2K HQ pour importer le build en jeu.</p></div>';
    }catch(e){
      box.innerHTML='<div class="bm-hq-warn">Lien trop long pour un QR ('+e.message+'). Partage le lien tel quel.</div>';
    }
  }

  function renderTagPreview(){
    var box=el('buildTagPreview');
    if(!box)return;
    var m=meta();
    var chips=[]
      .concat(m.tags.map(function(t){return {c:'tag',t:t}}))
      .concat(m.modes.map(function(id){
        var o=MODES.filter(function(x){return x.id===id})[0];
        return {c:'mode',t:o?o.n:id};
      }));
    if(m.inspired)chips.push({c:'inspired',t:'Inspiré par '+m.inspired});
    box.hidden=!chips.length;
    box.innerHTML=chips.map(function(c){
      return '<span class="bd-tag '+c.c+'">'+esc(c.t)+'</span>';
    }).join('');
  }

  /* ---------- Amorçage ---------- */
  function refresh(){
    renderBadgeGrid();
    renderCBGuide();
    renderTagPreview();
  }

  function boot(){
    renderMeta();
    refresh();
    var t=null;
    (window.inputs||[]).forEach(function(x){
      x.addEventListener('input',function(){
        clearTimeout(t);t=setTimeout(renderBadgeGrid,220);
      });
    });
    ['position','height','weight','wing'].forEach(function(id){
      var e=el(id);
      if(e)e.addEventListener('change',refresh);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();

  window.NBABL_SHEET={refresh:refresh,meta:meta,cbPlan:cbPlan,modes:MODES,playstyles:PLAYSTYLES};
})();
