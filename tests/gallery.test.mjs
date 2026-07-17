import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCIFDocument } from "../src/cif-parser.js";
import { buildCrystalModel } from "../src/crystal.js";

const examples = [
  ["diamond-9012293.cif", "9012293", 8],
  ["graphite-1200017.cif", "1200017", 4],
  ["graphene-model.cif", "graphene_model", 2],
  ["nacl-1000041.cif", "1000041", 8],
  ["cscl-9008789.cif", "9008789", 2],
  ["mgo-1011173.cif", "1011173", 8],
  ["caf2-1000043.cif", "1000043", 12],
  ["zns-sphalerite-9000107.cif", "9000107", 8],
  ["zns-wurtzite-1100044.cif", "1100044", 4]
];

for (const [filename, expectedId, expectedAtoms] of examples) {
  test(`galeria: ${filename} é um CIF válido e renderizável`, async () => {
    const text = await readFile(new URL(`../examples/${filename}`, import.meta.url), "utf8");
    const doc = parseCIFDocument(text);
    const model = buildCrystalModel(doc, 1);
    assert.equal(model.metadata.codId, expectedId);
    assert.equal(model.unitAtoms.length, expectedAtoms);
    assert.ok(model.cell.a > 0 && model.cell.b > 0 && model.cell.c > 0);
    assert.ok(model.atoms.every(atom => atom.cart.every(Number.isFinite)));
  });
}

test("grafeno é explicitamente identificado como modelo educacional", async () => {
  const text = await readFile(new URL("../examples/graphene-model.cif", import.meta.url), "utf8");
  assert.match(text, /educational 2D model/i);
  assert.match(text, /artificial vacuum spacing/i);
  assert.doesNotMatch(text, /_cod_database_code\s+\d/i);
});
