import {json, now, id, clientHash, clampText, rateLimit} from '../../_utils.js';

const MAX_BODY = 4000;
export async function onRequestGet({params,env}){
 if(!env.DB)return json({error:'D1 database is not configured.'},503);
 const exists=await env.DB.prepare('SELECT id FROM builds WHERE id=?').bind(params.id).first();
 if(!exists)return json({error:'Build not found.'},404);
 const {results}=await env.DB.prepare('SELECT id,nickname,body,created_at FROM comments WHERE build_id=? ORDER BY created_at DESC LIMIT 100').bind(params.id).all();
 return json({comments:results});
}
export async function onRequestPost({params,env,request}){
 if(!env.DB)return json({error:'D1 database is not configured.'},503);
 const throttle=await rateLimit(env,request,'comment',10);
 if(!throttle.ok)return json({error:'Trop de commentaires. Réessaie dans une minute.'},429,{'retry-after':'60'});
 const text=await request.text();
 if(text.length>MAX_BODY)return json({error:'Payload too large.'},413);
 let b; try{b=JSON.parse(text)}catch{return json({error:'Invalid JSON.'},400)}
 const nickname=clampText(b.nickname,24)||'Anonyme';
 const body=clampText(b.body,500);
 if(!body)return json({error:'Commentaire vide.'},400);
 const exists=await env.DB.prepare('SELECT id FROM builds WHERE id=?').bind(params.id).first();
 if(!exists)return json({error:'Build not found.'},404);
 const comment={id:id('comment'),build_id:params.id,nickname,body,visitor_hash:await clientHash(request),created_at:now()};
 await env.DB.prepare('INSERT INTO comments (id,build_id,nickname,body,visitor_hash,created_at) VALUES (?,?,?,?,?,?)').bind(comment.id,comment.build_id,comment.nickname,comment.body,comment.visitor_hash,comment.created_at).run();
 return json({comment:{id:comment.id,nickname,body,created_at:comment.created_at}},201);
}
