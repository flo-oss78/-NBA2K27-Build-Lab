/* Suivre un auteur, ou cesser de le suivre.
 *
 * Suivre quelqu'un n'est pas un « j'aime » anonyme : il faut un compte, sinon
 * le compteur ne voudrait rien dire et n'importe qui pourrait le gonfler.
 * Personne ne peut se suivre soi-même.
 */
import { json, clampText, now } from './_utils.js';
import { utilisateurConnecte } from './_session.js';

async function auteurDe(env, slug) {
  return env.DB.prepare('SELECT id, blocked FROM users WHERE slug=?').bind(slug).first();
}

async function compter(env, auteurId) {
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM follows WHERE author_id=?')
    .bind(auteurId).first();
  return (r && r.n) || 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503);
  const visiteur = await utilisateurConnecte(request, env);
  if (!visiteur) return json({ error: 'Connecte-toi pour suivre un joueur.' }, 401);

  let corps; try { corps = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const slug = clampText(corps && corps.slug, 40).toLowerCase();
  const auteur = await auteurDe(env, slug);
  if (!auteur || auteur.blocked) return json({ error: 'Profil introuvable.' }, 404);
  if (auteur.id === visiteur.id) return json({ error: 'On ne se suit pas soi-même.' }, 400);

  // OR IGNORE : recliquer deux fois ne crée pas deux liens ni une erreur.
  await env.DB.prepare(
    'INSERT OR IGNORE INTO follows (follower_id, author_id, created_at) VALUES (?,?,?)'
  ).bind(visiteur.id, auteur.id, now()).run();

  return json({ suivi: true, abonnes: await compter(env, auteur.id) });
}

export async function onRequestDelete({ request, env }) {
  if (!env.DB) return json({ error: 'D1 database is not configured.' }, 503);
  const visiteur = await utilisateurConnecte(request, env);
  if (!visiteur) return json({ error: 'Connecte-toi pour suivre un joueur.' }, 401);

  const slug = clampText(new URL(request.url).searchParams.get('slug'), 40).toLowerCase();
  const auteur = await auteurDe(env, slug);
  if (!auteur) return json({ error: 'Profil introuvable.' }, 404);

  await env.DB.prepare('DELETE FROM follows WHERE follower_id=? AND author_id=?')
    .bind(visiteur.id, auteur.id).run();

  return json({ suivi: false, abonnes: await compter(env, auteur.id) });
}
