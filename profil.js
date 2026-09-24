/* NBA 2K27 Build Lab — Profil public d'un joueur (/u/<slug>)
 *
 * Une seule page pour tous les profils : le slug est lu dans l'adresse, le
 * contenu vient de /api/profil. Tout ce qui est écrit par quelqu'un — un
 * pseudo, un nom de build, une description — est posé avec textContent et
 * jamais avec innerHTML : c'est ce qui empêche un nom de build de devenir du
 * code exécuté chez les visiteurs.
 */
(function () {
  'use strict';

  var slug = (function () {
    var m = location.pathname.match(/^\/(?:en\/)?u\/([^/?#]+)/);
    try { return m ? decodeURIComponent(m[1]).toLowerCase() : ''; } catch (e) { return ''; }
  })();

  var etat = { profil: null, suivi: false, cestMoi: false, abonnes: 0 };

  function $(id) { return document.getElementById(id); }

  function vider(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }

  function ligne(balise, classe, texte) {
    var el = document.createElement(balise);
    if (classe) el.className = classe;
    if (texte !== undefined && texte !== null) el.textContent = String(texte);
    return el;
  }

  function taille(pouces) {
    var p = Math.round(+pouces || 0);
    if (!p) return '';
    return Math.floor(p / 12) + '′' + (p % 12) + '″ (' + Math.round(p * 2.54) + ' cm)';
  }

  function depuisQuand(ms) {
    var d = new Date(+ms || 0);
    if (!+ms) return '';
    return d.toLocaleDateString(document.documentElement.lang === 'en' ? 'en-GB' : 'fr-FR',
      { year: 'numeric', month: 'long' });
  }

  /* ------------------------------------------------------------ rendu */

  function rendreTete() {
    var p = etat.profil;
    $('profilNom').textContent = p.pseudo;
    document.title = p.pseudo + ' — Le Labo des Builds';

    var av = $('profilAvatar');
    vider(av);
    if (p.avatar) {
      var img = document.createElement('img');
      img.src = p.avatar; img.alt = ''; img.width = 64; img.height = 64;
      av.appendChild(img);
    } else {
      av.appendChild(ligne('span', 'profil-initiale', (p.pseudo || '?').slice(0, 1).toUpperCase()));
    }

    var bouts = [];
    if (p.depuis) bouts.push('Sur le site depuis ' + depuisQuand(p.depuis));
    bouts.push(etat.abonnes + (etat.abonnes > 1 ? ' abonnés' : ' abonné'));
    $('profilMeta').textContent = bouts.join(' · ');

    var b = $('profilSuivre');
    if (etat.cestMoi) { b.hidden = true; }
    else { b.hidden = false; b.textContent = etat.suivi ? 'Ne plus suivre' : 'Suivre'; }

    $('profilPartager').hidden = false;
    $('profilMonCompte').hidden = !etat.cestMoi;
  }

  function carteBuild(b) {
    var a = document.createElement('a');
    a.className = 'profil-build';
    a.href = b.url || ('/b/' + encodeURIComponent(b.id));

    a.appendChild(ligne('b', 'profil-build-nom', b.name));

    var sous = [];
    if (b.position) sous.push(b.position);
    var t = taille(b.height); if (t) sous.push(t);
    if (b.style) sous.push(b.style);
    a.appendChild(ligne('small', 'profil-build-corps', sous.join(' · ')));

    var chiffres = ligne('div', 'profil-build-chiffres');
    chiffres.appendChild(ligne('span', null, 'Moyenne ' + (b.score || 0)));
    chiffres.appendChild(ligne('span', null, (b.badges || 0) + ' badges'));
    if (b.capBreakers) chiffres.appendChild(ligne('span', null, b.capBreakers + ' Cap Breakers'));
    chiffres.appendChild(ligne('span', null, (b.likes || 0) + ' j’aime'));
    a.appendChild(chiffres);

    if (b.description) a.appendChild(ligne('small', 'profil-build-desc', b.description));
    return a;
  }

  function rendreBuilds(builds) {
    var zone = $('profilBuilds');
    vider(zone);
    $('profilBuildsCompte').textContent = builds.length
      ? builds.length + (builds.length > 1 ? ' builds' : ' build') : '';
    if (!builds.length) {
      zone.appendChild(ligne('p', 'profil-vide', etat.cestMoi
        ? 'Tu n’as encore rien publié. Crée un build, puis publie-le : il apparaîtra ici.'
        : 'Ce joueur n’a encore rien publié.'));
      return;
    }
    builds.forEach(function (b) { zone.appendChild(carteBuild(b)); });
  }

  function erreur(texte) {
    $('profilNom').textContent = 'Profil introuvable';
    $('profilMeta').textContent = texte;
    $('profilSuivre').hidden = true;
    $('profilPartager').hidden = true;
    var zone = $('profilBuilds');
    vider(zone);
    zone.appendChild(ligne('p', 'profil-vide', 'Vérifie l’adresse, ou retourne à la liste des builds.'));
  }

  /* ------------------------------------------------------------ actions */

  function basculerSuivi() {
    var b = $('profilSuivre');
    b.disabled = true;
    var suivre = !etat.suivi;
    var req = suivre
      ? fetch('/api/suivre', { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug: slug }) })
      : fetch('/api/suivre?slug=' + encodeURIComponent(slug), { method: 'DELETE' });

    req.then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) {
          if (window.NBABL_TOAST) window.NBABL_TOAST(res.d.error || 'Action impossible.', 'warn');
          return;
        }
        etat.suivi = !!res.d.suivi;
        etat.abonnes = res.d.abonnes || 0;
        rendreTete();
      })
      .catch(function () { if (window.NBABL_TOAST) window.NBABL_TOAST('Action impossible.', 'warn'); })
      .then(function () { b.disabled = false; });
  }

  function partager() {
    var lien = location.origin + '/u/' + encodeURIComponent(slug);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lien).then(function () {
        if (window.NBABL_TOAST) window.NBABL_TOAST('Lien du profil copié.', 'level');
      }).catch(function () { });
    }
  }

  function supprimerCompte() {
    if (!confirm('Supprimer ton compte ? Ton pseudo, ton avatar et tes abonnements seront effacés. Tes builds publiés restent en ligne, sans lien avec toi.')) return;
    fetch('/api/auth/supprimer', { method: 'POST' })
      .then(function (r) { return r.ok; })
      .then(function (ok) {
        if (!ok) { if (window.NBABL_TOAST) window.NBABL_TOAST('Suppression impossible.', 'warn'); return; }
        location.href = '/';
      })
      .catch(function () { if (window.NBABL_TOAST) window.NBABL_TOAST('Suppression impossible.', 'warn'); });
  }

  /* ------------------------------------------------------------ départ */

  function charger() {
    if (!slug) { erreur('Aucun joueur indiqué dans l’adresse.'); return; }
    fetch('/api/profil?slug=' + encodeURIComponent(slug), { headers: { accept: 'application/json' } })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.d.profil) { erreur('Ce joueur n’existe pas, ou son compte a été supprimé.'); return; }
        etat.profil = res.d.profil;
        etat.suivi = !!res.d.suivi;
        etat.cestMoi = !!res.d.cestMoi;
        etat.abonnes = res.d.abonnes || 0;
        rendreTete();
        rendreBuilds(res.d.builds || []);
      })
      .catch(function () { erreur('Le profil n’a pas pu être chargé.'); });

    $('profilSuivre').addEventListener('click', basculerSuivi);
    $('profilPartager').addEventListener('click', partager);
    $('profilSupprimer').addEventListener('click', supprimerCompte);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', charger);
  else charger();
})();
