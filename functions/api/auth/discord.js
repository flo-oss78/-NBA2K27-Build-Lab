/* Départ de la connexion Discord.
 *
 * On envoie le joueur chez Discord avec la portée « identify » seulement :
 * identifiant, pseudo, avatar. Pas d'e-mail, pas de liste de serveurs — le
 * minimum pour qu'un profil soit reconnaissable sur le site.
 *
 * Le paramètre « state » est un jeton à usage unique, posé en cookie et
 * revérifié au retour : sans lui, n'importe quel site pourrait déclencher une
 * connexion à l'insu du joueur.
 */
import { json } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  if (!env.DISCORD_CLIENT_ID || !env.SESSION_SECRET) {
    return json({ error: 'La connexion Discord n’est pas configurée sur ce site.' }, 503);
  }
  const origine = new URL(request.url).origin;
  const state = crypto.randomUUID();
  // D'où venait le joueur : on l'y ramène après la connexion, sans jamais sortir du site.
  const retour = new URL(request.url).searchParams.get('retour') || '/hub/';
  const depuis = retour.startsWith('/') && !retour.startsWith('//') ? retour : '/hub/';

  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${origine}/api/auth/retour`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'none');   // déjà connecté à Discord : rien à recliquer

  return new Response(null, {
    status: 302,
    headers: {
      location: url.toString(),
      'set-cookie': `nbabl_oauth=${state}|${encodeURIComponent(depuis)}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      'cache-control': 'no-store'
    }
  });
}
