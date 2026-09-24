/* /en/u/<name> : même chose que /u/<pseudo>, côté anglais. */
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  url.pathname = '/en/u/';
  url.search = '';
  const page = await env.ASSETS.fetch(new Request(url.toString(), { headers: request.headers }));
  return new Response(page.body, {
    status: page.status,
    headers: page.headers
  });
}
