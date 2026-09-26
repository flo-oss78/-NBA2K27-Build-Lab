/* Page publique d'un build — rendue côté serveur pour le référencement.
   my2kbuilds indexe une page par build ; un site en page unique n'indexe rien.
   Cette Function renvoie du HTML complet avec les balises Open Graph, puis
   laisse le JavaScript du site reprendre la main pour la partie interactive. */

import {escHtml as esc, rateLimit} from '../api/_utils.js';
import {BADGES_DEFS} from '../badges-defs.js';

/* Les badges que ce build débloque, calculés ici : la page est rendue côté
   serveur et n'a pas accès aux tables du navigateur. C'est la question que se
   pose quiconque regarde le build de quelqu'un d'autre — « qu'est-ce que ça
   donne, concrètement ». */
const PALIERS=['Bronze','Argent','Or','Hall of Fame'];
function badgesDuBuild(attrs,hauteur){
  const out=[];
  for(const d of BADGES_DEFS){
    if(hauteur<d.minH||hauteur>d.maxH) continue;
    let niveau=0;
    for(let i=0;i<4;i++){
      const atteint=d.logic==='OR'
        ? d.req.some(q=>(attrs[q[0]]||0)>=(q[i+1]??999))
        : d.req.every(q=>(attrs[q[0]]||0)>=(q[i+1]??999));
      if(atteint) niveau=i+1;
    }
    if(niveau) out.push({...d,niveau,palier:PALIERS[niveau-1]});
  }
  // Le plus haut palier d'abord : c'est ce qui caractérise le build.
  return out.sort((a,b)=>b.niveau-a.niveau||a.fr.localeCompare(b.fr));
}

const POS_LABEL={PG:'Meneur',SG:'Arrière',SF:'Ailier',PF:'Ailier fort',C:'Pivot'};
const MODE_LABEL={park:'Park (3v3)',rec:'REC (5v5)',proam:'Pro-Am','1v1':'1v1',mycareer:'MyCAREER'};

function heightText(h){return Math.floor(h/12)+"'"+(h%12)+'"'}
function cm(i){return Math.round(i*2.54)}
function kg(l){return Math.round(l*0.45359237)}

/* Les mêmes classes de couleur que partout ailleurs sur le site : une page
   rendue ici ne doit pas ressembler à un autre site que le reste. */
const GROUPE_CLS={'Finition':'finish','Tir':'shoot','Création':'play',
  'Défense':'defense','Rebond':'rebound','Physique':'physical'};

