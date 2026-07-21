import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const provenance = await readFile(new URL("../src/provenance.js", import.meta.url), "utf8");

const keys = ["sulfurAlpha", "sulfurBeta", "sulfurGamma", "sulfurS6", "iodine", "mof5", "zif8"];

test("v0.5.0 apresenta as novas famílias didáticas", () => {
  assert.match(index, /Versão v0\.5\.0/);
  assert.match(index, /Enxofre molecular/);
  assert.match(index, /Cristal molecular/);
  assert.match(index, /Redes metal-orgânicas/);
});

for (const key of keys) {
  test(`exemplo ${key} está conectado à interface e à proveniência`, () => {
    assert.ok(index.includes(`data-example="${key}"`));
    assert.ok(app.includes(`${key}:`));
    assert.ok(provenance.includes(`${key}:`));
  });
}

test("MOFs usam cela 1x1x1 por desempenho", () => {
  assert.match(app, /mof5:[\s\S]*?supercell: 1/);
  assert.match(app, /zif8:[\s\S]*?supercell: 1/);
});
