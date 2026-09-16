/* NBA 2K27 Build Lab — Partage
   - Code compact : le build entier tient dans ~31 caractères (179 bits packés)
   - QR code : NBA 2K27 permet de partager un build par QR ; on fait pareil
   - Carte de build : image PNG téléchargeable, pensée pour être postée
*/
(function(){
  'use strict';

  /* La carte de build est dessinée dans un canvas : i18n.js, qui traduit le
     document, ne peut rien y faire. Les rares textes écrits en dur passent donc
     par la table que i18n.js publie (absente sur le site français : texte rendu tel quel). */
  function TX(t){ var m=window.NBABL_TABLE_EN; return (m&&m[t])||t; }

  var ATTRS=['Close Shot','Driving Layup','Driving Dunk','Standing Dunk','Post Control',
    'Mid-Range','Three-Point','Free Throw','Pass Accuracy','Ball Handle','Speed With Ball',
    'Interior Defense','Perimeter Defense','Steal','Block','Offensive Rebound','Defensive Rebound',
    'Speed','Agility','Strength','Vertical',
    // L'endurance n'existe pas dans NBA 2K27 : sa case reste dans le code pour que
    // les codes déjà partagés se relisent. Elle vaut 25 et n'est jamais appliquée.
    'Stamina'];
  var POS=['PG','SG','SF','PF','C'];
  var STYLES=['Équilibré','Shooter','Slasher','Playmaker','Lockdown','Big'];
  var HANDS=['Droite','Gauche'];
  var B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  function el(id){return document.getElementById(id)}

  /* ---------- Encodage binaire compact ---------- */
  function Writer(){this.bits=[]}
  Writer.prototype.push=function(v,n){for(var i=n-1;i>=0;i--)this.bits.push((v>>i)&1)};
  Writer.prototype.toCode=function(){
    var s='';
    for(var i=0;i<this.bits.length;i+=6){
      var v=0;
      for(var j=0;j<6;j++)v=(v<<1)|(this.bits[i+j]||0);
      s+=B64[v];
    }
    return s;
  };
  function Reader(code){
    this.bits=[];
    for(var i=0;i<code.length;i++){
      var v=B64.indexOf(code[i]);
      if(v<0)throw new Error('Code invalide');
      for(var j=5;j>=0;j--)this.bits.push((v>>j)&1);
    }
    this.p=0;
  }
  Reader.prototype.take=function(n){
    var v=0;
    for(var i=0;i<n;i++)v=(v<<1)|(this.bits[this.p++]||0);
    return v;
  };

  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}

  function encodeBuild(){
    var w=new Writer();
    // Format 2 : le poids part de 140 lbs (les meneurs de 5'9" descendent à 145).
    // Le format 1, qui partait de 160, reste lisible pour les anciens liens.
    w.push(2,3);                                             // version du format
    w.push(Math.max(0,POS.indexOf(el('position').value)),3);
    w.push(clamp(+el('height').value,69,88)-69,5);
    w.push(clamp(+el('weight').value,140,300)-140,8);
    w.push(clamp(+el('wing').value,69,86)-69,5);
    w.push(Math.max(0,HANDS.indexOf(el('dominantHand').value)),1);
    w.push(Math.max(0,STYLES.indexOf(el('style').value)),3);
    var map={};
    (window.inputs||[]).forEach(function(x){map[x.dataset.name]=+x.value});
    ATTRS.forEach(function(k){w.push(clamp(map[k]||25,25,99)-25,7)});
    return w.toCode();
  }

  function decodeBuild(code){
    var r=new Reader(code);
    var fmt=r.take(3);
    if(fmt!==1&&fmt!==2)throw new Error('Version de code inconnue');
    var obj={
      position:POS[r.take(3)]||'SF',
      height:r.take(5)+69,
      weight:r.take(8)+(fmt===1?160:140),
      wing:r.take(5)+69,
      hand:HANDS[r.take(1)]||'Droite',
      style:STYLES[r.take(3)]||'Équilibré',
      attrs:{}
    };
    ATTRS.forEach(function(k){obj.attrs[k]=r.take(7)+25});
    return obj;
  }

  function shareURL(){
    var base=(window.NBABL_SITE_CONFIG&&window.NBABL_SITE_CONFIG.siteUrl)||location.origin;
    return base.replace(/\/$/,'')+'/?c='+encodeBuild();
  }

  /* ---------- Carte de build en PNG ---------- */
  var CAT_COLORS={
    Finition:['#2F80FF','#1BB4FF'],Tir:['#17C964','#4BE59B'],Création:['#FF8A3D','#FFB067'],
    Défense:['#F2456B','#FF7A96'],Rebond:['#7C4DFF','#A98BFF'],Physique:['#F5C542','#FFDF7E']
  };

  function categoryValues(){
    var groups={
      Finition:['Close Shot','Driving Layup','Driving Dunk','Standing Dunk','Post Control'],
      Tir:['Mid-Range','Three-Point','Free Throw'],
      Création:['Pass Accuracy','Ball Handle','Speed With Ball'],
      Défense:['Interior Defense','Perimeter Defense','Steal','Block'],
      Rebond:['Offensive Rebound','Defensive Rebound'],
      Physique:['Speed','Agility','Strength','Vertical']
    };
    var map={};
    (window.inputs||[]).forEach(function(x){map[x.dataset.name]=+x.value});
    var out={};
    Object.keys(groups).forEach(function(g){
      var vals=groups[g].map(function(k){return map[k]||0});
      out[g]=Math.round(vals.reduce(function(a,b){return a+b},0)/vals.length);
    });
    return out;
  }

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function drawCard(){
    var W=1080,H=1350;
    var cv=document.createElement('canvas');
    cv.width=W;cv.height=H;
    var ctx=cv.getContext('2d');

    // Fond
    var g=ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'#0B1726');g.addColorStop(.55,'#070E18');g.addColorStop(1,'#04090F');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    var glow=ctx.createRadialGradient(W*.2,-60,0,W*.2,-60,700);
    glow.addColorStop(0,'rgba(29,139,255,.28)');glow.addColorStop(1,'rgba(29,139,255,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H*.6);

    var F='700 34px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

    // Marque
    ctx.font='900 46px Inter, system-ui, sans-serif';
    ctx.fillStyle='#fff';ctx.fillText('NBA ',64,104);
    var wNba=ctx.measureText('NBA ').width;
    ctx.fillStyle='#F2334A';ctx.fillText('2K27',64+wNba,104);
    ctx.font='800 20px Inter, system-ui, sans-serif';
    ctx.fillStyle='#94A3B6';ctx.fillText('BUILD LAB',64,136);

    // Note
    var score=+(el('score')&&el('score').textContent)||0;
    ctx.save();
    ctx.translate(W-190,110);
    ctx.beginPath();ctx.arc(0,0,86,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.05)';ctx.fill();
    ctx.beginPath();ctx.arc(0,0,86,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,score/100));
    ctx.lineWidth=14;ctx.strokeStyle='#22D3EE';ctx.lineCap='round';ctx.stroke();
    ctx.textAlign='center';
    ctx.font='900 62px Inter, system-ui, sans-serif';ctx.fillStyle='#fff';ctx.fillText(score,0,16);
    ctx.font='800 18px Inter, system-ui, sans-serif';ctx.fillStyle='#94A3B6';ctx.fillText(TX('MOYENNE'),0,48);
    ctx.restore();

    // Nom du build
    var name=(el('buildname')&&el('buildname').textContent)||'MyPLAYER';
    ctx.textAlign='left';
    ctx.font='900 72px Inter, system-ui, sans-serif';
    ctx.fillStyle='#EDF2F9';
    ctx.fillText(fit(ctx,name,W-128),64,266);

    var meta=(el('buildMeta')&&el('buildMeta').textContent)||'';
    ctx.font='600 30px Inter, system-ui, sans-serif';
    ctx.fillStyle='#94A3B6';ctx.fillText(meta,64,314);

    var bp=el('activeBlueprint');
    if(bp&&!bp.hidden){
      var b=bp.querySelector('b'),s=bp.querySelector('span');
      ctx.font='800 26px Inter, system-ui, sans-serif';ctx.fillStyle='#22D3EE';
      ctx.fillText((b?b.textContent:'')+(s?'  •  '+s.textContent:''),64,362);
    }

    // Barres de discipline
    var cats=categoryValues(),y=430;
    Object.keys(cats).forEach(function(k){
      var v=cats[k],cols=CAT_COLORS[k];
      ctx.font='700 28px Inter, system-ui, sans-serif';
      ctx.fillStyle='#B6C3D2';ctx.fillText(k,64,y);
      ctx.textAlign='right';
      ctx.font='900 32px Inter, system-ui, sans-serif';
      ctx.fillStyle=cols[1];ctx.fillText(v,W-64,y);
      ctx.textAlign='left';
      ctx.fillStyle='rgba(255,255,255,.08)';
      roundRect(ctx,64,y+14,W-128,14,7);ctx.fill();
      var bg=ctx.createLinearGradient(64,0,W-64,0);
      bg.addColorStop(0,cols[0]);bg.addColorStop(1,cols[1]);
      ctx.fillStyle=bg;
      roundRect(ctx,64,y+14,(W-128)*Math.min(1,v/99),14,7);ctx.fill();
      y+=84;
    });

    // Badges clés
    var badges=[];
    try{badges=(window.NBABL_PROGRESSION.activeLoadout().badges||[]).slice(0,6)}catch(e){}
    if(!badges.length){
      badges=Array.prototype.slice.call(document.querySelectorAll('#styleBadgeRecommendations .style-badge-item b'))
        .slice(0,6).map(function(n){return (n.querySelector('.badge-fr')||n).textContent});
    }
    if(badges.length){
      y+=10;
      ctx.font='800 22px Inter, system-ui, sans-serif';
      ctx.fillStyle='#64748B';ctx.fillText(TX('BADGES CLÉS'),64,y);
      y+=34;
      var bx=64;
      badges.forEach(function(n){
        ctx.font='700 24px Inter, system-ui, sans-serif';
        n=nomBadge(n);var w=ctx.measureText(n).width+36;
        if(bx+w>W-64){bx=64;y+=56}
        ctx.fillStyle='rgba(29,139,255,.14)';
        roundRect(ctx,bx,y-30,w,44,22);ctx.fill();
        ctx.strokeStyle='rgba(29,139,255,.34)';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='#A8D4FF';ctx.fillText(n,bx+18,y);
        bx+=w+12;
      });
      y+=60;
    }

    // QR + pied de carte
    var qrSize=210,qrX=W-64-qrSize,qrY=H-64-qrSize;
    try{
      if(window.NBABL_QR)window.NBABL_QR.drawOnCanvas(ctx,shareURL(),qrX,qrY,qrSize,{dark:'#050A12',light:'#FFFFFF'});
    }catch(e){}
    ctx.font='700 28px Inter, system-ui, sans-serif';
    ctx.fillStyle='#94A3B6';
    ctx.fillText(TX('Scanne pour ouvrir ce build'),64,qrY+72);
    ctx.font='600 23px Inter, system-ui, sans-serif';
    ctx.fillStyle='#64748B';
    ctx.fillText('lelabodesbuilds.com',64,qrY+112);
    ctx.fillText(TX('Modèle indicatif — non officiel 2K'),64,qrY+150);

    return cv;
  }

  function fit(ctx,text,max){
    if(ctx.measureText(text).width<=max)return text;
    var t=text;
    while(t.length>4&&ctx.measureText(t+'…').width>max)t=t.slice(0,-1);
    return t+'…';
  }

  /* ---------- Modale de partage ---------- */
  function openShare(){
    var modal=el('buildModal'),body=el('buildModalContent');
    if(!modal||!body)return;
    var url=shareURL(),svg='';
    try{svg=window.NBABL_QR.toSVG(url,{quiet:3,dark:'#050A12',light:'#FFFFFF'})}
    catch(e){svg='<div class="empty">QR indisponible pour ce build.</div>'}

    body.innerHTML=
      '<div class="modal-kicker">Partager</div>'+
      '<h2>Ton build en un scan</h2>'+
      '<p class="sub">Le QR contient le build complet. Sur NBA 2K27 tu peux préparer un build sur mobile puis le retrouver sur console — ici c\u2019est le même principe entre toi et tes amis.</p>'+
      '<div class="share-grid">'+
        '<div class="share-qr">'+svg+'</div>'+
        '<div class="share-side">'+
          '<label>Lien du build<input id="shareUrl" readonly value="'+url.replace(/"/g,'&quot;')+'"></label>'+
          '<button type="button" id="shareCopy">Copier le lien</button>'+
          '<button type="button" id="shareCard" class="secondary">Télécharger la carte</button>'+
          '<button type="button" id="shareQrPng" class="secondary">Télécharger le QR</button>'+
        '</div>'+
      '</div>';

    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');

    el('shareCopy').addEventListener('click',function(){
      var input=el('shareUrl');
      input.select();
      (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject())
        .then(function(){return true},function(){try{return document.execCommand('copy')}catch(e){return false}})
        .then(function(ok){el('shareCopy').textContent=ok?'Lien copié':'Copie impossible — sélectionne et copie manuellement'});
    });
    el('shareCard').addEventListener('click',function(){
      download(drawCard(),'nba2k27-build-'+slug()+'.png');
    });
    el('shareQrPng').addEventListener('click',function(){
      var cv=document.createElement('canvas');
      cv.width=cv.height=640;
      var ctx=cv.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,640,640);
      window.NBABL_QR.drawOnCanvas(ctx,url,0,0,640,{dark:'#050A12',light:'#FFFFFF'});
      download(cv,'nba2k27-build-qr.png');
    });
  }

  function slug(){
    var n=(el('buildname')&&el('buildname').textContent)||'build';
    return n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'build';
  }

  function download(canvas,filename){
    canvas.toBlob(function(blob){
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url;a.download=filename;
      document.body.appendChild(a);a.click();
      document.body.removeChild(a);
      setTimeout(function(){URL.revokeObjectURL(url)},2000);
    },'image/png');
  }

  /* ---------- Lecture de ?c= au chargement ---------- */
  function loadFromURL(){
    var m=/[?&]c=([A-Za-z0-9\-_]+)/.exec(location.search);
    if(!m)return;
    try{
      var obj=decodeBuild(m[1]);
      if(window.applyBuild)window.applyBuild(obj);
      if(window.NBABL_APPLY_STYLE_VISUALS)window.NBABL_APPLY_STYLE_VISUALS(obj.style);
      if(window.NBABL_PROGRESSION)window.NBABL_PROGRESSION.refresh();
    }catch(e){
      console.warn('Code de build illisible :',e.message);
    }
  }

  function boot(){
    loadFromURL();
    var share=el('share');
    if(share){
      share.textContent='';
      share.insertAdjacentHTML('afterbegin',
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/>'+
        '<rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'+
        '<path d="M14 14h3v3h-3zM19 14h2M19 19h2M14 19h3"/></svg>Partager / QR');
      share.addEventListener('click',function(e){e.stopImmediatePropagation();openShare()},true);
    }
    var card=el('printCard');
    if(card)card.addEventListener('click',function(e){
      e.stopImmediatePropagation();
      download(drawCard(),'nba2k27-build-'+slug()+'.png');
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();

  window.NBABL_SHARE={encode:encodeBuild,decode:decodeBuild,url:shareURL,card:drawCard,open:openShare};
})();
