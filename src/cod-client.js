const DATASET = "LMucko/crystallography-open-database";
const DATASET_SNAPSHOT = "2026-07-06";
const CACHE_NAME = "crystalar-cif-v2";

const LOCAL_CIF = {
  "9012293": "examples/diamond-9012293-demo.cif",
  "5910030": "examples/bao-5910030-demo.cif",
  "5910063": "examples/cofe2o4-5910063-demo.cif"
};

export function normalizeCIFPayload(text) {
  const normalized = String(text || "").replace(/\r\n?/g, "\n");
  const match = normalized.match(/(?:^|\n)\s*(data_[^\s]+[\s\S]*)/i);
  if (!match) return "";
  let cif = match[1].trim();
  const fence = cif.search(/\n```\s*$/m);
  if (fence > 0) cif = cif.slice(0, fence).trim();
  return cif;
}

export function looksLikeCIF(text) {
  return /(^|\n)\s*data_/i.test(text) &&
    /_cell_length_a/i.test(text) &&
    /_atom_site_/i.test(text);
}

export function extractDeclaredCODId(text) {
  const scalar = String(text || "").match(/_cod_database_code(?:_structure)?\s+['\"]?(\d{7,8})/i)?.[1];
  if (scalar) return scalar;
  return String(text || "").match(/(?:^|\n)\s*data_(\d{7,8})\b/i)?.[1] || "";
}

export function validateCODPayload(text, requestedId) {
  const cif = normalizeCIFPayload(text);
  if (!looksLikeCIF(cif)) throw new Error("A resposta não contém um CIF estrutural válido.");
  const declared = extractDeclaredCODId(cif);
  if (declared && declared !== String(requestedId)) {
    throw new Error(`O servidor devolveu COD ${declared}, mas foi solicitado COD ${requestedId}.`);
  }
  return cif;
}

export function extractCIFTextFromDatasetResponse(payload, requestedId = "") {
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  for (const result of rows) {
    if (!result?.row) continue;
    const truncated = Array.isArray(result.truncated_cells) && result.truncated_cells.some(cell => cell === "cif_text" || cell?.column === "cif_text");
    if (truncated) continue;
    const cif = normalizeCIFPayload(result.row.cif_text);
    if (!looksLikeCIF(cif)) continue;
    const rowId = String(result.row.file ?? extractDeclaredCODId(cif));
    if (!requestedId || rowId === String(requestedId)) return cif;
  }
  return "";
}

function cacheRequest(id) {
  return new Request(`https://crystalar.local/cif/${id}`, { method: "GET" });
}

async function getCached(id) {
  if (!globalThis.caches) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(cacheRequest(id));
    if (!response) return null;
    const text = await response.text();
    return looksLikeCIF(text) ? text : null;
  } catch {
    return null;
  }
}

async function putCached(id, text) {
  if (!globalThis.caches) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(cacheRequest(id), new Response(text, { headers: { "Content-Type": "chemical/x-cif" } }));
  } catch {
    // Cache Storage can be unavailable in private browsing.
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: "no-store", redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

function configuredProxyUrl(id) {
  const base = String(globalThis.CRYSTALAR_PROXY_URL || "").trim().replace(/\/$/, "");
  return base ? `${base}/cif/${id}` : "";
}

async function fetchFromConfiguredProxy(id) {
  const url = configuredProxyUrl(id);
  if (!url) throw new Error("proxy próprio não configurado");
  const response = await fetchWithTimeout(url, { mode: "cors" }, 12000);
  if (!response.ok) throw new Error(`proxy próprio: HTTP ${response.status}`);
  return validateCODPayload(await response.text(), id);
}

async function fetchFromHuggingFace(id) {
  // /search is used instead of /filter because the Dataset Viewer documents that
  // search responses are not truncated. We still validate the exact numeric COD ID.
  const url = new URL("https://datasets-server.huggingface.co/search");
  url.searchParams.set("dataset", DATASET);
  url.searchParams.set("config", "default");
  url.searchParams.set("split", "train");
  url.searchParams.set("query", id);
  url.searchParams.set("length", "20");

  const response = await fetchWithTimeout(url, { mode: "cors" }, 25000);
  if (!response.ok) throw new Error(`espelho COD: HTTP ${response.status}`);
  const payload = await response.json();
  const cif = extractCIFTextFromDatasetResponse(payload, id);
  if (!cif) throw new Error("COD ID exato não encontrado no espelho ou resposta incompleta.");
  return validateCODPayload(cif, id);
}

async function fetchFromOfficialCOD(id) {
  const urls = [
    `https://www.crystallography.net/${id}.cif`,
    `https://www.crystallography.net/cod/${id}.cif`,
    `https://qiserver.ugr.es/cod/${id}.cif`
  ];

  const failures = [];
  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, { mode: "cors" }, 9000);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return validateCODPayload(await response.text(), id);
    } catch (error) {
      failures.push(error?.message || "falha de rede/CORS");
    }
  }
  throw new Error(`COD oficial indisponível no navegador: ${failures.join("; ")}`);
}

async function fetchLocalExample(id) {
  const path = LOCAL_CIF[id];
  if (!path) throw new Error("sem exemplo local");
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`exemplo local: HTTP ${response.status}`);
  return validateCODPayload(await response.text(), id);
}

export async function fetchCIFById(rawId) {
  const id = String(rawId || "").trim();
  if (!/^\d{7,8}$/.test(id)) throw new Error("Digite um COD ID numérico com 7 ou 8 dígitos.");

  const cached = await getCached(id);
  if (cached) return { text: cached, source: "cache local do navegador" };

  if (LOCAL_CIF[id]) {
    const text = await fetchLocalExample(id);
    await putCached(id, text);
    return { text, source: "exemplo educacional local" };
  }

  const attempts = [
    ["proxy CrystalAR", fetchFromConfiguredProxy],
    [`espelho COD no Hugging Face (${DATASET_SNAPSHOT})`, fetchFromHuggingFace],
    ["servidor oficial COD", fetchFromOfficialCOD]
  ];
  const failures = [];

  for (const [label, loader] of attempts) {
    try {
      const text = await loader(id);
      await putCached(id, text);
      return { text, source: label };
    } catch (error) {
      failures.push(`${label}: ${error?.message || "falhou"}`);
    }
  }

  throw new Error(`Não foi possível recuperar COD ${id}. ${failures.join(" | ")}`);
}
