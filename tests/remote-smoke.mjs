import assert from "node:assert/strict";
import {
  buildDatasetFilterURL,
  extractCIFTextFromDatasetResponse,
  validateCODPayload
} from "../src/cod-client.js";

const id = "1506803";
const url = buildDatasetFilterURL(id);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 20000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: { Origin: "https://arigony.github.io" }
  });
  assert.equal(response.ok, true, `Dataset Viewer HTTP ${response.status}`);
  const allowOrigin = response.headers.get("access-control-allow-origin");
  assert.ok(allowOrigin === "*" || allowOrigin === "https://arigony.github.io", `CORS ausente: ${allowOrigin}`);
  const payload = await response.json();
  assert.notEqual(payload?.partial, true, "Dataset Viewer informou índice parcial");
  const text = extractCIFTextFromDatasetResponse(payload, id);
  assert.ok(text, `COD ${id} não apareceu no filtro exato`);
  validateCODPayload(text, id);
  console.log(`Remote smoke PASS: COD ${id}, ${text.length} caracteres, CORS ${allowOrigin}`);
} finally {
  clearTimeout(timer);
}
