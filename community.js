/* NBA 2K27 Build Lab — Couche communautaire et progression du joueur
   Inspiré de ce que my2kbuilds fait bien : onglets Featured / Latest / Trending / Top,
   XP et niveaux, tableau des meilleurs contributeurs, badges de qualité.
   Tout est calculé localement à partir du hub : aucun compte à créer.
*/
(function(){
  'use strict';

  function el(id){return document.getElementById(id)}
  var esc=window.escHtml;

  /* ================= 1. XP et niveaux ================= */
  var XP_KEY='nba2k27_xp_v1';

  var XP_EVENTS={
    build_saved:{xp:15,label:'Build sauvegardé'},
    build_published:{xp:60,label:'Build publié'},
    blueprint_used:{xp:10,label:'Trio appliqué'},
    loadout_created:{xp:20,label:'Loadout créé'},
    synergy_filled:{xp:25,label:'Synergy planifiée'},
    quest_done:{xp:8,label:'Quête cochée'},
    cb_planned:{xp:12,label:'Cap Breakers planifiés'},
    shared:{xp:18,label:'Build partagé'},
    compared:{xp:10,label:'Builds comparés'}
  };

  /* Progression volontairement lente au début puis plus plate : on récompense
     l'exploration réelle du builder, pas le spam de clics. */
  var LEVELS=[
    {lvl:1,xp:0,   title:'Rookie'},
    {lvl:2,xp:60,  title:'Prospect'},
    {lvl:3,xp:160, title:'Role Player'},
    {lvl:4,xp:320, title:'Starter'},
    {lvl:5,xp:560, title:'Sixth Man'},
    {lvl:6,xp:900, title:'All-Star'},
    {lvl:7,xp:1350,title:'All-NBA'},
    {lvl:8,xp:1950,title:'MVP'},
    {lvl:9,xp:2700,title:'Hall of Fame'},
    {lvl:10,xp:3600,title:'Legend'}
  ];

  var ACHIEVEMENTS=[
    {id:'first_build', n:'Premier pas',        d:'Sauvegarder un build',                    icon:'◆'},
    {id:'architect',   n:'Architecte',         d:'Appliquer 5 trios différents',       icon:'◈'},
    {id:'tactician',   n:'Tacticien',          d:'Créer 3 loadouts de badges',              icon:'▦'},
    {id:'fusionist',   n:'Fusionniste',        d:'Remplir 8 slots de Synergy',              icon:'⚡'},
    {id:'specialist',  n:'Spécialiste',        d:'Terminer une piste de spécialisation',    icon:'★'},
    {id:'completionist',n:'Complétiste',       d:'Terminer les six pistes',                 icon:'♛'},
    {id:'publisher',   n:'Contributeur',       d:'Publier un build dans le hub',            icon:'▲'},
    {id:'scientist',   n:'Laborantin',         d:'Comparer 3 builds',                       icon:'◍'},
    {id:'maxed',       n:'Au plafond',         d:'Atteindre le cap sur 5 attributs',        icon:'▲'},
    {id:'polyvalent',  n:'Sans faiblesse',     d:'60+ dans les six disciplines',            icon:'⬟'},
    {id:'sniper',      n:'Sniper',             d:'95+ au tir à 3 points',                   icon:'◎'},
    {id:'wall',        n:'Le Mur',             d:'95+ en contre et défense intérieure',     icon:'⛨'}
  ];

  function state(){
    var s;
    try{s=JSON.parse(localStorage.getItem(XP_KEY)||'null')}catch(e){s=null}
    if(!s||typeof s!=='object')s={xp:0,counts:{},unlocked:[],log:[]};
    s.counts=s.counts||{};s.unlocked=s.unlocked||[];s.log=s.log||[];
    return s;
  }
  function save(s){try{localStorage.setItem(XP_KEY,JSON.stringify(s))}catch(e){}}

  function levelFor(xp){
    var cur=LEVELS[0];
    for(var i=0;i<LEVELS.length;i++)if(xp>=LEVELS[i].xp)cur=LEVELS[i];
    var next=LEVELS[LEVELS.indexOf(cur)+1]||null;
    var span=next?next.xp-cur.xp:1;
    var into=next?xp-cur.xp:1;
    return {cur:cur,next:next,pct:next?Math.round(into/span*100):100,into:into,span:span};
  }

  /* Chaque type d'événement a un plafond quotidien : impossible de farmer. */
  var DAILY_CAP={blueprint_used:5,quest_done:12,cb_planned:3,compared:4,shared:4,build_saved:6,loadout_created:4,synergy_filled:3};

  function today(){return new Date().toISOString().slice(0,10)}

  function award(event){
    var def=XP_EVENTS[event];
    if(!def)return;
    var s=state();
    var key=event+'@'+today();
    var used=s.counts[key]||0;
    var cap=DAILY_CAP[event];
    if(cap&&used>=cap)return;
    s.counts[key]=used+1;
    s.xp+=def.xp;
    var before=levelFor(s.xp-def.xp).cur.lvl;
    var after=levelFor(s.xp).cur.lvl;
    save(s);
    toast('+'+def.xp+' XP — '+def.label);
    if(after>before)setTimeout(function(){toast('Niveau '+after+' — '+levelFor(s.xp).cur.title,'level')},900);
    renderProfile();
    checkAchievements();
  }

  function unlock(id){
    var s=state();
    if(s.unlocked.indexOf(id)>=0)return;
    var a=ACHIEVEMENTS.filter(function(x){return x.id===id})[0];
    if(!a)return;
    s.unlocked.push(id);
    s.xp+=40;
    save(s);
    toast('Succès débloqué : '+a.n,'achievement');
    renderProfile();
  }

  function checkAchievements(){
    var r={};
    (window.inputs||[]).forEach(function(x){r[x.dataset.name]=+x.value});
    var caps={};
    try{caps=window.bodyCaps?window.bodyCaps():{}}catch(e){}

    var atCap=Object.keys(r).filter(function(k){return caps[k]&&r[k]>=caps[k]}).length;
    if(atCap>=5)unlock('maxed');
    if((r['Three-Point']||0)>=95)unlock('sniper');
    if((r['Block']||0)>=95&&(r['Interior Defense']||0)>=95)unlock('wall');

    var cats={
      Finition:['Close Shot','Driving Layup','Driving Dunk','Standing Dunk','Post Control'],
      Tir:['Mid-Range','Three-Point','Free Throw'],
      Création:['Pass Accuracy','Ball Handle','Speed With Ball'],
      Défense:['Interior Defense','Perimeter Defense','Steal','Block'],
      Rebond:['Offensive Rebound','Defensive Rebound'],
      Physique:['Speed','Agility','Strength','Vertical']
    };
    var allAbove=Object.keys(cats).every(function(g){
      var vals=cats[g].map(function(k){return r[k]||0});
      return vals.reduce(function(a,b){return a+b},0)/vals.length>=60;
    });
    if(allAbove)unlock('polyvalent');

    try{
      var q=JSON.parse(localStorage.getItem('nba2k27_quests_v1')||'{}');
      var tracks=Object.keys(q).filter(function(d){return (q[d]||[]).filter(Boolean).length>=10});
      if(tracks.length>=1)unlock('specialist');
      if(tracks.length>=6)unlock('completionist');
    }catch(e){}
  }

  /* ================= 2. Notifications ================= */
  function toast(msg,kind){
    var host=el('toastHost');
    if(!host){
      host=document.createElement('div');
      host.id='toastHost';host.className='toast-host';
      document.body.appendChild(host);
    }
    var t=document.createElement('div');
    t.className='toast'+(kind?' toast-'+kind:'');
    t.textContent=msg;
    t.setAttribute('role','status');
    host.appendChild(t);
    setTimeout(function(){t.classList.add('out')},2600);
    setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},3100);
  }

  /* ================= 3. Carte de profil ================= */
  function renderProfile(){
    var root=el('playerProfile');
    if(!root)return;
    var s=state(),L=levelFor(s.xp);
    var done=s.unlocked.length;

    root.innerHTML=
      '<div class="pp-top">'+
        '<div class="pp-level"><b>'+L.cur.lvl+'</b><small>NIV.</small></div>'+
        '<div class="pp-id">'+
          '<b>'+esc(L.cur.title)+'</b>'+
          '<span>'+s.xp+' XP'+(L.next?' · '+(L.next.xp-s.xp)+' XP avant '+esc(L.next.title):' · niveau maximum')+'</span>'+
        '</div>'+
      '</div>'+
      '<i class="pp-bar"><em style="width:'+L.pct+'%"></em></i>'+
      '<div class="pp-ach-head"><b>Succès</b><span>'+done+' / '+ACHIEVEMENTS.length+'</span></div>'+
      '<div class="pp-achievements">'+ACHIEVEMENTS.map(function(a){
        var on=s.unlocked.indexOf(a.id)>=0;
        return '<div class="pp-ach'+(on?' on':'')+'" title="'+esc(a.d)+'">'+
               '<i aria-hidden="true">'+a.icon+'</i><b>'+esc(a.n)+'</b><small>'+esc(a.d)+'</small></div>';
      }).join('')+'</div>';
  }

  /* ================= 4. Onglets du hub ================= */
  /* Les onglets ont remplacé le menu déroulant « Trier les builds » : les deux
     faisaient le même travail, et le menu pilotait une liste repliée que
     personne n'ouvrait. « Mieux notés » vient de ce menu supprimé. */
  var TABS=[
    {id:'trending',n:'Tendances',d:'Ce qui bouge en ce moment'},
    {id:'latest',  n:'Récents',  d:'Les derniers publiés'},
    {id:'score',   n:'Meilleure moyenne',d:'Les moyennes d’attributs les plus hautes (pas la note du jeu)'},
    {id:'top',     n:'Top',      d:'Les plus aimés et les plus vus'},
    {id:'mine',    n:'Mes builds',d:'Sauvegardés ou publiés depuis cet appareil'}
  ];
  var activeTab='trending';

  function hubBuilds(){
    var list=[];
    // window.NBABL_SERVER n'est jamais défini par server-client.js : ce n'était
    // qu'un chemin mort. Le hub local (fusionné avec le serveur par
    // mergeServerBuilds) reste la seule source réellement alimentée.
    try{ list=JSON.parse(localStorage.getItem('nba2k27_build_hub_v19')||'[]'); }catch(e){list=[]}
    return Array.isArray(list)?list:[];
  }

  function ts(b){
    var t=b.createdAt||b.created_at||0;
    if(typeof t==='string')t=Date.parse(t)||0;
    if(t<1e11)t*=1000;
    return t;
  }

  /* Score de tendance : l'engagement récent pèse plus que le total historique. */
  function trendScore(b){
    var ageDays=Math.max(.5,(Date.now()-ts(b))/86400000);
    return ((b.likes||0)*4+(b.views||0)*.5+(b.comments||0)*3)/Math.pow(ageDays,.8);
  }

  /* Un build publié perd son marqueur `local` dès que mergeServerBuilds()
     le remplace par la version renvoyée par le serveur (source:'Serveur').
     Le jeton propriétaire (server-client.js, sauvegardé côté navigateur au
     moment de la publication) reste lui présent quel que soit ce remplacement :
     c'est le seul signal fiable pour retrouver un build publié par cet appareil. */
  function ownedBuildIds(){
    try{
      var owners=JSON.parse(localStorage.getItem('nba2k27_owner_tokens_v1')||'{}');
      return owners&&typeof owners==='object'?owners:{};
    }catch(e){return {}}
  }

  function sortFor(tab,list){
    var c=list.slice();
    if(tab==='trending')return c.sort(function(a,b){return trendScore(b)-trendScore(a)});
    if(tab==='latest')  return c.sort(function(a,b){return ts(b)-ts(a)});
    if(tab==='score')   return c.sort(function(a,b){return (b.score||0)-(a.score||0)});
    if(tab==='top')     return c.sort(function(a,b){return ((b.likes||0)*3+(b.views||0))-((a.likes||0)*3+(a.views||0))});
    var owned=ownedBuildIds();
    return c.filter(function(b){return b.mine||b.local||owned[b.id]!=null});
  }

  function renderTabs(){
    var root=el('hubTabs');
    if(!root)return;
    root.innerHTML=TABS.map(function(t){
      return '<button type="button" class="hub-tab'+(t.id===activeTab?' active':'')+'" data-tab="'+t.id+'">'+
             esc(t.n)+'</button>';
    }).join('');
    root.querySelectorAll('[data-tab]').forEach(function(b){
      b.addEventListener('click',function(){activeTab=b.dataset.tab;renderTabs();refreshHub()});
    });
    var hint=el('hubTabHint');
    if(hint){
      var t=TABS.filter(function(x){return x.id===activeTab})[0];
      hint.textContent=t?t.d:'';
    }
  }

  function qualityLabel(b){
    var s=+b.score||0,badges=+b.badges||0;
    if(b.validated&&s>=74&&badges>=15)return {cls:'elite',t:'Build de qualité'};
    if(b.validated)return {cls:'ok',t:'Validé'};
    return null;
  }

  /* Il y avait deux listes de builds dans la meme section : celle-ci, pilotee par
     les onglets, et #communityList (app.js), pilotee par la recherche et les
     filtres mais repliee dans un <details> que personne n'ouvrait. Resultat :
     taper dans la recherche ne changeait rien a l'ecran. Il ne reste qu'une
     liste - celle d'app.js, qui porte les actions (voir, aimer, comparer) - et
     les onglets ci-dessus lui fournissent son tri. */
  function refreshHub(){
    if(typeof window.renderCommunity==='function')window.renderCommunity();
  }

  var SHORT={'Three-Point':'3PT','Mid-Range':'MID','Close Shot':'CLOSE','Driving Layup':'LAY',
    'Driving Dunk':'DNK','Standing Dunk':'SDNK','Post Control':'POST','Free Throw':'FT',
    'Pass Accuracy':'PASS','Ball Handle':'BALL','Speed With Ball':'SPWB','Interior Defense':'IDEF',
    'Perimeter Defense':'PDEF','Steal':'STL','Block':'BLK','Offensive Rebound':'OREB',
    'Defensive Rebound':'DREB','Speed':'SPD','Agility':'AGI','Strength':'STR','Vertical':'VERT'};
  function shortAttr(k){return SHORT[k]||k.slice(0,4).toUpperCase()}

  /* ================= 5. Amorçage ================= */
  function boot(){
    renderProfile();
    renderTabs();
    refreshHub();
    checkAchievements();

    var saveBtn=el('save');
    if(saveBtn)saveBtn.addEventListener('click',function(){award('build_saved');unlock('first_build')});
    var pub=el('addCurrentBuild');
    if(pub)pub.addEventListener('click',function(){award('build_published');unlock('publisher')});
    var shareBtn=el('share');
    if(shareBtn)shareBtn.addEventListener('click',function(){award('shared')});
    var cb=el('cbAutoPlan');
    if(cb)cb.addEventListener('click',function(){award('cb_planned')});

    document.addEventListener('click',function(e){
      if(e.target.closest('[data-apply]'))award('blueprint_used');
      if(e.target.closest('#loAdd'))award('loadout_created');
      if(e.target.closest('.syn-chip'))award('synergy_filled');
      if(e.target.closest('[data-q]'))award('quest_done');
    });

    // Le hub se remplit après l'appel réseau ; on rafraîchit quand il arrive.
    setTimeout(refreshHub,1500);
    setTimeout(refreshHub,5000);
    setInterval(checkAchievements,4000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();

  window.NBABL_COMMUNITY={award:award,unlock:unlock,state:state,toast:toast,refresh:refreshHub};

  /* Contrat avec app.js : les onglets fournissent le tri (et le filtre « Mes
     builds »), app.js fournit la liste, les filtres et les actions. */
  window.NBABL_HUB={tab:function(){return activeTab},sort:sortFor,quality:qualityLabel};
})();
