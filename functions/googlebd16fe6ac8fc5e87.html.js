/* Validation Google Search Console.
   Cloudflare Pages retire le « .html » des adresses : le fichier statique
   googlebd16fe6ac8fc5e87.html répondait donc par une redirection 308 vers
   /googlebd16fe6ac8fc5e87, alors que Google demande l'adresse exacte.
   Cette Function passe avant les fichiers statiques et répond directement. */
const LIGNE = 'google-site-verification: googlebd16fe6ac8fc5e87.html';

export function onRequestGet() {
  return new Response(LIGNE + '\n', {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
