/* Qui est connecté ? Appelé par l'interface pour afficher le profil ou le
   bouton de connexion. Ne renvoie jamais l'identifiant Discord ni rien qui
   permette de retrouver la personne ailleurs. */
import { json } from '../_utils.js';
import { utilisateurConnecte, profilPublic, connexionConfiguree } from '../_session.js';

export async function onRequestGet({ request, env }) {
  const compte = await utilisateurConnecte(request, env);
  return json({
    connecte: !!compte,
    profil: profilPublic(compte),
    // L'interface doit savoir s'il est inutile de proposer la connexion.
    disponible: connexionConfiguree(env)
  });
}
