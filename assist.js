/* NBA 2K27 Build Lab — Assistance
   - Assistant en 3 questions pour ceux qui n'ont jamais ouvert le builder 2K
   - Historique annuler / rétablir sur toutes les modifications de build
   - Build de la semaine, calculé depuis le hub communautaire
*/
(function(){
  'use strict';

  function el(id){return document.getElementById(id)}
  var esc=window.escHtml;

  /* ================= 1. Historique annuler / rétablir ================= */
  var past=[],future=[],MAX=40,suspended=false;

  function snapshotObj(){
    var o={
      position:el('position').value,height:el('height').value,weight:el('weight').value,
      wing:el('wing').value,style:el('style').value,
      hand:el('dominantHand')?el('dominantHand').value:'Droite',attrs:{}
    };
    (window.inputs||[]).forEach(function(x){o.attrs[x.dataset.name]=x.value});
    return o;
  }
  function restore(o){
    suspended=true;
    el('position').value=o.position;
    el('height').value=o.height;
    el('weight').value=o.weight;
    el('wing').value=o.wing;
    el('style').value=o.style;
    if(el('dominantHand'))el('dominantHand').value=o.hand;
    (window.inputs||[]).forEach(function(x){
      if(o.attrs[x.dataset.name]!=null)x.value=o.attrs[x.dataset.name];
    });
    if(window.appUpdate)window.appUpdate();
    if(window.NBABL_APPLY_STYLE_VISUALS)window.NBABL_APPLY_STYLE_VISUALS(o.style);
    if(window.NBABL_PROGRESSION)window.NBABL_PROGRESSION.refresh();
    // La fiche de build (grille de badges, guide Cap Breaker) ne se réactualise
    // que sur 'input'/'change' : une restauration par affectation .value= ne les
    // déclenche pas, il faut donc la rafraîchir explicitement ici aussi.
    if(window.NBABL_SHEET)window.NBABL_SHEET.refresh();
    suspended=false;
    renderHistoryButtons();
  }
  function snapshot(){
    if(suspended)return;
    var s=JSON.stringify(snapshotObj());
    if(past.length&&past[past.length-1]===s)return;
    past.push(s);
    if(past.length>MAX)past.shift();
    future.length=0;
    renderHistoryButtons();
  }
  function undo(){
    if(!past.length)return;
    future.push(JSON.stringify(snapshotObj()));
    restore(JSON.parse(past.pop()));
  }
  function redo(){
    if(!future.length)return;
    past.push(JSON.stringify(snapshotObj()));
    restore(JSON.parse(future.pop()));
  }
  function renderHistoryButtons(){
    var u=el('undoBtn'),r=el('redoBtn');
    if(u)u.disabled=!past.length;
    if(r)r.disabled=!future.length;
  }

  /* Un instantané est pris au début d'une interaction, pas à chaque pixel du slider. */
  function wireHistory(){
    var pending=false;
    function begin(){
      if(pending||suspended)return;
      pending=true;snapshot();
      setTimeout(function(){pending=false},400);
    }
    (window.inputs||[]).forEach(function(x){
      x.addEventListener('pointerdown',begin);
      x.addEventListener('keydown',begin);
    });
    ['position','height','weight','wing','style','dominantHand'].forEach(function(id){
      var e=el(id);
      if(!e)return;
      e.addEventListener('pointerdown',begin);
      e.addEventListener('keydown',begin);
      e.addEventListener('focus',begin);
    });
    document.addEventListener('click',function(e){
      if(e.target.closest('.attr-step,#optimize,#reset,#resetStylePreset,#cbAutoPlan,#cbClearPlan'))begin();
    },true);
    document.addEventListener('keydown',function(e){
      if(!(e.ctrlKey||e.metaKey))return;
      var k=e.key.toLowerCase();
      if(k==='z'&&!e.shiftKey){e.preventDefault();undo()}
      else if((k==='z'&&e.shiftKey)||k==='y'){e.preventDefault();redo()}
    });
    var u=el('undoBtn'),r=el('redoBtn');
    if(u)u.addEventListener('click',undo);
    if(r)r.addEventListener('click',redo);
    renderHistoryButtons();
  }

  /* ================= 2. Assistant en 3 questions ================= */
  var WIZ_KEY='nba2k27_wizard_done';

  var Q=[
    {id:'role',q:'Tu veux faire quoi sur le terrain ?',opts:[
      {v:'score',l:'Marquer',d:'Être la première option en attaque'},
      {v:'create',l:'Créer',d:'Faire jouer les autres, dribbler'},
      {v:'defend',l:'Défendre',d:'Gêner, intercepter, contrer'},
      {v:'paint',l:'Dominer la peinture',d:'Rebonds et finition au cercle'}
    ]},
    {id:'range',q:'Tu marques d\u2019où, surtout ?',opts:[
      {v:'three',l:'De loin',d:'Tir à 3 points'},
      {v:'mid',l:'À mi-distance',d:'Tir en sortie de dribble'},
      {v:'rim',l:'Au cercle',d:'Pénétrations et dunks'},
      {v:'post',l:'Au poste',d:'Dos au panier'}
    ]},
    {id:'size',q:'Quel gabarit te va ?',opts:[
      {v:'small',l:'Petit et rapide',d:'Moins de 6\'5"'},
      {v:'wing',l:'Ailier polyvalent',d:'6\'5" à 6\'9"'},
      {v:'big',l:'Grand',d:'6\'10" et plus'}
    ]}
  ];

  /* Chaque combinaison pointe vers un blueprint de la bibliothèque. */
  function recommend(a){
    var BP=(window.NBABL_BLUEPRINTS&&window.NBABL_BLUEPRINTS.list)||[];
    var wantDisc={score:a.range==='three'?'Tir':a.range==='rim'||a.range==='post'?'Finition':'Tir',
                  create:'Création',defend:'Défense',paint:a.range==='post'?'Finition':'Rebond'}[a.role];
    var wantPos={small:['PG','SG'],wing:['SG','SF'],big:['PF','C']}[a.size]||['SF'];
    var rangeAttr={three:'Three-Point',mid:'Mid-Range',rim:'Driving Dunk',post:'Post Control'}[a.range];

    var scored=BP.map(function(b){
      var s=0;
      if(b.disc===wantDisc)s+=40;
      if(wantPos.indexOf(b.pos)>=0)s+=30;
      if(b.a[rangeAttr])s+=Math.min(25,(b.a[rangeAttr]-70)/1.2);
      if(a.size==='small'&&b.h<=77)s+=10;
      if(a.size==='big'&&b.h>=81)s+=10;
      if(a.size==='wing'&&b.h>=78&&b.h<=81)s+=10;
      return {b:b,s:s};
    }).sort(function(x,y){return y.s-x.s});
    return scored.slice(0,3).map(function(x){return x.b});
  }

  var step=0,answers={};

  function openWizard(){
    step=0;answers={};
    renderWizard();
  }

  function renderWizard(){
    var modal=el('buildModal'),body=el('buildModalContent');
    if(!modal||!body)return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');

    if(step<Q.length){
      var q=Q[step];
      body.innerHTML=
        '<div class="modal-kicker">Assistant — question '+(step+1)+' sur '+Q.length+'</div>'+
        '<h2>'+esc(q.q)+'</h2>'+
        '<div class="wiz-opts">'+q.opts.map(function(o){
          return '<button type="button" class="wiz-opt" data-v="'+esc(o.v)+'">'+
                 '<b>'+esc(o.l)+'</b><span>'+esc(o.d)+'</span></button>';
        }).join('')+'</div>'+
        '<div class="wiz-nav">'+
          (step>0?'<button type="button" class="secondary small-btn" id="wizBack">Retour</button>':'')+
          '<button type="button" class="secondary small-btn" id="wizSkip">Passer l\u2019assistant</button>'+
        '</div>';
      body.querySelectorAll('.wiz-opt').forEach(function(b){
        b.addEventListener('click',function(){
          answers[q.id]=b.dataset.v;step++;renderWizard();
        });
      });
      var back=el('wizBack');
      if(back)back.addEventListener('click',function(){step--;renderWizard()});
      el('wizSkip').addEventListener('click',closeWizard);
      return;
    }

    var picks=recommend(answers);
    body.innerHTML=
      '<div class="modal-kicker">Assistant</div>'+
      '<h2>Trois builds pour toi</h2>'+
      '<p class="sub">Chaque blueprint mélange trois joueurs réels. Choisis-en un : tous les attributs, badges et animations sont réglés automatiquement, et tu peux tout ajuster ensuite.</p>'+
      '<div class="wiz-picks">'+picks.map(function(b){
        return '<button type="button" class="wiz-pick" data-bp="'+esc(b.id)+'">'+
          '<b>'+esc(b.n)+'</b>'+
          '<span class="wiz-tri">'+esc(b.tri.join(' + '))+'</span>'+
          '<span class="wiz-desc">'+esc(b.d)+'</span>'+
        '</button>';
      }).join('')+'</div>'+
      '<div class="wiz-nav">'+
        '<button type="button" class="secondary small-btn" id="wizRestart">Recommencer</button>'+
        '<button type="button" class="secondary small-btn" id="wizSkip">Fermer</button>'+
      '</div>';
    body.querySelectorAll('[data-bp]').forEach(function(b){
      b.addEventListener('click',function(){
        closeWizard();
        if(window.NBABL_BLUEPRINTS)window.NBABL_BLUEPRINTS.apply(b.dataset.bp);
      });
    });
    el('wizRestart').addEventListener('click',openWizard);
    el('wizSkip').addEventListener('click',closeWizard);
  }

  function closeWizard(){
    var modal=el('buildModal');
    if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
    try{localStorage.setItem(WIZ_KEY,'1')}catch(e){}
  }

  /* ================= 3. Build de la semaine ================= */
  function renderFeatured(){
    var box=el('featuredBuild');
    if(!box)return;
    var builds=[];
    // window.NBABL_SERVER n'est jamais défini par server-client.js : ce n'était
    // qu'un chemin mort. Le hub local (fusionné avec le serveur par
    // mergeServerBuilds) reste la seule source réellement alimentée.
    try{ builds=JSON.parse(localStorage.getItem('nba2k27_build_hub_v19')||'[]'); }catch(e){builds=[]}
    if(!Array.isArray(builds)||!builds.length){
      box.hidden=true;return;
    }
    var weekAgo=Date.now()-7*24*3600*1000;
    var pool=builds.filter(function(b){
      var t=b.createdAt||b.created_at||0;
      if(typeof t==='string')t=Date.parse(t)||0;
      return t>=weekAgo;
    });
    if(!pool.length)pool=builds;
    pool=pool.slice().sort(function(a,b){
      return ((b.likes||0)*3+(b.views||0))-((a.likes||0)*3+(a.views||0));
    });
    var top=pool[0];
    if(!top||(!top.likes&&!top.views)){box.hidden=true;return}
    box.hidden=false;
    box.innerHTML=
      '<div class="feat-flag">Build de la semaine</div>'+
      '<h3>'+esc(top.name||'Build communautaire')+'</h3>'+
      '<p>'+esc([top.position,top.style].filter(Boolean).join(' • '))+'</p>'+
      '<div class="feat-stats"><span><b>'+(top.likes||0)+'</b> j\u2019aime</span>'+
      '<span><b>'+(top.views||0)+'</b> vues</span></div>';
  }

  /* ================= Amorçage ================= */
  function boot(){
    wireHistory();

    var start=el('startWizard');
    if(start)start.addEventListener('click',openWizard);
    // Le bandeau « Par où commencer ? » du mode simple ouvre le même assistant.
    document.querySelectorAll('[data-ouvrir-assistant]').forEach(function(b){
      b.addEventListener('click',openWizard);
    });

    var first=false;
    try{first=!localStorage.getItem(WIZ_KEY)}catch(e){}
    var hasCode=/[?&]c=/.test(location.search);
    if(first&&!hasCode){
      var banner=el('wizardBanner');
      if(banner)banner.hidden=false;
      var dismiss=el('wizardDismiss');
      if(dismiss)dismiss.addEventListener('click',function(){
        banner.hidden=true;
        try{localStorage.setItem(WIZ_KEY,'1')}catch(e){}
      });
    }

    setTimeout(renderFeatured,1500);
    setTimeout(renderFeatured,5000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();

  window.NBABL_HISTORY={snapshot:snapshot,undo:undo,redo:redo};
  window.NBABL_WIZARD={open:openWizard};
})();
