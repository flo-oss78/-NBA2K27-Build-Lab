import {json, now, ownerHash, clampText, normalizeBuildMeta, publicBuild, slugify, rateLimit} from '../_utils.js';

const MAX_BODY = 12000;

export async function onRequestGet({request,params,env}){
  if(!env.DB) return json({error:'D1 database is not configured.'},503);
  const id=params.id;
  const row=await env.DB.prepare('SELECT * FROM builds WHERE id=?').bind(id).first();
  if(!row) return json({error:'Build not found.'},404);
  // La réponse reste servie même si ce frein bloque l'incrément : seul le
  // compteur de vues (public, non sensible) est concerné.
  const viewThrottle=await rateLimit(env,request,'view-api-'+id,20);
  if(viewThrottle.ok){
    try{ await env.DB.prepare('UPDATE builds SET views=views+1 WHERE id=?').bind(id).run(); row.views++; }catch(e){}
  }
  const comments=await env.DB.prepare(
    'SELECT id,nickname,body,created_at FROM comments WHERE build_id=? ORDER BY created_at DESC LIMIT 100'
  ).bind(id).all();
  return json({build:publicBuild(row),comments:comments.results});
}

export async function onRequestPatch({request,params,env}){
  if(!env.DB) return json({error:'D1 database is not configured.'},503);

  const token=request.headers.get('X-Owner-Token');
  if(!token) return json({error:'Owner token required.'},401);

  const throttle=await rateLimit(env,request,'build-patch',20);
  if(!throttle.ok) return json({error:'Trop de modifications. Réessaie dans une minute.'},429,{'retry-after':'60'});

  const text=await request.text();
  if(text.length>MAX_BODY) return json({error:'Payload too large.'},413);
  let body; try{ body=JSON.parse(text); }catch{ return json({error:'Invalid JSON.'},400); }

  const hash=await ownerHash(token);

  const row=await env.DB.prepare('SELECT * FROM builds WHERE id=?').bind(params.id).first();
  if(!row) return json({error:'Build not found.'},404);
  if(hash!==row.owner_token_hash) return json({error:'Not owner.'},403);

  const name=clampText(body.name,70) || row.name;
  const style=clampText(body.style,30) || row.style;

  // La fiche de build (V24) n'était pas modifiable après publication : le
  // propriétaire ne pouvait ni corriger sa description, ni ajouter son lien
  // NBA 2K HQ. On la remet à jour ici quand le client l'envoie, et on garde
  // les valeurs existantes sinon.
  const hasMeta = body.meta && typeof body.meta === 'object';
  const meta = hasMeta ? normalizeBuildMeta(body.meta) : null;

  await env.DB.prepare(
    `UPDATE builds SET
       name=?, style=?, slug=?,
       author=?, description=?, tags_json=?, modes_json=?,
       inspired_by=?, hq_link=?, cb_plan_json=?, season=?,
       updated_at=?
     WHERE id=?`
  ).bind(
    name, style, slugify(name),
    meta ? meta.author       : (row.author || ''),
    meta ? meta.description  : (row.description || ''),
    meta ? JSON.stringify(meta.tags)            : (row.tags_json || '[]'),
    meta ? JSON.stringify(meta.modes)           : (row.modes_json || '[]'),
    meta ? meta.inspiredBy   : (row.inspired_by || ''),
    meta ? meta.hqLink       : (row.hq_link || ''),
    meta ? JSON.stringify(meta.capBreakerPlan)  : (row.cb_plan_json || '[]'),
    meta ? meta.season       : (row.season || 'S1'),
    now(), params.id
  ).run();

  const updated=await env.DB.prepare('SELECT * FROM builds WHERE id=?').bind(params.id).first();
  return json({ok:true, build:publicBuild(updated)});
}

export async function onRequestDelete({request,params,env}){
  if(!env.DB) return json({error:'D1 database is not configured.'},503);
  const token=request.headers.get('X-Owner-Token');
  if(!token) return json({error:'Owner token required.'},401);

  const throttle=await rateLimit(env,request,'build-delete',20);
  if(!throttle.ok) return json({error:'Trop de suppressions. Réessaie dans une minute.'},429,{'retry-after':'60'});

  const hash=await ownerHash(token);
  const row=await env.DB.prepare('SELECT owner_token_hash FROM builds WHERE id=?').bind(params.id).first();
  if(!row) return json({error:'Build not found.'},404);
  if(hash!==row.owner_token_hash) return json({error:'Not owner.'},403);
  // ON DELETE CASCADE (schema.sql) suppose que la contrainte FK est active sur
  // la connexion qui exécute cette requête, ce que D1 ne garantit pas par
  // requête runtime (PRAGMA foreign_keys=ON n'a été exécuté qu'à la migration).
  // On supprime donc explicitement les lignes dépendantes plutôt que de compter
  // sur le cascade, pour ne jamais laisser de commentaires/likes orphelins.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM comments WHERE build_id=?').bind(params.id),
    env.DB.prepare('DELETE FROM build_likes WHERE build_id=?').bind(params.id),
    env.DB.prepare('DELETE FROM builds WHERE id=?').bind(params.id)
  ]);
  return json({ok:true});
}
