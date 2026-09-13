/* NBA 2K27 Build Lab — Comportements d'interface (V23)
   Regroupe ce qui vivait dans des <script> inline : navigation, réglages,
   installation PWA et enregistrement du service worker.
*/
(function(){
  'use strict';

  var SECTIONS=['blueprints','community','builder','build-dna','badges','animations',
                'buildSheet','loadouts','compare','validator'];

  /* ---- 1. Surlignage de l'onglet actif pendant le défilement ---- */
  function initNavHighlight(){
    var links={};
    document.querySelectorAll('.reference-nav a').forEach(function(a){
      var id=a.getAttribute('href').replace(/^#/,'');
      links[id]=a;
    });
    var targets=SECTIONS.map(function(id){return document.getElementById(id)}).filter(Boolean);
    if(!targets.length||!('IntersectionObserver' in window))return;

    function setActive(id){
      Object.keys(links).forEach(function(k){
        links[k].classList.toggle('active',k===id);
        if(k===id)links[k].setAttribute('aria-current','true');
        else links[k].removeAttribute('aria-current');
      });
    }

    var visible={};
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){visible[e.target.id]=e.isIntersecting?e.intersectionRatio:0});
      var best=null,bestRatio=0;
      Object.keys(visible).forEach(function(id){
        if(visible[id]>bestRatio){bestRatio=visible[id];best=id}
      });
      if(best)setActive(best);
    },{rootMargin:'-40% 0px -50% 0px',threshold:[0,.25,.5,1]});

    targets.forEach(function(t){io.observe(t)});

    document.querySelectorAll('.reference-nav a').forEach(function(a){
      a.addEventListener('click',function(){setActive(a.getAttribute('href').replace(/^#/,''))});
    });
  }

  /* ---- 2. Panneau de réglages ---- */
  function initSettings(){
    var btn=document.getElementById('referenceSettings');
    if(!btn)return;
    btn.addEventListener('click',function(){
      var modal=document.getElementById('buildModal');
      var body=document.getElementById('buildModalContent');
      if(!modal||!body)return;
      var cfg=window.NBABL_SITE_CONFIG||{};
      var swReady=('serviceWorker' in navigator);
      body.innerHTML=
        '<div class="modal-kicker">Réglages</div>'+
        '<h2>NBA 2K27 Build Lab</h2>'+
        '<p class="sub">Version '+(cfg.version||'23.0.0')+'. Toutes tes données (builds sauvegardés, cap breakers, jetons) restent sur cet appareil sauf si tu publies un build.</p>'+
        '<h3>Données locales</h3>'+
        '<div class="modal-attrs">'+
          '<div><span>Builds sauvegardés</span><b>'+(localStorage.getItem('nba2k27_build')?'1':'0')+'</b></div>'+
          '<div><span>Bibliothèque locale</span><b>'+localStorageCount()+'</b></div>'+
          '<div><span>Mode hors ligne</span><b>'+(swReady?'Actif':'Indisponible')+'</b></div>'+
          '<div><span>API communauté</span><b>'+(cfg.apiBase||'/api')+'</b></div>'+
        '</div>'+
        '<div class="modal-actions">'+
          '<button type="button" id="settingsClearLocal">Effacer mes données locales</button>'+
          '<button type="button" class="secondary" data-close-modal>Fermer</button>'+
        '</div>';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
      btn.setAttribute('aria-expanded','true');

      body.querySelectorAll('[data-close-modal]').forEach(function(x){
        x.addEventListener('click',closeModal);
      });
      var clear=document.getElementById('settingsClearLocal');
      if(clear)clear.addEventListener('click',function(){
        if(!confirm('Effacer tous les builds et plans enregistrés sur cet appareil ?'))return;
        Object.keys(localStorage).filter(function(k){return k.indexOf('nba2k27')===0}).forEach(function(k){
          localStorage.removeItem(k);
        });
        location.reload();
      });
    });

    function closeModal(){
      var modal=document.getElementById('buildModal');
      if(!modal)return;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
      btn.setAttribute('aria-expanded','false');
    }

    document.addEventListener('keydown',function(e){
      if(e.key==='Escape')closeModal();
    });
  }

  function localStorageCount(){
    try{
      var arr=JSON.parse(localStorage.getItem('nba2k27_build_hub_v19')||'[]');
      return Array.isArray(arr)?arr.length:0;
    }catch(e){return 0}
  }

  /* ---- 3. Version affichée dans l'en-tête ---- */
  function initVersion(){
    var el=document.getElementById('referenceVersion');
    var cfg=window.NBABL_SITE_CONFIG;
    if(el&&cfg&&cfg.shortVersion)el.textContent=cfg.shortVersion;
  }

  /* ---- 4. Installation PWA ---- */
  function initPWA(){
    var deferred=null;
    var box=document.getElementById('pwaInstall');
    var btn=document.getElementById('pwaInstallBtn');
    var close=document.getElementById('pwaInstallClose');
    var txt=document.getElementById('pwaInstallText');
    var update=document.getElementById('pwaUpdate');
    var updateBtn=document.getElementById('pwaUpdateBtn');
    var DISMISS='nba2k27_pwa_dismissed';

    var isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.MSStream;
    var standalone=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
    var dismissed=localStorage.getItem(DISMISS)==='1';

    if(box&&isIOS&&!standalone&&!dismissed&&txt&&btn){
      txt.textContent='Sur iPhone : Partager, puis « Sur l’écran d’accueil » pour installer Build Lab.';
      btn.textContent='J’ai compris';
      btn.onclick=function(){box.hidden=true;localStorage.setItem(DISMISS,'1')};
      box.hidden=false;
    }

    window.addEventListener('beforeinstallprompt',function(e){
      e.preventDefault();
      deferred=e;
      if(box&&!dismissed)box.hidden=false;
    });

    if(btn)btn.addEventListener('click',function(){
      if(!deferred)return;
      deferred.prompt();
      deferred.userChoice.then(function(){deferred=null;if(box)box.hidden=true});
    });

    if(close)close.addEventListener('click',function(){
      if(box)box.hidden=true;
      localStorage.setItem(DISMISS,'1');
    });

    if(!('serviceWorker' in navigator))return;

    window.addEventListener('load',function(){
      navigator.serviceWorker.register('sw.js').then(function(reg){
        if(reg.waiting&&update)update.hidden=false;
        reg.addEventListener('updatefound',function(){
          var w=reg.installing;
          if(!w)return;
          w.addEventListener('statechange',function(){
            if(w.state==='installed'&&navigator.serviceWorker.controller&&update)update.hidden=false;
          });
        });
      }).catch(function(){});
    });

    if(updateBtn)updateBtn.addEventListener('click',function(){
      navigator.serviceWorker.getRegistration().then(function(reg){
        if(reg&&reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
        setTimeout(function(){location.reload()},250);
      });
    });

    var reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(reloading)return;
      reloading=true;
      location.reload();
    });
  }

  /* ---- 5. Exemples Build DNA ---- */
  function initDNAExamples(){
    var prompt=document.getElementById('dnaPrompt');
    if(!prompt)return;
    document.querySelectorAll('[data-dna-example]').forEach(function(b){
      b.addEventListener('click',function(){
        prompt.value=b.dataset.dnaExample;
        prompt.focus();
      });
    });
  }

  /* ---- 6. Mode simple / expert ---- */
  function initModeSwitch(){
    var simple=document.getElementById('beginnerMode');
    var expert=document.getElementById('expertMode');
    if(!simple||!expert)return;
    function set(isSimple){
      simple.classList.toggle('active',isSimple);
      expert.classList.toggle('active',!isSimple);
      simple.setAttribute('aria-pressed',String(isSimple));
      expert.setAttribute('aria-pressed',String(!isSimple));
      document.body.classList.toggle('expert-mode',!isSimple);
      if(window.NBABL_V15&&typeof window.NBABL_V15.setMode==='function'){
        window.NBABL_V15.setMode(isSimple?'simple':'expert');
      }
    }
    simple.addEventListener('click',function(){set(true)});
    expert.addEventListener('click',function(){set(false)});
  }

  function boot(){
    initVersion();
    initNavHighlight();
    initSettings();
    initPWA();
    initDNAExamples();
    initModeSwitch();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
