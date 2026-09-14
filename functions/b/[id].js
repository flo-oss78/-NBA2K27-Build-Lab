/* Page publique d'un build — rendue côté serveur pour le référencement.
   my2kbuilds indexe une page par build ; un site en page unique n'indexe rien.
   Cette Function renvoie du HTML complet avec les balises Open Graph, puis
   laisse le JavaScript du site reprendre la main pour la partie interactive. */

import {escHtml as esc, rateLimit} from '../api/_utils.js';

const POS_LABEL={PG:'Meneur',SG:'Arrière',SF:'Ailier',PF:'Ailier fort',C:'Pivot'};
const MODE_LABEL={park:'Park (3v3)',rec:'REC (5v5)',proam:'Pro-Am','1v1':'1v1',mycareer:'MyCAREER'};

function heightText(h){return Math.floor(h/12)+"'"+(h%12)+'"'}
function cm(i){return Math.round(i*2.54)}
function kg(l){return Math.round(l*0.45359237)}

const GROUPS=[
  ['Finition',['Close Shot','Driving Layup','Driving Dunk','Standing Dunk','Post Control']],
  ['Tir',['Mid-Range','Three-Point','Free Throw']],
  ['Création',['Pass Accuracy','Ball Handle','Speed With Ball']],
  ['Défense',['Interior Defense','Perimeter Defense','Steal','Block']],
  ['Rebond',['Offensive Rebound','Defensive Rebound']],
  ['Physique',['Speed','Agility','Strength','Vertical','Stamina']]
];

