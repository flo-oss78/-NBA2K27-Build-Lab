import {json, now, id, ownerHash, clampText, validateBuildInput, rateLimit,
        normalizeBuildMeta, publicBuild, validPosition, slugify} from './_utils.js';

const MAX_BODY = 12000;

export async function onRequestGet({request, env}){
  if(!env.DB) return json({error:'D1 database is not configured.'},503);
  const u = new URL(request.url);
  const q = clampText(u.searchParams.get('q'),80).toLowerCase();
  const pos = u.searchParams.get('position') || 'all';
  const style = u.searchParams.get('style') || 'all';
  const mode = clampText(u.searchParams.get('mode'),20);
  const validated = u.searchParams.get('validated') === '1';
  const withCapBreakers = u.searchParams.get('capBreakers') === '1';
  const limit = Math.min(Math.max(parseInt(u.searchParams.get('limit')||'50',10),1),100);
  // 'trending' divise l'engagement par l'ancienneté : un build récent qui décolle
  // passe devant un ancien qui dort.
  const sortMap = {
    score:'score DESC', new:'created_at DESC', views:'views DESC',
    likes:'likes DESC', height:'height DESC', trending:'updated_at DESC, likes DESC'
  };
  const order = sortMap[u.searchParams.get('sort')] || sortMap.score;
  const clauses=[]; const args=[];
  if(q){ clauses.push('(lower(name) LIKE ? OR lower(style) LIKE ? OR lower(position) LIKE ?)'); const like=`%${q}%`; args.push(like,like,like); }
  if(validPosition(pos)){ clauses.push('position=?'); args.push(pos); }
  if(style && style!=='all'){ clauses.push('style=?'); args.push(style); }
  if(mode){ clauses.push('modes_json LIKE ?'); args.push(`%"${mode}"%`); }
  if(validated){ clauses.push('validated=1'); }
  if(withCapBreakers){ clauses.push('cap_breakers>0'); }
  const where=clauses.length?'WHERE '+clauses.join(' AND '):'';
  const stmt=env.DB.prepare(`SELECT * FROM builds ${where} ORDER BY ${order} LIMIT ?`).bind(...args,limit);
  const {results}=await stmt.all();
  return json({builds:results.map(publicBuild)});
}

export async function onRequestPost({request, env}){
  if(!env.DB) return json({error:'D1 database is not configured.'},503);
  const throttle=await rateLimit(env,request,'build-create',10);
  if(!throttle.ok) return json({error:'Trop de publications. Réessaie dans une minute.'},429,{'retry-after':'60'});

  const text=await request.text();
  if(text.length>MAX_BODY) return json({error:'Payload too large.'},413);
  let b; try{ b=JSON.parse(text); }catch{return json({error:'Invalid JSON.'},400);}
  const errors=validateBuildInput(b);
  if(errors.length) return json({error:'Build invalide.',details:errors.slice(0,12)},400);

  const name=clampText(b.name,70); const style=clampText(b.style,30);
  if(!name) return json({error:'Build name required.'},400);

  const meta=normalizeBuildMeta(b.meta ?? b);

  const token=crypto.randomUUID()+crypto.randomUUID();
  const owner_token_hash=await ownerHash(token);
  const idv=id('build'); const t=now();

  // The server does not trust client-provided score/validated flags as proof.
  // Score is retained as a display value but bounded; validation stays false
  // until a future server-side ruleset can verify it authoritatively.
  const row={
    id:idv,name,position:b.position,height:Number(b.height),weight:Number(b.weight),wing:Number(b.wing),
    score:Number(b.score)||0,style,
    attributes_json:JSON.stringify(b.attributes),
    badges:Number(b.badges)||0,animations:Number(b.animations)||0,
    cap_breakers:Number(b.capBreakers)||0,validated:0,
    rating_sum:0,rating_count:0,views:0,likes:0,
    owner_token_hash,created_at:t,updated_at:t,
    author:meta.author,description:meta.description,
    tags_json:JSON.stringify(meta.tags),modes_json:JSON.stringify(meta.modes),
    inspired_by:meta.inspiredBy,hq_link:meta.hqLink,
    cb_plan_json:JSON.stringify(meta.capBreakerPlan),
    season:meta.season,slug:slugify(name)
  };

  await env.DB.prepare(
    `INSERT INTO builds (
       id,name,position,height,weight,wing,score,style,attributes_json,badges,animations,
       cap_breakers,validated,owner_token_hash,created_at,updated_at,
       author,description,tags_json,modes_json,inspired_by,hq_link,cb_plan_json,season,slug
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    row.id,row.name,row.position,row.height,row.weight,row.wing,row.score,row.style,
    row.attributes_json,row.badges,row.animations,row.cap_breakers,row.validated,
    row.owner_token_hash,row.created_at,row.updated_at,
    row.author,row.description,row.tags_json,row.modes_json,row.inspired_by,
    row.hq_link,row.cb_plan_json,row.season,row.slug
  ).run();

  return json({build:publicBuild(row), ownerToken:token},201);
}
