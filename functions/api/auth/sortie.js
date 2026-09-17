/* Déconnexion : le cookie est effacé, rien à supprimer en base. */
import { json } from '../_utils.js';
import { cookieEfface } from '../_session.js';

export async function onRequestPost() {
  return json({ ok: true }, 200, { 'set-cookie': cookieEfface() });
}
