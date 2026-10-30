export default {
  async fetch(request, env) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const res = await env.ASSETS.fetch(request);
    const h = new Headers(res.headers);
    for (const [k, v] of Object.entries(cors)) h.set(k, v);
    if (new URL(request.url).pathname.endsWith('.webp')) { h.set('Cache-Control', 'public, max-age=2592000, immutable'); h.set('Content-Type', 'image/webp'); }
    return new Response(res.body, { status: res.status, headers: h });
  }
};
