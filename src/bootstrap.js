const nativeFetch = window.fetch.bind(window);

const LOCAL_CIF = {
  "9012293": "examples/diamond-9012293-demo.cif",
  "5910030": "examples/bao-5910030-demo.cif",
  "5910063": "examples/cofe2o4-5910063-demo.cif"
};

function extractCodId(url) {
  const match = String(url || "").match(/crystallography\.net\/cod\/(\d{7,8})\.cif(?:[?#].*)?$/i);
  return match?.[1] || "";
}

function normalizeCIFPayload(text) {
  const normalized = String(text || "").replace(/\r\n?/g, "\n");
  const match = normalized.match(/(?:^|\n)\s*(data_[^\s]+[\s\S]*)/i);
  if (!match) return "";
  let cif = match[1].trim();
  const fence = cif.search(/\n```\s*$/m);
  if (fence > 0) cif = cif.slice(0, fence).trim();
  return cif;
}

function looksLikeCIF(text) {
  return /(^|\n)\s*data_/i.test(text) &&
    /_cell_length_a/i.test(text) &&
    /_atom_site_/i.test(text);
}

function cifResponse(text, route) {
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "chemical/x-cif; charset=utf-8",
      "X-CrystalAR-Route": route
    }
  });
}

function staticCodPath(id) {
  return `${id[0]}/${id.slice(1, 3)}/${id.slice(3, 5)}/${id}.cif`;
}

function routesFor(id) {
  const staticPath = staticCodPath(id);
  const directTargets = [
    `https://www.crystallography.net/cod/${id}.cif`,
    `https://qiserver.ugr.es/cod/${id}.cif`,
    `https://www.crystallography.net/cod/cif/${staticPath}`,
    `https://qiserver.ugr.es/cod/cif/${staticPath}`
  ];

  // Rota de leitura pública usada quando o servidor COD não libera CORS.
  const readerTargets = [
    `https://r.jina.ai/http://www.crystallography.net/cod/${id}.cif`,
    `https://r.jina.ai/https://qiserver.ugr.es/cod/${id}.cif`
  ];

  return [
    ...directTargets,
    ...readerTargets,
    `https://corsproxy.io/?url=${encodeURIComponent(directTargets[0])}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(directTargets[0])}`
  ];
}

async function fetchRoute(route, controller, timeoutMs = 15000) {
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await nativeFetch(route, {
      mode: "cors",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.text();
    const text = normalizeCIFPayload(raw);
    if (!looksLikeCIF(text)) throw new Error("resposta não reconhecida como CIF");
    return { text, route };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRemoteCIF(id) {
  const routes = routesFor(id);
  const controllers = routes.map(() => new AbortController());
  const tasks = routes.map((route, index) => fetchRoute(route, controllers[index]));
  try {
    return await Promise.any(tasks);
  } finally {
    controllers.forEach(controller => controller.abort());
  }
}

async function fetchCOD(id) {
  const cacheKey = `crystalar-cif-${id}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached && looksLikeCIF(cached)) return cifResponse(cached, "cache local");
  } catch {
    // O armazenamento pode estar desabilitado no modo privado.
  }

  const localPath = LOCAL_CIF[id];
  if (localPath) {
    const response = await nativeFetch(localPath, { cache: "no-store" });
    if (response.ok) {
      const text = normalizeCIFPayload(await response.text());
      if (looksLikeCIF(text)) return cifResponse(text, "exemplo local");
    }
  }

  try {
    const result = await fetchRemoteCIF(id);
    try { localStorage.setItem(cacheKey, result.text); } catch {}
    const route = result.route.includes("r.jina.ai")
      ? "COD via Jina Reader"
      : result.route.includes("corsproxy") || result.route.includes("allorigins")
        ? "COD via proxy CORS"
        : "servidor COD";
    return cifResponse(result.text, route);
  } catch (error) {
    console.warn("[CrystalAR COD]", error);
    throw new TypeError("Não foi possível recuperar este CIF automaticamente. Abra a ficha do COD, baixe o arquivo e use ‘Abrir arquivo CIF’. Tente também novamente em alguns segundos.");
  }
}

window.fetch = function crystalARFetch(input, init = {}) {
  const target = typeof input === "string" ? input : input?.url;
  const id = extractCodId(target);
  return id ? fetchCOD(id) : nativeFetch(input, init);
};

document.querySelector(".eyebrow")?.replaceChildren("Protótipo v0.1.2");
await import("./app.js?v=0.1.2");
