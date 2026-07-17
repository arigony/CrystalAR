const nativeFetch = window.fetch.bind(window);
const COD_CIF_PATTERN = /^https:\/\/(?:www\.)?crystallography\.net\/cod\/\d{7,8}\.cif(?:[?#].*)?$/i;

const proxyRoutes = [
  target => `https://corsproxy.io/?url=${encodeURIComponent(target)}`,
  target => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`
];

function looksLikeCIF(text) {
  return /(^|\n)\s*data_/i.test(text) &&
    /_cell_length_a/i.test(text) &&
    /_atom_site_/i.test(text);
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 18000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await nativeFetch(url, {
      ...init,
      mode: "cors",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCODCIF(target, init) {
  const routes = [target, ...proxyRoutes.map(build => build(target))];
  const failures = [];

  for (const route of routes) {
    try {
      const response = await fetchWithTimeout(route, init);
      if (!response.ok) {
        failures.push(`HTTP ${response.status}`);
        continue;
      }

      const text = await response.text();
      if (!looksLikeCIF(text)) {
        failures.push("resposta não reconhecida como CIF");
        continue;
      }

      return new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "chemical/x-cif; charset=utf-8",
          "X-CrystalAR-Route": route === target ? "direct" : "cors-proxy"
        }
      });
    } catch (error) {
      failures.push(error?.name === "AbortError" ? "tempo esgotado" : "falha de rede/CORS");
    }
  }

  throw new TypeError(`Falha ao recuperar o CIF do COD: ${failures.join("; ")}`);
}

window.fetch = function crystalARFetch(input, init = {}) {
  const target = typeof input === "string" ? input : input?.url;
  if (typeof target === "string" && COD_CIF_PATTERN.test(target)) {
    return fetchCODCIF(target, init);
  }
  return nativeFetch(input, init);
};

await import("./app.js");
