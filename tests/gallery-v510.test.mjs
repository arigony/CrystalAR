import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCIFDocument } from "../src/cif-parser.js";
import { buildCrystalModel, inferBonds } from "../src/crystal.js";
import { SCIENCE_EXAMPLES, LESSON_FAMILIES } from "../src/science-presets.js";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const scienceModule = await readFile(new URL("../src/science-v510.js", import.meta.url), "utf8");
const expectedCounts = { tio2Rutile: 6, tio2Anatase: 12, tio2Brookite: 24, caco3Calcite: 30, caco3Aragonite: 20 };

test("package and scientific release are version 5.3.0", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "5.3.0");
  const loader = await readFile(new URL("../src/runtime-watchdog.js", import.meta.url), "utf8");
  assert.match(loader, /science-v510\.js\?v=5\.3\.0/);
  assert.match(scienceModule, /const VERSION = "v5\.3\.0"/);
});

test("HTML-base exposes 5.3.0 before JavaScript enhancement", () => {
  assert.match(index, /Versão v5\.3\.0/);
  assert.match(index, /roteiro diamante-grafite/i);
  assert.match(index, /style-v510\.css\?v=5\.3\.0/);
  assert.match(index, /runtime-watchdog\.js\?v=5\.3\.0/);
  assert.match(index, /provenance\.js\?v=5\.3\.0/);
  assert.match(index, /app\.js\?v=5\.3\.0/);
  assert.doesNotMatch(index, /\?v=5\.2\.0/);
});

test("three lesson families include two carbon allotropes and six polymorphs", () => {
  assert.deepEqual(LESSON_FAMILIES.carbon.keys, ["carbonDiamond", "carbonGraphite"]);
  assert.deepEqual(LESSON_FAMILIES.tio2.keys, ["tio2Rutile", "tio2Anatase", "tio2Brookite"]);
  assert.deepEqual(LESSON_FAMILIES.caco3.keys, ["caco3Calcite", "caco3Aragonite", "caco3Vaterite"]);
  assert.equal(Object.keys(SCIENCE_EXAMPLES).length, 8);
});

test("scientific module renders synchronized real-image and structure-property evidence", () => {
  assert.match(scienceModule, /id="mineralImage"/);
  assert.match(scienceModule, /id="mineralImageCredit"/);
  assert.match(scienceModule, /id="mineralImageSource"/);
  assert.match(scienceModule, /id="lessonComparison"/);
  assert.match(scienceModule, /id="lessonQuestions"/);
  assert.match(scienceModule, /Escalas diferentes/);
  assert.match(scienceModule, /renderMineralImage\(example\)/);
  assert.match(scienceModule, /BASE_SCIENCE_MAP/);
});

for (const [key, example] of Object.entries(SCIENCE_EXAMPLES)) {
  test(`${key} has a valid local derivative and provenance`, async () => {
    const text = await readFile(new URL(`../${example.path}`, import.meta.url), "utf8");
    assert.match(text, new RegExp(`_cod_database_code\\s+${example.codId}`));
    assert.match(text, /_cod_original_sg_symbol_H-M/);
    const doc = parseCIFDocument(text), model = buildCrystalModel(doc, 1);
    assert.equal(model.metadata.codId, example.codId);
    assert.equal(model.metadata.spaceGroup, "P 1");
    assert.ok(model.unitAtoms.length > 0);
    if (expectedCounts[key]) assert.equal(model.unitAtoms.length, expectedCounts[key]);
  });
}

test("vaterite exposes partial occupancy and an explicit scientific warning", async () => {
  const example = SCIENCE_EXAMPLES.caco3Vaterite;
  const text = await readFile(new URL(`../${example.path}`, import.meta.url), "utf8");
  const model = buildCrystalModel(parseCIFDocument(text), 1);
  assert.ok(model.unitAtoms.some(atom => Math.abs(atom.occupancy - 1/3) < 1e-4));
  assert.match(example.scientificWarning, /ocupação 1\/3/);
  assert.match(example.teachingNote, /não significa ausência/);
});

test("explicit chemical rules avoid generic all-pair bonding", async () => {
  const example = SCIENCE_EXAMPLES.caco3Calcite;
  const text = await readFile(new URL(`../${example.path}`, import.meta.url), "utf8");
  const model = buildCrystalModel(parseCIFDocument(text), 2);
  const bonds = inferBonds(model.atoms, 18000, example.bondRules);
  assert.ok(bonds.length > 0);
  for (const [a, b] of bonds) {
    const pair = [model.atoms[a].element, model.atoms[b].element].sort().join("-");
    assert.ok(["C-O", "Ca-O"].includes(pair));
  }
});
