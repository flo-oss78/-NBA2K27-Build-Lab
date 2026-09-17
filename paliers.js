/* NBA 2K27 Build Lab — Ce que débloque le prochain point d'attribut.
 *
 * Trois écrans s'appuient sur ce calcul :
 *   — l'étape Attributs, qui répond à « pourquoi monter celui-ci ? » ;
 *   — le message « nouveau palier » quand un curseur franchit un seuil ;
 *   — la comparaison de placements de Cap Breakers.
 *
 * Principe : un badge, une animation ou un Takeover n'a qu'un petit nombre de
 * seuils sur un attribut donné. Plutôt que de simuler chaque note une à une, on
 * ne teste que ces seuils, et on vérifie qu'ils débloquent VRAIMENT quelque
 * chose : un badge en « ET » ne s'ouvre pas si l'autre attribut manque, et une
 * animation hors de ta taille ne s'ouvrira jamais. Rien n'est annoncé sans
 * avoir été vérifié sur le build complet.
 */
(function () {
  'use strict';

  function copie(r, attr, valeur) { var o = {}; for (var k in r) o[k] = r[k]; o[attr] = valeur; return o; }

  /* Les tables sont des « const » de builder-data.js et animations.js : elles
     existent dès le chargement de ces fichiers, alors que leurs copies sur
     window ne sont posées qu'à la fin de app.js. Au premier rendu, lire window
     revenait à ne trouver aucun badge et à n'annoncer aucun palier. */
  function tableBadges() { return typeof badgeDefs !== 'undefined' ? badgeDefs : (window.badgeDefs || []); }
  function tableAnimations() { return typeof ANIMATIONS !== 'undefined' ? ANIMATIONS : (window.ANIMATIONS || []); }
  function tableTakeovers() { return typeof takeoverDefs !== 'undefined' ? takeoverDefs : (window.takeoverDefs || []); }
  function nomBadgeFR(n) { return (typeof nomBadge === 'function' ? nomBadge(n) : n); }

  /* Les notes auxquelles cet attribut fait franchir un palier, entre sa valeur
     actuelle (exclue) et un maximum (inclus). Rendu : [{note, gains:[…]}] */
  function paliers(attr, r, h, maxi) {
    var actuel = +r[attr] || 0;
    if (!(maxi > actuel)) return [];
    var parNote = {};
    function ajouter(note, type, texte) {
      if (note <= actuel || note > maxi) return;
      (parNote[note] || (parNote[note] = [])).push({ type: type, texte: texte });
    }

    // Badges : chaque palier du badge est un seuil possible.
    var defs = tableBadges();
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      if (h < d.minH || h > d.maxH) continue;
      var dedans = false;
      for (var q = 0; q < d.req.length; q++) if (d.req[q][0] === attr) dedans = true;
      if (!dedans) continue;
      var avant = typeof badgeTier === 'function' ? badgeTier(d, r).level : 0;
      for (var t = 0; t < 4; t++) {
        for (var k = 0; k < d.req.length; k++) {
          if (d.req[k][0] !== attr) continue;
          var seuil = d.req[k][t + 1];
          if (seuil == null || seuil <= actuel || seuil > maxi) continue;
          var apres = badgeTier(d, copie(r, attr, seuil));
          if (apres.level > avant) ajouter(seuil, 'badge', nomBadgeFR(d.name) + ' ' + apres.tier);
        }
      }
    }

    // Animations : le seuil est l'exigence de cet attribut, quand elle existe.
    var anims = tableAnimations();
    for (var a = 0; a < anims.length; a++) {
      var an = anims[a];
      if (h < an.minH || h > an.maxH || !an.req || an.req[attr] == null) continue;
      var besoin = an.req[attr];
      if (besoin <= actuel || besoin > maxi) continue;
      if (typeof animationManques !== 'function') continue;
      if (animationManques(an, r).length === 0) continue;                 // déjà accessible
      if (animationManques(an, copie(r, attr, besoin)).length) continue;  // il manquera autre chose
      var cat = typeof nomCategorieAnimation === 'function' ? nomCategorieAnimation(an.category) : an.category;
      ajouter(besoin, 'animation', an.name + ' (' + cat + ')');
    }

    // Takeovers : une seule exigence par Takeover.
    var tk = tableTakeovers();
    for (var j = 0; j < tk.length; j++) {
      if (tk[j][1] !== attr) continue;
      ajouter(tk[j][2], 'takeover', tk[j][0]);
    }

    return Object.keys(parNote).map(Number).sort(function (x, y) { return x - y; })
      .map(function (note) { return { note: note, gains: parNote[note] }; });
  }

  /* Le prochain palier utile, et ce qu'il coûte en points. */
  function prochain(attr, r, h, maxi) {
    var l = paliers(attr, r, h, maxi);
    if (!l.length) return null;
    l[0].manque = l[0].note - (+r[attr] || 0);
    return l[0];
  }

  /* Ce qui vient d'être débloqué en passant de « avant » à « apres ». Sert au
     message « nouveau palier » : on ne parle que de ce qui a réellement changé. */
  function franchis(attr, avant, apres, r, h) {
    if (!(apres > avant)) return [];
    var base = copie(r, attr, avant);
    var l = paliers(attr, base, h, apres);
    var gains = [];
    for (var i = 0; i < l.length; i++) gains = gains.concat(l[i].gains);
    return gains;
  }

  window.NBABL_PALIERS = { paliers: paliers, prochain: prochain, franchis: franchis };
})();
