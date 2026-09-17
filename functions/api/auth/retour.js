/* Retour de Discord : on reconnaît le joueur, on ouvre sa session.
 *
 * Le jeton d'accès Discord sert une seule fois, ici, pour lire l'identité —
 * puis il est jeté. Rien de Discord n'est conservé hormis l'identifiant, le
 * pseudo et l'empreinte d'avatar, c'est-à-dire ce qu'il faut pour afficher un
 * profil et le reconnaître à la visite suivante.
 */
import { json, now, id as nouvelId, clampText } from '../_utils.js';
import { cookiesDe, creerSession, cookieSession, connexionConfiguree } from '../_session.js';

function pseudoVersSlug(pseudo, discordId) {
  const base = String(pseudo || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  // Un pseudo vide ou déjà pris se distingue par la fin de l'identifiant Discord.
  return base || `joueur-${String(discordId).slice(-6)}`;
}

function versPage(chemin, cookies = []) {
  return new Response(null, {
    status: 302,
    headers: { location: chemin, 'cache-control': 'no-store', ...(cookies.length ? { 'set-cookie': cookies[0] } : {}) }
  });
}

export async function onRequestGet({ request, env }) {
  if (!connexionConfiguree(env)) {
    return json({ error: 'La connexion Discord n’est pas configurée sur ce site.' }, 503);
  }
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const brut = cookiesDe(request)['nbabl_oauth'] || '';
  const [attendu, depuisBrut] = brut.split('|');
  const depuis = decodeURIComponent(depuisBrut || '/hub/');

  // Refus de Discord, ou state absent/différent : on ne va pas plus loin.
  if (!code || !state || !attendu || state !== attendu) {
    return versPage(`${depuis}${depuis.includes('?') ? '&' : '?'}connexion=echec`);
  }

  // 1. Le code contre un jeton d'accès.
  const reponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${url.origin}/api/auth/retour`
    })
  });
  if (!reponse.ok) return versPage(`${depuis}${depuis.includes('?') ? '&' : '?'}connexion=echec`);
  const jeton = await reponse.json();

  // 2. L'identité, puis on oublie le jeton.
  const moi = await fetch('https://discord.com/api/users/@me', {
    headers: { authorization: `Bearer ${jeton.access_token}` }
  });
  if (!moi.ok) return versPage(`${depuis}${depuis.includes('?') ? '&' : '?'}connexion=echec`);
  const profil = await moi.json();
  const discordId = String(profil.id || '');
  if (!discordId) return versPage(`${depuis}${depuis.includes('?') ? '&' : '?'}connexion=echec`);

  const pseudo = clampText(profil.global_name || profil.username || 'Joueur', 32);
  const avatar = clampText(profil.avatar || '', 64);
  const t = now();

  // 3. Compte existant, ou création.
  let compte = await env.DB.prepare('SELECT id, slug, blocked FROM users WHERE discord_id=?').bind(discordId).first();
  if (compte && compte.blocked) {
    return versPage(`${depuis}${depuis.includes('?') ? '&' : '?'}connexion=bloque`);
  }
  if (compte) {
    await env.DB.prepare('UPDATE users SET pseudo=?, avatar=?, seen_at=? WHERE id=?')
      .bind(pseudo, avatar, t, compte.id).run();
  } else {
    const userId = nouvelId('u');
    let slug = pseudoVersSlug(pseudo, discordId);
    // Deux joueurs peuvent porter le même nom : l'adresse publique, elle, est unique.
    const pris = await env.DB.prepare('SELECT id FROM users WHERE slug=?').bind(slug).first();
    if (pris) slug = `${slug}-${String(discordId).slice(-4)}`;
    await env.DB.prepare(
      'INSERT INTO users (id, discord_id, pseudo, avatar, slug, created_at, seen_at, blocked) VALUES (?,?,?,?,?,?,?,0)'
    ).bind(userId, discordId, pseudo, avatar, slug, t, t).run();
    compte = { id: userId, slug };
  }

  const session = await creerSession(compte.id, env.SESSION_SECRET);
  return new Response(null, {
    status: 302,
    headers: {
      location: `${depuis}${depuis.includes('?') ? '&' : '?'}connexion=ok`,
      'cache-control': 'no-store',
      'set-cookie': cookieSession(session)
    }
  });
}
