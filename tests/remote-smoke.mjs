import assert from "node:assert/strict";
import { extractCIFTextFromDatasetResponse, validateCODPayload } from "../src/cod-client.js";

const id = "1506803";
const url = new URL("https://datasets-server.huggingface.co/filter");
url.searchParams.set("dataset", "LMucko/crystallography-open-database");
url.searchParams.set("config", "default");
url.searchParams.set("split", "train");
url.searchParams.set("where", `\"file\"=${id}`);
url.searchParams.set("length", "1");

const response = await fetch(url, { headers: { Origin: "https://arigony.github.io" } });
assert.equal(response.ok, true, `Dataset Viewer HTTP ${response.status}`);
const allowOrigin = response.headers.get("access-control-allow-origin");
assert.ok(allowOrigin === "*" || allowOrigin === "https://arigony.github.io", `CORS ausente: ${allowOrigin}`);
const payload = await response.json();
const text = extractCIFTextFromDatasetResponse(payload);
validateCODPayload(text, id);
console.log(`Remote smoke PASS: COD ${id}, ${text.length} caracteres, CORS ${allowOrigin}`);
