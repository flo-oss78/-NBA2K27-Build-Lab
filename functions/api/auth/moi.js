/* Qui est connecté ? Appelé par l'interface pour afficher le profil ou le
   bouton de connexion. Ne renvoie jamais l'identifiant Discord ni rien qui
   permette de retrouver la personne ailleurs. */
import { json } from '../_utils.js';
import { utilisateurConnecte, profilPublic, reglagesManquants } from '../_session.js';

export async function onRequestGet({ request, env }) {
  const compte = await utilisateurConnecte(request, env);
  const manque = reglagesManquants(env);
  return json({
    connecte: !!compte,
    profil: profilPublic(compte),
    // L'interface doit savoir s'il est inutile de proposer la connexion.
    disponible: manque.length === 0,
    // Quand la connexion ne marche pas, dire lequel des réglages est en cause
    // évite de chercher à l'aveugle. Seul le nom du réglage sort d'ici : jamais
    // sa valeur, ni sa longueur, ni le moindre indice sur son contenu.
    ...(manque.length ? { reglagesManquants: manque } : {})
  });
}
