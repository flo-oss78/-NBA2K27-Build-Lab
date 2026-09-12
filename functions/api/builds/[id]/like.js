import {json, now, clientHash, rateLimit} from '../../_utils.js';
export async function onRequestPost({params,env,request}){
 if(!env.DB)return json({error:'D1 database is not configured.'},503);
 const throttle=await rateLimit(env,request,'like',30);
 if(!throttle.ok)return json({error:'Trop de likes. Réessaie dans une minute.'},429,{'retry-after':'60'});
 const visitor=await clientHash(request); const id=params.id;
 const exists=await env.DB.prepare('SELECT id FROM builds WHERE id=?').bind(id).first();
 if(!exists)return json({error:'Build not found.'},404);
 try{await env.DB.prepare('INSERT INTO build_likes (build_id,visitor_hash,created_at) VALUES (?,?,?)').bind(id,visitor,now()).run();}
 catch(e){
  // Seule la violation de contrainte unique (déjà liké par ce visiteur) est un cas normal ;
  // toute autre erreur D1 (verrou, quota…) doit remonter, pas être confondue avec un succès.
  if(String(e&&e.message||'').toLowerCase().includes('unique')) return json({ok:true,alreadyLiked:true});
  return json({error:'Le like a échoué. Réessaie.'},500);
 }
 await env.DB.prepare('UPDATE builds SET likes=likes+1 WHERE id=?').bind(id).run();
 const row=await env.DB.prepare('SELECT likes FROM builds WHERE id=?').bind(id).first();
 return json({ok:true,likes:row.likes});
}
