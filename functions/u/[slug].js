/* /u/<pseudo> : une seule page pour tous les profils.
 *
 * La règle « /u/* → /u/index.html 200 » de _redirects ne s'applique pas ici :
 * Cloudflare a renvoyé un 404 sur /u/flo787 alors que /u/ répondait. Une
 * fonction, elle, est sans ambiguïté — elle sert la page du dossier et laisse
 * profil.js lire le pseudo dans l'adresse, qui reste celle que le visiteur a
 * ouverte.
 */
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  url.pathname = '/u/';
  url.search = '';
  const page = await env.ASSETS.fetch(new Request(url.toString(), { headers: request.headers }));
  // Le corps est celui de /u/ ; on garde le statut 200 et le type d'origine.
  return new Response(page.body, {
    status: page.status,
    headers: page.headers
  });
}
