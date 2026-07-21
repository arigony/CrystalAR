import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const provenance = await readFile(new URL("../src/provenance.js", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

const keys = ["sulfurAlpha", "sulfurBeta", "sulfurGamma", "mof5", "hkust1", "zif8"];

test("CrystalAR 5.0.0 apresenta polimorfismo e materiais porosos", () => {
  assert.equal(packageJson.version, "5.0.0");
  assert.match(index, /Enxofre molecular/);
  assert.match(index, /Redes metal-orgânicas/);
  assert.match(index, /HKUST-1/);
});

for (const key of keys) {
  test(`exemplo ${key} está conectado à interface e à proveniência`, () => {
    assert.match(index, new RegExp(`data-example=["']${key}["']`));
    assert.match(app, new RegExp(`\b${key}:`));
    assert.match(provenance, new RegExp(`\b${key}:`));
  });
}

test("MOFs usam wireframe e cela 1 × 1 × 1", () => {
  for (const key of ["mof5", "hkust1", "zif8"]) {
    assert.match(app, new RegExp(`${key}:[\s\S]*?representation: ["']wire["'][\s\S]*?supercell: 1`));
  }
});

test("S6 e UiO-66 permanecem fora do escopo 5.0.0", () => {
  assert.doesNotMatch(index, /data-example=["']sulfurS6["']/);
  assert.doesNotMatch(index, /UiO-66/i);
  assert.doesNotMatch(app, /sulfurS6:/);
  assert.doesNotMatch(app, /uio66:/i);
});
