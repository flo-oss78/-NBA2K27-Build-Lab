/* L'avatar d'un joueur, servi par le site.
 *
 * Deux raisons de ne pas pointer directement sur le CDN de Discord :
 *
 * 1. L'adresse d'un avatar Discord contient l'identifiant Discord de la
 *    personne. La mettre dans une page publique reviendrait à publier cet
 *    identifiant, alors qu'on promet le contraire — et il permet de retrouver
 *    quelqu'un ailleurs.
 * 2. Chaque visiteur d'un profil enverrait sa requête à Discord, donc son
 *    adresse IP, pour une image. Ici, Discord ne voit que notre serveur.
 *
 * La Content-Security-Policy du site peut donc rester « img-src 'self' data: ».
 */
const JOUR = 86400;

export async function onRequest({ request, env, params }) {
  if (!env.DB) return new Response(null, { status: 404 });
  const slug = String(params.slug || '').toLowerCase().slice(0, 40);
  if (!slug) return new Response(null, { status: 404 });

  const u = await env.DB.prepare('SELECT discord_id, avatar, blocked FROM users WHERE slug=?')
    .bind(slug).first();
  if (!u || u.blocked || !u.avatar) return new Response(null, { status: 404 });

  // Le hash d'avatar vient de Discord, mais il arrive par le réseau : on ne
  // laisse passer que ce qui a la forme attendue, pour ne pas fabriquer une
  // adresse à partir de n'importe quoi.
  if (!/^[a-f0-9_]{1,64}$/i.test(u.avatar) || !/^\d{15,25}$/.test(String(u.discord_id))) {
    return new Response(null, { status: 404 });
  }

  const taille = new URL(request.url).searchParams.get('t') === '128' ? 128 : 64;
  const source = `https://cdn.discordapp.com/avatars/${u.discord_id}/${u.avatar}.png?size=${taille}`;

  const image = await fetch(source, { cf: { cacheTtl: JOUR, cacheEverything: true } });
  if (!image.ok) return new Response(null, { status: 404 });

  return new Response(image.body, {
    status: 200,
    headers: {
      'content-type': image.headers.get('content-type') || 'image/png',
      'cache-control': `public, max-age=${JOUR}`,
      'x-content-type-options': 'nosniff'
    }
  });
}
