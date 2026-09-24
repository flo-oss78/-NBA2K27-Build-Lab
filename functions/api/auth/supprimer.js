/* Supprimer son compte.
 *
 * Tout ce que le site sait de la personne disparaît : l'identifiant Discord,
 * le pseudo, l'avatar, l'adresse publique, et les liens d'abonnement dans les
 * deux sens. Ce qui reste, ce sont les builds qu'elle a publiés — détachés de
 * son compte et rendus anonymes, pour ne pas casser les liens que d'autres ont
 * pu partager ou mettre en favori. Qui veut aussi les retirer nous écrit.
 *
 * Le compte est supprimé, pas désactivé : se reconnecter avec Discord crée un
 * compte neuf, avec une nouvelle adresse publique.
 */
import { json } from '../_utils.js';
import { utilisateurConnecte, cookieEfface } from '../_session.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503);
  const compte = await utilisateurConnecte(request, env);
  if (!compte) return json({ error: 'Personne n’est connecté.' }, 401);

  // Les builds d'abord : si la suite échoue, aucun build n'est resté rattaché
  // à un compte effacé.
  await env.DB.prepare("UPDATE builds SET author_id='', author='' WHERE author_id=?")
    .bind(compte.id).run();
  await env.DB.prepare('DELETE FROM follows WHERE follower_id=? OR author_id=?')
    .bind(compte.id, compte.id).run();
  await env.DB.prepare('DELETE FROM users WHERE id=?').bind(compte.id).run();

  return json({ supprime: true }, 200, { 'set-cookie': cookieEfface() });
}