export async function onRequestGet({params,env,request}){
  const id=params.id;
  if(!env.DB)return Response.redirect(new URL('/',request.url).toString(),302);

  let row=null;
  try{
    row=await env.DB.prepare('SELECT * FROM builds WHERE id=?').bind(id).first();
  }catch(e){
    // Une panne D1 (timeout, quota…) n'est pas « ce build n'existe pas » : la confondre
    // avec un 404 désindexerait des builds réels aux yeux des moteurs de recherche.
    return new Response('Erreur serveur temporaire.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
  }
  if(!row)return new Response(notFound(),{status:404,headers:htmlHeaders()});

  // La page reste servie même si ce frein bloque l'incrément : seul le compteur
  // de vues (public, non sensible) est concerné, jamais l'affichage.
  const viewThrottle=await rateLimit(env,request,'view-b-'+id,20);
  if(viewThrottle.ok){
    try{await env.DB.prepare('UPDATE builds SET views=views+1 WHERE id=?').bind(id).run()}catch(e){}
  }

  let attrs={};
  try{attrs=JSON.parse(row.attributes_json||'{}')}catch(e){}
  let tags=[],modes=[],cbPlan=[];
  try{tags=JSON.parse(row.tags_json||'[]')}catch(e){}
  try{modes=JSON.parse(row.modes_json||'[]')}catch(e){}
  try{cbPlan=JSON.parse(row.cb_plan_json||'[]')}catch(e){}

  const top=Object.entries(attrs).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const posLabel=POS_LABEL[row.position]||row.position;
  const title=`${row.name} — ${row.position} ${heightText(row.height)} | NBA 2K27 Build Lab`;
  const desc=`Build NBA 2K27 ${posLabel} ${heightText(row.height)}, ${row.weight} lbs. `+
    top.map(([k,v])=>`${k} ${v}`).join(', ')+`. Moyenne des attributs ${row.score||'—'}.`;
  const url=new URL(request.url);
  const canonical=`${url.origin}/b/${encodeURIComponent(id)}`;

  const jsonld={
    '@context':'https://schema.org','@type':'CreativeWork',
    name:row.name,description:desc,url:canonical,
    dateCreated:new Date(row.created_at||Date.now()).toISOString(),
    interactionStatistic:[
      {'@type':'InteractionCounter',interactionType:'https://schema.org/ViewAction',userInteractionCount:row.views||0},
      {'@type':'InteractionCounter',interactionType:'https://schema.org/LikeAction',userInteractionCount:row.likes||0}
    ]
  };

  const html=`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#050A12">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(row.name)} — ${esc(row.position)} ${esc(heightText(row.height))}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${url.origin}/icon-512.png">
<meta property="og:site_name" content="NBA 2K27 Build Lab">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/theme.css">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body class="build-page">
<header class="reference-header">
  <div class="reference-brand"><div>NBA <b>2K27</b></div><small>BUILD LAB</small></div>
  <nav class="reference-nav" aria-label="Navigation"><a href="/hub/">Builds</a><a href="/">Builder</a><a href="/trios/">Trios</a></nav>
  <div class="reference-actions"><a class="pill" href="/">Ouvrir le builder</a></div>
</header>
<main>
  <article class="panel build-detail">
    <div class="section-title">
      <div>
        <p class="eyebrow">${esc(posLabel)} · Saison ${esc(row.season||'S1')}</p>
        <h1>${esc(row.name)}</h1>
        <p class="sub">${esc(row.description||'')}</p>
      </div>
      ${row.validated?'<span class="pill server-ok">Build validé</span>':''}
    </div>

    <div class="bd-meta">
      <div><b>${esc(heightText(row.height))}</b><span>${cm(row.height)} cm</span></div>
      <div><b>${row.weight} lbs</b><span>${kg(row.weight)} kg</span></div>
      <div><b>${esc(heightText(row.wing))}</b><span>envergure</span></div>
      <div><b>${row.score||'—'}</b><span>moyenne</span></div>
    </div>

    ${tags.length||modes.length?`<div class="bd-tags">
      ${tags.map(t=>`<span class="bd-tag">${esc(t)}</span>`).join('')}
      ${modes.map(m=>`<span class="bd-tag mode">${esc(MODE_LABEL[m]||m)}</span>`).join('')}
      ${row.inspired_by?`<span class="bd-tag inspired">Inspiré par ${esc(row.inspired_by)}</span>`:''}
    </div>`:''}

    ${row.hq_link?`<div class="bd-hq">
      <h2>Importer dans NBA 2K HQ</h2>
      <p class="sub">Le créateur a fourni son lien de partage officiel. Ouvre-le depuis ton téléphone pour importer le build en jeu.</p>
      <a class="cta" href="${esc(row.hq_link)}" rel="nofollow noopener" target="_blank">Ouvrir dans NBA 2K HQ</a>
    </div>`:''}

    <h2 class="bd-h2">Attributs</h2>
    <div class="bd-groups">
      ${GROUPS.map(([g,keys])=>`<section class="bd-group">
        <h3>${esc(g)}</h3>
        ${keys.map(k=>`<div class="bd-row"><span>${esc(k)}</span><b>${attrs[k]!=null?attrs[k]:'—'}</b></div>`).join('')}
      </section>`).join('')}
    </div>

    ${cbPlan.length?`<h2 class="bd-h2">Guide Cap Breaker</h2>
    <p class="sub">Ordre d'application recommandé par le créateur.</p>
    <ol class="bd-cb">${cbPlan.map((s,i)=>`<li><span>CB #${i+1}</span><b>${esc(s.attr||'')}</b><em>+${+s.gain||1}</em></li>`).join('')}</ol>`:''}

    <div class="bd-stats">
      <span><b>${row.views||0}</b> vues</span>
      <span><b>${row.likes||0}</b> j'aime</span>
      <span><b>${row.cap_breakers||0}</b> cap breakers</span>
    </div>

    <a class="cta" href="/?b=${encodeURIComponent(id)}">Ouvrir ce build dans le builder</a>
  </article>
</main>
<footer>
  <p>NBA 2K27 Build Lab — outil indépendant, données publiques, aucune affiliation officielle avec 2K.</p>
</footer>
</body>
</html>`;

  return new Response(html,{headers:htmlHeaders()});
}

function htmlHeaders(){
  return {
    'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'public, max-age=120, s-maxage=600',
    'X-Content-Type-Options':'nosniff'
  };
}

function notFound(){
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Build introuvable — NBA 2K27 Build Lab</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/theme.css"></head>
<body><main><section class="panel"><h1>Ce build n'existe plus</h1>
<p class="sub">Il a peut-être été supprimé par son auteur.</p>
<a class="cta" href="/">Retour au builder</a></section></main></body></html>`;
}
