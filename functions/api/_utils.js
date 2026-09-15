export const json = (data, status=200, extraHeaders={}) => new Response(JSON.stringify(data), {
  status,
  headers: {"content-type":"application/json; charset=utf-8", "cache-control":"no-store", ...extraHeaders}
});

export async function sha256(value){
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export function now(){ return Date.now(); }
export function id(prefix='b'){ return `${prefix}_${crypto.randomUUID()}`; }

export function clientHash(request){
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  // This is a pseudonymous abuse-prevention key, not an identity.
  return sha256(ip + '|nba-build-lab-v2');
}

export function ownerHash(token){ return sha256(String(token||'')); }
export function clampText(v,max){ return String(v??'').trim().slice(0,max); }
export function validPosition(p){ return ['PG','SG','SF','PF','C'].includes(p); }

// Échappement partagé pour le HTML (functions/b/[id].js) et le XML (sitemap.xml.js) :
// les références numériques (&#39; etc.) sont valides dans les deux, inutile de dupliquer.
export function escHtml(v){
  return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Forme publique d'une ligne `builds` — partagée entre GET /api/builds (liste)
// et GET/PATCH /api/builds/:id (détail) pour qu'un champ exposé ajouté un jour
// le soit forcément aux deux endroits en même temps.
export function publicBuild(row){
  return {
    id: row.id, name: row.name, position: row.position, height: row.height, weight: row.weight,
    wing: row.wing, score: row.score, style: row.style, attributes: JSON.parse(row.attributes_json),
    badges: row.badges, animations: row.animations, capBreakers: row.cap_breakers,
    validated: !!row.validated, views: row.views, likes: row.likes,
    rating: row.rating_count ? Math.round((row.rating_sum/row.rating_count)*10)/10 : 0,
    ratingCount: row.rating_count, created: row.created_at,
    url: `/b/${encodeURIComponent(row.id)}`,
    ...publicMeta(row)
  };
}

export const ATTRIBUTE_NAMES = Object.freeze([
  'Close Shot','Driving Layup','Driving Dunk','Standing Dunk','Post Control',
  'Mid-Range','Three-Point','Free Throw','Pass Accuracy','Ball Handle','Speed With Ball',
  'Interior Defense','Perimeter Defense','Steal','Block','Offensive Rebound','Defensive Rebound',
  'Speed','Agility','Strength','Vertical'
]);

export function finiteInt(v,min,max){
  const n=Number(v);
  return Number.isInteger(n) && n>=min && n<=max;
}

export function validateBuildInput(b){
  const errors=[];
  if(!b || typeof b!=='object') return ['Invalid build payload.'];
  if(!validPosition(b.position)) errors.push('Invalid position.');
  if(!finiteInt(b.height,69,88)) errors.push('Height out of Builder range.');
  if(!finiteInt(b.weight,160,300)) errors.push('Weight out of Builder range.');
  if(!finiteInt(b.wing,69,96)) errors.push('Wingspan out of Builder range.');
  if(!b.attributes || typeof b.attributes!=='object' || Array.isArray(b.attributes)) errors.push('Attributes object required.');
  else{
    // L'endurance n'existe pas dans NBA 2K27 : ignorée si une ancienne version du site l'envoie.
    delete b.attributes.Stamina;
    const keys=Object.keys(b.attributes);
    const unknown=keys.filter(k=>!ATTRIBUTE_NAMES.includes(k));
    if(unknown.length) errors.push('Unknown attributes: '+unknown.slice(0,3).join(', '));
    for(const name of ATTRIBUTE_NAMES){
      if(b.attributes[name]===undefined) b.attributes[name]=25;
      if(!finiteInt(b.attributes[name],25,99)) errors.push(`Invalid attribute: ${name}.`);
    }
  }
  for(const [key,max] of [['score',99],['badges',53],['animations',10000],['capBreakers',ATTRIBUTE_NAMES.length*5]]){
    if(b[key]!==undefined && !finiteInt(b[key],0,max)) errors.push(`Invalid ${key}.`);
  }
  return errors;
}

/**
 * Minute-bucket D1 throttle. It intentionally uses a bucket in the primary key
 * so a new minute never inherits the previous count.
 */
export async function rateLimit(env,request,action,maxPerMinute){
  if(!env.DB) return {ok:true};
  const visitor=await clientHash(request);
  const bucket=Math.floor(now()/60000);
  const key=`${action}:${visitor}:${bucket}`;
  await env.DB.prepare(
    `INSERT INTO api_rate_limits (key,action,visitor_hash,bucket,count,created_at)
     VALUES (?,?,?,?,1,?)
     ON CONFLICT(key) DO UPDATE SET count=count+1`
  ).bind(key,action,visitor,bucket,now()).run();
  const row=await env.DB.prepare('SELECT count FROM api_rate_limits WHERE key=?').bind(key).first();
  // Purge opportuniste : sans elle, la table grossit indéfiniment.
  if(Math.random()<0.02){
    try{ await env.DB.prepare('DELETE FROM api_rate_limits WHERE bucket < ?').bind(bucket-60).run(); }catch(e){}
  }
  return {ok:!row || row.count<=maxPerMinute, count:row?.count||1, limit:maxPerMinute};
}

/* ---------------------------------------------------------------------------
   V24 — métadonnées de build (description, étiquettes, modes, guide Cap Breaker,
   lien d'import NBA 2K HQ). Ces champs existent en base depuis la migration 0003
   mais n'étaient ni acceptés ni écrits par l'API : la page publique /b/<id> les
   lisait donc toujours vides. Cette section les valide et les normalise.
--------------------------------------------------------------------------- */

export const BUILD_MODES = Object.freeze(['park','rec','proam','1v1','mycareer']);

/** Seul 2K peut produire un lien d'import valide : tout autre domaine est refusé. */
export function sanitizeHqLink(value){
  const raw = String(value ?? '').trim();
  if(!raw) return '';
  let u;
  try{ u = new URL(raw); }catch{ return ''; }
  if(u.protocol !== 'https:') return '';
  const host = u.hostname.toLowerCase();
  if(host !== 'nba.2k.com' && !host.endsWith('.nba.2k.com')) return '';
  return u.toString().slice(0, 900);
}

function stringList(value, {max, itemMax}){
  if(!Array.isArray(value)) return [];
  const out = [];
  for(const item of value){
    const s = clampText(item, itemMax);
    if(s && !out.includes(s)) out.push(s);
    if(out.length >= max) break;
  }
  return out;
}

/** Étapes du guide Cap Breaker : {attr, gain}. L'ordre du tableau est le plan. */
function capBreakerPlan(value){
  if(!Array.isArray(value)) return [];
  const out = [];
  for(const step of value.slice(0, 30)){
    if(!step || typeof step !== 'object') continue;
    const attr = clampText(step.attr, 40);
    if(!ATTRIBUTE_NAMES.includes(attr)) continue;
    const gain = Number(step.gain);
    out.push({attr, gain: Number.isFinite(gain) ? Math.min(Math.max(Math.round(gain), 1), 5) : 1});
  }
  return out;
}

/**
 * Normalise les métadonnées envoyées par le client. Jamais d'exception :
 * une fiche malformée doit dégrader vers des valeurs vides, pas casser
 * la publication d'un build par ailleurs valide.
 */
export function normalizeBuildMeta(b){
  const source = (b && typeof b === 'object') ? b : {};
  return {
    author: clampText(source.author, 40),
    description: clampText(source.description, 400),
    tags: stringList(source.tags, {max: 3, itemMax: 40}),
    modes: stringList(source.modes, {max: BUILD_MODES.length, itemMax: 20})
      .filter(m => BUILD_MODES.includes(m)),
    inspiredBy: clampText(source.inspiredBy ?? source.inspired, 60),
    hqLink: sanitizeHqLink(source.hqLink ?? source.hq),
    capBreakerPlan: capBreakerPlan(source.capBreakerPlan ?? source.cbPlan),
    season: clampText(source.season, 8) || 'S1'
  };
}

/** Slug lisible pour les URLs et le référencement. */
export function slugify(name){
  return String(name ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Champs V24 exposés publiquement, partagés par tous les endpoints. */
export function publicMeta(row){
  const parse = (value, fallback) => {
    try{ const v = JSON.parse(value || ''); return v ?? fallback; }catch{ return fallback; }
  };
  return {
    author: row.author || '',
    description: row.description || '',
    tags: parse(row.tags_json, []),
    modes: parse(row.modes_json, []),
    inspiredBy: row.inspired_by || '',
    hqLink: row.hq_link || '',
    capBreakerPlan: parse(row.cb_plan_json, []),
    season: row.season || 'S1',
    slug: row.slug || ''
  };
}