const GROUPS=[
  ['Finition',['Close Shot','Driving Layup','Driving Dunk','Standing Dunk','Post Control']],
  ['Tir',['Mid-Range','Three-Point','Free Throw']],
  ['Création',['Pass Accuracy','Ball Handle','Speed With Ball']],
  ['Défense',['Interior Defense','Perimeter Defense','Steal','Block']],
  ['Rebond',['Offensive Rebound','Defensive Rebound']],
  ['Physique',['Speed','Agility','Strength','Vertical']]
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
  const badges=badgesDuBuild(attrs,Number(row.height)||0);
  const parPalier=PALIERS.map((p,i)=>({p,n:badges.filter(b=>b.niveau===i+1).length}))
    .filter(x=>x.n).reverse();
  const repartition=parPalier.map(x=>`${x.n} en ${x.p}`).join(', ')+'.';
  // L'auteur : affiché seulement s'il a un compte, sinon le pseudo ne mène
  // nulle part et ressemble à un lien mort.
  let auteur=null;
  if(row.author_id){
    try{
      auteur=await env.DB.prepare('SELECT pseudo, slug, avatar FROM users WHERE id=? AND blocked=0')
        .bind(row.author_id).first();
    }catch(e){ /* la fiche vaut mieux sans auteur que pas de fiche */ }
  }
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
  <div class="reference-brand"><div>LE LABO <b>DES&nbsp;BUILDS</b></div><small>NBA 2K27</small></div>
  <nav class="reference-nav" aria-label="Navigation principale">
    <a href="/" data-nav="creer">Créer</a>
    <a href="/hub/" data-nav="builds">Builds</a>
    <a href="/reference/" data-nav="badges">Badges</a>
    <a href="/reference/?onglet=animations" data-nav="animations">Animations</a>
    <a href="/mon-build/" data-nav="monbuild">Mon build</a>
  </nav>
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
      ${GROUPS.map(([g,keys])=>`<section class="bd-group cat-${GROUPE_CLS[g]||'finish'}">
        <h3>${esc(g)}</h3>
        ${keys.map(k=>{
          const v=attrs[k];
          // La barre part de 25, le minimum du jeu : mesurer depuis zéro
          // écraserait toutes les valeurs dans la même moitié droite.
          const pct=v!=null?Math.max(0,Math.min(100,Math.round((v-25)/74*100))):0;
          return `<div class="bd-row"><span>${esc(k)}</span>`
            +`<i class="bd-jauge" aria-hidden="true"><em style="width:${pct}%"></em></i>`
            +`<b>${v!=null?v:'—'}</b></div>`;
        }).join('')}
      </section>`).join('')}
    </div>

    ${badges.length?`<h2 class="bd-h2">Badges débloqués <small>${badges.length}</small></h2>
    <p class="sub">Calculés d'après les attributs de ce build et sa taille. ${repartition}</p>
    <ul class="bd-badges">
      ${badges.slice(0,24).map(b=>`<li class="bd-badge niv-${b.niveau}">`
        +`<a href="/badge/${esc(b.slug)}/">${esc(b.fr)}</a><span>${esc(b.palier)}</span></li>`).join('')}
    </ul>
    ${badges.length>24?`<p class="sub">Et ${badges.length-24} autres. <a href="/reference/">Voir les 53 badges</a></p>`:''}`
    :`<h2 class="bd-h2">Badges débloqués</h2>
    <p class="sub">Aucun badge avec ces attributs. <a href="/reference/">Vois ce que chacun demande</a>.</p>`}

    ${cbPlan.length?`<h2 class="bd-h2">Guide Cap Breaker</h2>
    <p class="sub">Ordre d'application recommandé par le créateur.</p>
    <ol class="bd-cb">${cbPlan.map((s,i)=>`<li><span>CB #${i+1}</span><b>${esc(s.attr||'')}</b><em>+${+s.gain||1}</em></li>`).join('')}</ol>`:''}

    <div class="bd-stats">
      <span><b>${row.views||0}</b> vues</span>
      <span><b>${row.likes||0}</b> j'aime</span>
      <span><b>${row.cap_breakers||0}</b> cap breakers</span>
    </div>

    <div class="bd-pied">
      ${auteur?`<a class="build-auteur" href="/u/${encodeURIComponent(auteur.slug)}">`
        +`${auteur.avatar?`<img src="/avatar/${encodeURIComponent(auteur.slug)}" alt="" width="28" height="28" loading="lazy">`:''}`
        +`<span>Publié par <b>${esc(auteur.pseudo)}</b></span></a>`
        :`<span class="build-auteur build-auteur-sans">Publié sans compte</span>`}
      <a class="cta" href="/?b=${encodeURIComponent(id)}">Ouvrir ce build dans le builder</a>
    </div>
  </article>

  <!-- Ouvrir le build sur son téléphone : c'est là qu'on a NBA 2K HQ sous la
       main, et recopier une adresse à la main n'arrive jamais. -->
  <aside class="panel bd-qr">
    <h2>Ouvrir sur ton téléphone</h2>
    <p class="sub">Scanne ce code pour retrouver ce build sur mobile${row.hq_link?', puis ouvre le lien NBA 2K HQ ci-dessus':''}.</p>
    <div id="bdQr" class="bd-qr-image" data-lien="${esc(canonical)}"></div>
  </aside>
</main>
<footer>
  <p>NBA 2K27 Build Lab — outil indépendant, données publiques, aucune affiliation officielle avec 2K.</p>
  <nav class="footer-plan" aria-label="Plan du site">
    <div><b>Créer</b><a href="/">Builder</a><a href="/hub/?onglet=trios">Trios</a><a href="/mon-build/">Mon build</a></div>
    <div><b>Comprendre</b><a href="/reference/">Les 53 badges</a><a href="/animations/">Les animations par catégorie</a><a href="/hub/?onglet=reels">Builds réels</a></div>
    <div><b>Communauté</b><a href="/hub/">Builds publiés</a></div>
  </nav>
  <p class="footer-legal"><a href="/mentions-legales/">Mentions légales et confidentialité</a> · <a href="mailto:contact@lelabodesbuilds.com">Signaler une erreur de données</a></p>
</footer>
<script src="/qr.js"></script>
<script src="/fiche-build.js"></script>
<script src="/mesure.js"></script>
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
