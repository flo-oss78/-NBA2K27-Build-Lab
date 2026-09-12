/* Sitemap dynamique.
   Le sitemap statique ne listait que la page d'accueil : les pages /b/<id>,
   qui sont précisément ce qui peut être indexé, restaient invisibles pour
   Google. Cette Function remplace le fichier statique et liste les builds
   publiés, les plus récemment mis à jour en premier. */

import {escHtml as esc} from './api/_utils.js';

const MAX_URLS = 5000;

function iso(ms){
  const d = new Date(Number(ms) || Date.now());
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function onRequestGet({request, env}){
  const origin = new URL(request.url).origin;
  const urls = [
    `<url><loc>${esc(origin)}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`
  ];

  // Sans base configurée, on renvoie quand même un sitemap valide :
  // un 500 ferait échouer la soumission dans la Search Console.
  if(env.DB){
    try{
      const {results} = await env.DB.prepare(
        `SELECT id, updated_at FROM builds ORDER BY updated_at DESC LIMIT ?`
      ).bind(MAX_URLS).all();
      for(const row of (results || [])){
        urls.push(
          `<url><loc>${esc(origin)}/b/${encodeURIComponent(row.id)}</loc>` +
          `<lastmod>${iso(row.updated_at)}</lastmod>` +
          `<changefreq>weekly</changefreq><priority>0.7</priority></url>`
        );
      }
    }catch(e){ /* on dégrade vers le sitemap minimal */ }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ` +
    urls.join('\n  ') + `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600'
    }
  });
}
