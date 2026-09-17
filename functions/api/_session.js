/* Session de connexion, signée et sans état.
 *
 * Aucun mot de passe n'existe sur ce site : l'identité vient de Discord. Une
 * fois la personne reconnue, on lui pose un cookie signé qui contient seulement
 * son identifiant interne et une date d'expiration. Signé veut dire qu'il est
 * impossible de le fabriquer sans la clé du serveur : personne ne peut se faire
 * passer pour un autre en modifiant son cookie.
 *
 * Pas de table « sessions » : rien à nettoyer, rien à faire expirer en base, et
 * une requête de moins à chaque page. Se déconnecter efface le cookie ; changer
 * SESSION_SECRET invalide toutes les sessions d'un coup.
 */
const COOKIE = 'nbabl_session';
const DUREE = 60 * 60 * 24 * 30;          // 30 jours, en secondes

const b64url = octets => btoa(String.fromCharCode(...new Uint8Array(octets)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function signer(valeur, secret) {
  const cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(valeur)));
}

/* Comparaison à temps constant : comparer deux signatures avec === laisserait
   fuir, par le temps de réponse, l'endroit où elles diffèrent. */
function memeSignature(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function cookiesDe(request) {
  const brut = request.headers.get('cookie') || '';
  const out = {};
  for (const morceau of brut.split(';')) {
    const i = morceau.indexOf('=');
    if (i < 0) continue;
    out[morceau.slice(0, i).trim()] = decodeURIComponent(morceau.slice(i + 1).trim());
  }
  return out;
}

export async function creerSession(userId, secret) {
  const expire = Math.floor(Date.now() / 1000) + DUREE;
  const charge = `${userId}.${expire}`;
  return `${charge}.${await signer(charge, secret)}`;
}

/* Rend l'identifiant du compte connecté, ou null. Ne fait aucune requête. */
export async function lireSession(request, secret) {
  if (!secret) return null;
  const jeton = cookiesDe(request)[COOKIE];
  if (!jeton) return null;
  const bouts = jeton.split('.');
  if (bouts.length !== 3) return null;
  const [userId, expire, signature] = bouts;
  if (!userId || !/^\d+$/.test(expire) || +expire < Math.floor(Date.now() / 1000)) return null;
  const attendue = await signer(`${userId}.${expire}`, secret);
  return memeSignature(signature, attendue) ? userId : null;
}

/* HttpOnly : le JavaScript de la page ne peut pas lire le cookie, donc un script
   injecté ne peut pas le voler. SameSite=Lax : il n'est pas envoyé depuis un
   autre site, ce qui bloque les requêtes forgées. */
export function cookieSession(valeur, secondes = DUREE) {
  return `${COOKIE}=${encodeURIComponent(valeur)}; Path=/; Max-Age=${secondes}; HttpOnly; Secure; SameSite=Lax`;
}
export function cookieEfface() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

/* Le compte connecté, lu en base. null si personne, ou si le compte est bloqué. */
export async function utilisateurConnecte(request, env) {
  const userId = await lireSession(request, env.SESSION_SECRET);
  if (!userId || !env.DB) return null;
  const row = await env.DB.prepare(
    'SELECT id, discord_id, pseudo, avatar, slug, created_at, seen_at, blocked FROM users WHERE id=?'
  ).bind(userId).first();
  if (!row || row.blocked) return null;
  return row;
}

/* Ce que l'interface a le droit de connaître d'un compte. */
export function profilPublic(row) {
  if (!row) return null;
  return {
    pseudo: row.pseudo,
    slug: row.slug,
    avatar: row.avatar
      ? `https://cdn.discordapp.com/avatars/${row.discord_id}/${row.avatar}.png?size=64`
      : '',
    depuis: row.created_at
  };
}

/* La connexion Discord est-elle vraiment réglée ?
 *
 * Il ne suffit pas que les trois valeurs existent : une valeur d'exemple
 * recopiée telle quelle dans le tableau de bord passerait ce test et le site
 * afficherait un bouton qui mène à une page d'erreur de Discord. Un identifiant
 * d'application Discord est un nombre (17 à 20 chiffres) ; les deux clés sont
 * des chaînes longues. Ce contrôle coûte trois comparaisons et évite d'envoyer
 * un joueur dans le mur.
 */
export function connexionConfiguree(env) {
  const id = String(env.DISCORD_CLIENT_ID || '');
  const secret = String(env.DISCORD_CLIENT_SECRET || '');
  const cle = String(env.SESSION_SECRET || '');
  return /^\d{15,25}$/.test(id) && secret.length >= 16 && cle.length >= 16 && !!env.DB;
}
