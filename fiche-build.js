/* NBA 2K27 Build Lab — Fiche publique d'un build (/b/<id>).
 *
 * La page est rendue côté serveur : tout ce qui compte y est déjà lisible,
 * sans JavaScript. Ce fichier n'ajoute que ce qu'un serveur ne peut pas faire
 * proprement — le code à scanner pour retrouver le build sur son téléphone,
 * dessiné dans le navigateur plutôt qu'appelé à un service extérieur.
 */
(function () {
  'use strict';

  function dessinerQr() {
    var zone = document.getElementById('bdQr');
    if (!zone || !window.NBABL_QR) return;
    var lien = zone.getAttribute('data-lien') || location.href;
    try {
      // Les couleurs du site : un QR blanc sur fond sombre reste lisible par
      // tous les téléphones, l'inverse ne l'est pas toujours.
      zone.innerHTML = window.NBABL_QR.toSVG(lien, { quiet: 2, dark: '#0B0B10', light: '#EDF2F9' });
    } catch (e) {
      // Un code illisible vaut moins que pas de code du tout : on retire la
      // section plutôt que de laisser un carré vide.
      var bloc = zone.closest('.bd-qr');
      if (bloc) bloc.hidden = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dessinerQr);
  else dessinerQr();
})();
