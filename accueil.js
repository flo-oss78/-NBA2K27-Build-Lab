/* NBA 2K27 Build Lab — Page d'accueil.
 *
 * Le builder occupait la racine du site. Il vit maintenant dans /creer/, et
 * cette page présente le site — c'est elle que reçoit quelqu'un qui arrive
 * par une recherche.
 *
 * Mais des liens partagés pointent encore vers la racine avec un build
 * dedans : « lelabodesbuilds.com/?build=... », copiés dans des discussions,
 * mis en favori, peut-être relayés. Les laisser tomber sur la présentation
 * reviendrait à casser un lien que quelqu'un a envoyé à quelqu'un d'autre.
 * On les renvoie donc vers le builder, en gardant tout ce qu'ils portaient.
 */
(function () {
  'use strict';

  // Les paramètres qui ne concernent que le builder. « connexion » en est
  // absent : le retour de Discord doit rester sur la page d'où l'on venait.
  var POUR_LE_BUILDER = ['build', 'etape', 'nouveau', 'import'];

  try {
    var params = new URLSearchParams(location.search);
    var pourNous = POUR_LE_BUILDER.some(function (p) { return params.has(p); });
    if (pourNous) {
      var prefixe = document.documentElement.lang === 'en' ? '/en' : '';
      // replace et non href : le retour arrière ramène à la page précédente,
      // pas sur une redirection qui se rejouerait en boucle.
      location.replace(prefixe + '/creer/' + location.search + location.hash);
    }
  } catch (e) { /* adresse illisible : on reste sur l'accueil */ }
})();
