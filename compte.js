/* NBA 2K27 Build Lab — Connexion Discord.
 *
 * Le site marche entièrement sans compte : créer un build, le régler, le
 * partager par lien. Se connecter ne sert qu'à publier sous une identité
 * reconnaissable — pour qu'un joueur puisse retrouver tes builds, voir quand tu
 * les modifies, et te suivre.
 *
 * Aucun mot de passe n'est demandé ni stocké : Discord répond « c'est bien
 * lui », et le site ne garde que le pseudo, l'avatar et un identifiant.
 */
(function () {
  'use strict';

  var etat = { connecte: false, profil: null, disponible: false, charge: false };

  function texte(el, t) { if (el && el.textContent !== t) el.textContent = t; }

  function rendre() {
    var zone = document.getElementById('compteZone');
    if (!zone) return;
    if (!etat.charge) { zone.hidden = true; return; }
    // Tant que la connexion n'est pas configurée sur le site, rien ne s'affiche :
    // mieux vaut pas de bouton qu'un bouton qui échoue.
    if (!etat.disponible) { zone.hidden = true; return; }
    zone.hidden = false;

    if (etat.connecte && etat.profil) {
      zone.innerHTML =
        '<a class="compte-profil" href="/u/' + encodeURIComponent(etat.profil.slug) + '" title="Mon profil public">' +
        (etat.profil.avatar ? '<img src="' + etat.profil.avatar + '" alt="" width="24" height="24">' : '<span class="compte-rond" aria-hidden="true"></span>') +
        '<b></b></a>' +
        '<button type="button" id="compteSortie" class="compte-sortie">Se déconnecter</button>';
      texte(zone.querySelector('.compte-profil b'), etat.profil.pseudo);
      zone.querySelector('#compteSortie').addEventListener('click', deconnecter);
    } else {
      zone.innerHTML = '<a class="compte-entrer" id="compteEntrer" href="/api/auth/discord">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.3 5.3A16 16 0 0 0 15.4 4l-.2.4a15 15 0 0 1 3.4 1.3 12 12 0 0 0-10.4 0A15 15 0 0 1 11.6 4L11.4 4a16 16 0 0 0-3.9 1.3C4.5 9.7 3.7 14 4.1 18.2a16 16 0 0 0 4.8 2.4l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11 11 0 0 0 9.4 0l.4.3a10 10 0 0 1-1.6.8l1 1.6a16 16 0 0 0 4.8-2.4c.5-4.9-.8-9.2-3.4-12.9ZM9.7 15.6c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.8.9 1.7 2c0 1.1-.8 2-1.7 2Zm4.6 0c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.8.9 1.7 2c0 1.1-.8 2-1.7 2Z"/></svg>' +
        '<span>Se connecter</span></a>';
      // On revient là où on était : la connexion ne doit pas faire perdre sa page.
      var lien = zone.querySelector('#compteEntrer');
      lien.href = '/api/auth/discord?retour=' + encodeURIComponent(location.pathname + location.search);
    }
  }

  function deconnecter() {
    fetch('/api/auth/sortie', { method: 'POST' })
      .then(function () { etat.connecte = false; etat.profil = null; rendre(); })
      .catch(function () { });
  }

  function lire() {
    fetch('/api/auth/moi', { headers: { accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d) { etat.connecte = !!d.connecte; etat.profil = d.profil; etat.disponible = !!d.disponible; }
        etat.charge = true;
        rendre();
        message();
      })
      .catch(function () { etat.charge = true; rendre(); });
  }

  /* Retour de Discord : un mot, puis l'adresse est nettoyée pour que le
     paramètre ne traîne pas dans l'historique ni dans un lien partagé. */
  /* Quand la connexion échoue, dire à quelle étape : sans cela, le même
     message couvre un réglage manquant, une clé fausse et un refus de
     l'utilisateur, et il n'y a aucun moyen de les distinguer. */
  var ETAPES = {
    refus: 'autorisation refusée sur Discord',
    cookie: 'le cookie de sécurité n’est pas revenu (navigateur trop strict ?)',
    state: 'jeton de sécurité différent : recommence depuis le site',
    jeton: 'le site n’a pas pu obtenir de jeton auprès de Discord',
    profil: 'Discord n’a pas renvoyé le profil'
  };

  function message() {
    var q = new URLSearchParams(location.search), p = q.get('connexion');
    if (!p) return;
    if (window.NBABL_TOAST) {
      if (p === 'ok') window.NBABL_TOAST('Connecté' + (etat.profil ? ' : ' + etat.profil.pseudo : '') + '.', 'level');
      else if (p === 'bloque') window.NBABL_TOAST('Ce compte ne peut plus publier sur le site.', 'warn');
      else {
        var ou = q.get('ou'), code = q.get('code');
        var detail = ETAPES[ou] || ou;
        window.NBABL_TOAST('La connexion Discord n’a pas abouti'
          + (detail ? ' — ' + detail : '')
          + (code ? ' (' + code + ')' : '') + '.', 'warn');
      }
    }
    var url = new URL(location.href);
    url.searchParams.delete('connexion');
    url.searchParams.delete('ou');
    url.searchParams.delete('code');
    history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lire);
  else lire();

  window.NBABL_COMPTE = { etat: function () { return etat; }, recharger: lire };
})();
