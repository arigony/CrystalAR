const ALLOWED_ORIGINS = new Set([
  "https://arigony.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
]);

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://arigony.github.io",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: corsHeaders(origin) });

    const url = new URL(request.url);
    const id = url.pathname.match(/^\/cif\/(\d{7,8})$/)?.[1] || url.searchParams.get("id") || "";
    if (!/^\d{7,8}$/.test(id)) return new Response("Invalid COD ID", { status: 400, headers: corsHeaders(origin) });

    const cache = caches.default;
    const cacheKey = new Request(`https://crystalar-cache.local/cif/${id}`);
    const cached = await cache.match(cacheKey);
    if (cached) return new Response(cached.body, { status: cached.status, headers: { ...Object.fromEntries(cached.headers), ...corsHeaders(origin), "X-CrystalAR-Cache": "HIT" } });

    const sources = [
      `https://www.crystallography.net/${id}.cif`,
      `https://www.crystallography.net/cod/${id}.cif`,
      `https://qiserver.ugr.es/cod/${id}.cif`
    ];

    for (const source of sources) {
      try {
        const upstream = await fetch(source, { cf: { cacheTtl: 86400, cacheEverything: true } });
        if (!upstream.ok) continue;
        const text = await upstream.text();
        if (text.length > 5_000_000 || !/(^|\n)\s*data_/i.test(text) || !/_cell_length_a/i.test(text)) continue;
        const headers = {
          ...corsHeaders(origin),
          "Content-Type": "chemical/x-cif; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
          "X-CrystalAR-Source": source
        };
        const response = new Response(text, { status: 200, headers });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      } catch {}
    }

    return new Response("COD entry unavailable", { status: 502, headers: corsHeaders(origin) });
  }
};
