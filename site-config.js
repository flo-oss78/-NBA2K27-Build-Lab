window.NBABL_SITE_CONFIG=Object.freeze({
  siteUrl:'https://lelabodesbuilds.com',
  apiBase:'/api',
  appName:'NBA 2K27 Build Lab',
  version:'26.16.0',
  shortVersion:'V26.16',
  environment:'production'
});

/* Échappement HTML partagé — auparavant réimplémenté à l'identique dans une
   dizaine de fichiers (blueprints.js, assist.js, build-sheet.js, community.js,
   progression.js, style-presets.js, dna-engine.js, server-client.js,
   v15-intelligence.js…). Une seule implémentation ici : les autres fichiers
   s'y délèguent pour éviter qu'un futur correctif n'oublie une des copies.*/
window.escHtml=function(v){
  return String(v==null?'':v).replace(/[&<>"']/g,function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
};
