/* Comptage des visites, sans cookie et sans traceur.
 *
 * Ce que le site enregistre : un compteur par jour, page, langue, type
 * d'appareil et provenance. Aucune ligne ne décrit une personne, rien n'est
 * envoyé à l'extérieur, et il n'y a donc pas de bandeau à afficher.
 *
 * Les visiteurs uniques sont comptés par une empreinte qui change chaque jour,
 * calculée à partir de l'adresse IP, du navigateur, de la date et de la clé du
 * serveur. Elle ne peut pas être inversée, ne suit personne d'un jour à l'autre,
 * et sert uniquement à ne pas compter deux fois la même personne le même jour.
 */
import { json, sha256 } from './_utils.js';

const PURGE_JOURS = 7;

/* Les pages de profil sont regroupées sous « /u/ » : une ligne par pseudo
   ferait grossir la table sans rien apprendre, et rapprocherait la mesure
   d'une personne. Idem pour les fiches de build. */
function cheminNormalise(brut) {
  let c = String(brut || '/').split('?')[0].split('#')[0].slice(0, 120);
  if (!c.startsWith('/')) c = '/' + c;
  c = c.replace(/^\/en(?=\/|$)/, '') || '/';
  if (/^\/u\/./.test(c)) return '/u/';
  if (/^\/b\/./.test(c)) return '/b/';
  return c;
}

/* On ne garde que le domaine d'où vient le visiteur : « google.com », pas
   l'adresse complète de la page qui pouvait contenir sa recherche. */
function sourceDe(referrer, origine) {
  if (!referrer) return 'direct';
  try {
    const u = new URL(referrer);
    if (u.origin === origine) return 'interne';
    return u.hostname.replace(/^www\./, '').slice(0, 60) || 'direct';
  } catch { return 'direct'; }
}

/* Un robot n'est pas un visiteur — et nos propres tests de production passent
   par un navigateur sans fenêtre, qu'il ne faut surtout pas compter. */
function estRobot(ua) {
  return !ua || /bot|crawl|spider|slurp|headless|preview|monitor|curl|wget|python|node-fetch|lighthouse/i.test(ua);
}

export async function onRequestPost({ request, env }) {
  // Une mesure qui échoue ne doit jamais gêner la navigation : on répond
  // toujours « c'est noté », même quand il n'y a rien à noter.
  const ok = () => json({ ok: true }, 200, { 'cache-control': 'no-store' });
  if (!env.DB || !env.SESSION_SECRET) return ok();

  const ua = request.headers.get('user-agent') || '';
  if (estRobot(ua)) return ok();

  let corps; try { corps = await request.json(); } catch { return ok(); }

  const url = new URL(request.url);
  const chemin = cheminNormalise(corps && corps.chemin);
  const langue = corps && corps.langue === 'en' ? 'en' : 'fr';
  const appareil = corps && corps.mobile ? 'mobile' : 'ordinateur';
  const source = sourceDe(corps && corps.source, url.origin);
  const jour = new Date().toISOString().slice(0, 10);

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '';
  const empreinte = (await sha256(`${ip}|${ua}|${jour}|${env.SESSION_SECRET}`)).slice(0, 32);

  // Premier passage de la journée pour cette empreinte ? Alors c'est un
  // visiteur de plus ; sinon, seulement une page vue de plus.
  const pose = await env.DB.prepare(
    'INSERT OR IGNORE INTO visiteurs_jour (jour, empreinte) VALUES (?,?)'
  ).bind(jour, empreinte).run();
  const nouveau = pose.meta && pose.meta.changes ? 1 : 0;

  await env.DB.prepare(
    `INSERT INTO mesures (jour, chemin, langue, appareil, source, vues, visiteurs)
     VALUES (?,?,?,?,?,1,?)
     ON CONFLICT(jour, chemin, langue, appareil, source)
     DO UPDATE SET vues = vues + 1, visiteurs = visiteurs + ?`
  ).bind(jour, chemin, langue, appareil, source, nouveau, nouveau).run();

  // Ménage occasionnel : les empreintes ne servent qu'à la journée en cours,
  // on ne les garde pas. Une fois sur vingt suffit à tenir la table courte.
  if (Math.random() < 0.05) {
    const limite = new Date(Date.now() - PURGE_JOURS * 86400000).toISOString().slice(0, 10);
    await env.DB.prepare('DELETE FROM visiteurs_jour WHERE jour < ?').bind(limite).run();
  }

  return ok();
}
