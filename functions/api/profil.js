/* Le profil public d'un joueur : qui il est, ce qu'il a publié.
 *
 * Tout ce qui sort d'ici est déjà public : le pseudo et l'avatar que la
 * personne a choisis sur Discord, et les builds qu'elle a décidé de publier.
 * L'identifiant Discord, lui, ne quitte jamais la base — c'est ce qui
 * permettrait de la retrouver ailleurs.
 */
import { json, clampText, publicBuild } from './_utils.js';
import { utilisateurConnecte, profilPublic } from './_session.js';

const MAX_BUILDS = 60;

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503);
  const url = new URL(request.url);
  const slug = clampText(url.searchParams.get('slug'), 40).toLowerCase();
  if (!slug) return json({ error: 'Profil introuvable.' }, 400);

  const auteur = await env.DB.prepare(
    'SELECT id, discord_id, pseudo, avatar, slug, created_at, blocked FROM users WHERE slug=?'
  ).bind(slug).first();
  // Un compte bloqué se comporte comme un compte qui n'existe pas : pas de
  // page, pas de builds, et rien qui dise qu'il a existé.
  if (!auteur || auteur.blocked) return json({ error: 'Profil introuvable.' }, 404);

  const visiteur = await utilisateurConnecte(request, env);

  const { results: builds } = await env.DB.prepare(
    `SELECT * FROM builds WHERE author_id=? ORDER BY updated_at DESC LIMIT ?`
  ).bind(auteur.id, MAX_BUILDS).all();

  const abonnes = await env.DB.prepare('SELECT COUNT(*) AS n FROM follows WHERE author_id=?')
    .bind(auteur.id).first();

  let suivi = false;
  if (visiteur && visiteur.id !== auteur.id) {
    const f = await env.DB.prepare('SELECT 1 AS x FROM follows WHERE follower_id=? AND author_id=?')
      .bind(visiteur.id, auteur.id).first();
    suivi = !!f;
  }

  return json({
    profil: profilPublic(auteur),
    builds: builds.map(publicBuild),
    abonnes: (abonnes && abonnes.n) || 0,
    suivi,
    cestMoi: !!visiteur && visiteur.id === auteur.id
  });
}
