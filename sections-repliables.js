/* NBA 2K27 Build Lab — Les analyses se replient.
 *
 * Le mode Expert affiche cinq modules d'analyse sous le builder. Chacun est
 * utile, mais empilés ils faisaient une page de plus de quatre mille pixels où
 * le builder — le cœur du produit — ne pesait qu'un quart. Ils arrivent donc
 * repliés : on voit d'un coup d'œil ce qui est disponible, et on ouvre ce qu'on
 * veut lire. Le choix est retenu d'une visite à l'autre.
 *
 * Rien n'est retiré : en Expert, tout reste à un clic. Le mode Simple, lui, ne
 * montre toujours que le builder.
 */
(function () {
  'use strict';

  var CLE = 'nbabl_sections_ouvertes_v1';
  // Les modules d'analyse. Le builder, le guide et la présentation n'y sont pas :
  // ils ne se replient pas.
  var SECTIONS = ['intelligence', 'build-dna', 'validator', 'scouting', 'proDashboard'];

  function lire() {
    try { return JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) { return {}; }
  }
  function ecrire(o) { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) { } }

  function titreDe(section) {
    var t = section.querySelector('.section-title');
    if (!t) return '';
    var h = t.querySelector('h2');
    return (h ? h.textContent : t.textContent).replace(/\s+/g, ' ').trim();
  }

  function appliquer(section, ouvert) {
    section.classList.toggle('section-repliee', !ouvert);
    var b = section.querySelector('.section-plier');
    if (b) {
      b.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      b.setAttribute('aria-label', (ouvert ? 'Replier' : 'Déplier') + ' : ' + titreDe(section));
    }
  }

  function preparer() {
    var etat = lire();
    for (var i = 0; i < SECTIONS.length; i++) {
      var section = document.getElementById(SECTIONS[i]);
      if (!section || section.dataset.repliable) continue;
      var tete = section.querySelector('.section-title');
      if (!tete) continue;
      section.dataset.repliable = '1';

      var bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'section-plier';
      // Le chevron suffit : le titre juste à côté dit de quoi il s'agit.
      bouton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
      tete.appendChild(bouton);

      // Tout l'en-tête est cliquable : la cible est plus grande qu'un chevron.
      tete.classList.add('section-title-pliable');
      (function (s) {
        function basculer(e) {
          if (e.target.closest('a, input, select, button:not(.section-plier)')) return;
          var etat2 = lire();
          var ouvert = !s.classList.contains('section-repliee');
          etat2[s.id] = !ouvert;
          ecrire(etat2);
          appliquer(s, !ouvert);
        }
        tete.addEventListener('click', basculer);
      })(section);

      // Par défaut : replié. C'est ce qui rend la page lisible ; le joueur ouvre
      // ce qu'il veut, et son choix est retenu.
      appliquer(section, etat[section.id] === true);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', preparer);
  else preparer();
})();
