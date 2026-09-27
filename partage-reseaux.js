/* NBA 2K27 Build Lab — Envoyer un build ailleurs.
 *
 * Pas de bouton de réseau social au sens habituel : ceux-là chargent un
 * script du réseau, qui voit passer tous les visiteurs de la page même sans
 * clic. La politique de sécurité du site les bloquerait, et la mesure
 * d'audience promet qu'aucune donnée ne part chez un tiers.
 *
 * Ici, ce sont de simples liens : rien n'est chargé, rien n'est envoyé tant
 * que personne ne clique. Sur téléphone, on passe par le menu de partage du
 * système, qui connaît déjà Discord, TikTok et le reste — mieux que
 * n'importe quelle liste qu'on figerait dans le code.
 */
(function () {
  'use strict';

  function lienDuBuild() {
    // Le même lien que « Copier le lien » : l'adresse de la page avec le
    // build encodé dedans, pour que le destinataire l'ouvre tel quel.
    const coder = window.serializeBuild || window.serialize;
    if (typeof coder === 'function') {
      try {
        return location.origin + location.pathname + '?build=' + encodeURIComponent(coder());
      } catch (e) { /* on retombe sur l'adresse courante */ }
    }
    return location.href;
  }

  function titre() {
    const nom = (document.getElementById('buildname') || {}).textContent || 'Mon build NBA 2K27';
    const meta = (document.getElementById('buildMeta') || {}).textContent || '';
    return (nom + (meta ? ' — ' + meta : '')).trim();
  }

  function dire(t, ton) {
    if (window.NBABL_TOAST) window.NBABL_TOAST(t, ton || 'level');
  }

  function majLiens() {
    const url = encodeURIComponent(lienDuBuild());
    const txt = encodeURIComponent(titre());
    const cibles = {
      x: 'https://twitter.com/intent/tweet?text=' + txt + '&url=' + url,
      reddit: 'https://www.reddit.com/submit?url=' + url + '&title=' + txt,
      whatsapp: 'https://wa.me/?text=' + txt + '%20' + url
    };
    document.querySelectorAll('#reseaux a[data-reseau]').forEach(function (a) {
      const c = cibles[a.dataset.reseau];
      if (c) a.href = c;
    });
  }

  /* Le panneau s'ouvre toujours. Appeler directement le menu du système
     paraissait plus malin, mais navigator.share existe aussi sur Chrome
     ordinateur : les liens n'auraient alors jamais été montrés à personne.
     Le menu du système est donc proposé comme une destination de plus,
     là où il existe. */
  function basculer() {
    const zone = document.getElementById('reseaux');
    const bouton = document.getElementById('partagerAilleurs');
    if (!zone || !bouton) return;
    const ouvert = !zone.hidden;
    if (!ouvert) { majLiens(); majBoutonSysteme(); }
    zone.hidden = ouvert;
    bouton.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
  }

  function majBoutonSysteme() {
    const zone = document.getElementById('reseaux');
    if (!zone || !navigator.share || zone.querySelector('[data-reseau="systeme"]')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.reseau = 'systeme';
    b.textContent = document.documentElement.lang === 'en' ? 'Other apps…' : 'Autres applications…';
    b.addEventListener('click', function () {
      navigator.share({ title: titre(), text: titre(), url: lienDuBuild() })
        .catch(function () { /* partage abandonné : rien à signaler */ });
    });
    zone.appendChild(b);
  }

  function copier() {
    const lien = lienDuBuild();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lien)
        .then(function () { dire('Lien du build copié.'); })
        .catch(function () { dire('Copie impossible sur cet appareil.', 'warn'); });
    } else {
      dire('Copie impossible sur cet appareil.', 'warn');
    }
  }

  function brancher() {
    const bouton = document.getElementById('partagerAilleurs');
    if (bouton) bouton.addEventListener('click', basculer);
    const copie = document.querySelector('#reseaux [data-reseau="copier"]');
    if (copie) copie.addEventListener('click', copier);
    // Le build change pendant qu'on règle ses curseurs : les liens sont
    // recalculés à l'ouverture, jamais figés au chargement de la page.
    document.querySelectorAll('#reseaux a[data-reseau]').forEach(function (a) {
      a.addEventListener('click', majLiens);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher);
  else brancher();
})();
