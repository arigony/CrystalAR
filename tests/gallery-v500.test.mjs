import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const provenance = await readFile(new URL("../src/provenance.js", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

const keys = ["sulfurAlpha", "sulfurBeta", "sulfurGamma", "mof5", "hkust1", "zif8"];

function exampleBlock(key) {
  const start = app.indexOf(`  ${key}: {`);
  assert.notEqual(start, -1, `entrada ${key} ausente em src/app.js`);
  const end = app.indexOf("\n  },", start);
  assert.notEqual(end, -1, `fim da entrada ${key} ausente em src/app.js`);
  return app.slice(start, end + 5);
}

test("CrystalAR 5.3.0 preserva polimorfismo e materiais porosos da 5.0", () => {
  assert.equal(packageJson.version, "5.3.0");
  assert.match(index, /Enxofre molecular/);
  assert.match(index, /Redes metal-orgânicas/);
  assert.match(index, /HKUST-1/);
});

for (const key of keys) {
  test(`exemplo ${key} permanece conectado à interface e à proveniência`, () => {
    assert.ok(index.includes(`data-example="${key}"`));
    assert.ok(app.includes(`  ${key}: {`));
    assert.ok(provenance.includes(`    ${key}: {`));
  });
}

test("MOFs preservam wireframe e cela 1 × 1 × 1", () => {
  for (const key of ["mof5", "hkust1", "zif8"]) {
    const block = exampleBlock(key);
    assert.match(block, /representation: "wire"/);
    assert.match(block, /supercell: 1/);
  }
});

test("S6 e UiO-66 permanecem fora do escopo 5.3.0", () => {
  assert.doesNotMatch(index, /data-example=["']sulfurS6["']/);
  assert.doesNotMatch(index, /UiO-66/i);
  assert.doesNotMatch(app, /sulfurS6:/);
  assert.doesNotMatch(app, /uio66:/i);
});
