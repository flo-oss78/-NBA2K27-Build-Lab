/* NBA 2K27 Build Lab — Comptage des visites.
 *
 * Une seule requête par page ouverte, vers le site lui-même. Pas de cookie,
 * pas d'identifiant, pas de service extérieur : rien qui suive quelqu'un d'une
 * visite à l'autre. Ce qui part d'ici : la page, la langue, si l'écran est
 * étroit, et le domaine d'où vient le visiteur — jamais l'adresse complète.
 *
 * Si la requête échoue, le site continue exactement pareil : une mesure ne
 * vaut pas qu'on gêne la navigation.
 */
(function () {
  'use strict';

  function mesurer() {
    try {
      // Le domaine seul, jamais l'adresse complète : une page de résultats de
      // recherche contient parfois ce que la personne a tapé.
      var source = '';
      if (document.referrer) {
        try { source = new URL(document.referrer).origin; } catch (e) { source = ''; }
      }

      var charge = JSON.stringify({
        chemin: location.pathname,
        langue: document.documentElement.lang === 'en' ? 'en' : 'fr',
        mobile: window.matchMedia && window.matchMedia('(max-width: 767px)').matches,
        source: source
      });

      // sendBeacon survit à la fermeture de l'onglet ; fetch prend le relais là
      // où il n'existe pas.
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/mesure', new Blob([charge], { type: 'application/json' }));
      } else {
        fetch('/api/mesure', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: charge, keepalive: true
        }).catch(function () { });
      }
    } catch (e) { /* une mesure ratée ne casse rien */ }
  }

  // Après le chargement : la page doit s'afficher d'abord.
  if (document.readyState === 'complete') setTimeout(mesurer, 400);
  else window.addEventListener('load', function () { setTimeout(mesurer, 400); });
})();
