import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCIFDocument } from "../src/cif-parser.js";
import { buildCrystalModel, inferBonds } from "../src/crystal.js";
import { SCIENCE_EXAMPLES, LESSON_FAMILIES } from "../src/science-presets.js";

const expectedCounts = { tio2Rutile: 6, tio2Anatase: 12, tio2Brookite: 24, caco3Calcite: 30, caco3Aragonite: 20 };

test("package and scientific release are version 5.3.1", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.version, "5.3.1");
  const loader = await readFile(new URL("../src/runtime-watchdog.js", import.meta.url), "utf8");
  assert.match(loader, /science-v510\.js\?v=5\.3\.1/);
});

test("three lesson families include carbon, TiO2 and CaCO3", () => {
  assert.deepEqual(LESSON_FAMILIES.carbon.keys, ["carbonDiamond", "carbonGraphite"]);
  assert.deepEqual(LESSON_FAMILIES.tio2.keys, ["tio2Rutile", "tio2Anatase", "tio2Brookite"]);
  assert.deepEqual(LESSON_FAMILIES.caco3.keys, ["caco3Calcite", "caco3Aragonite", "caco3Vaterite"]);
  assert.equal(Object.keys(SCIENCE_EXAMPLES).length, 8);
});

for (const [key, example] of Object.entries(SCIENCE_EXAMPLES)) {
  test(`${key} has a valid local derivative and provenance`, async () => {
    const text = await readFile(new URL(`../${example.path}`, import.meta.url), "utf8");
    assert.match(text, new RegExp(`_cod_database_code\\s+${example.codId}`));
    const doc = parseCIFDocument(text), model = buildCrystalModel(doc, 1);
    assert.equal(model.metadata.codId, example.codId);
    assert.ok(model.unitAtoms.length > 0);

    if (example.family === "carbon") {
      assert.match(text, /_space_group_name_H-M_alt/);
      assert.notEqual(model.metadata.spaceGroup, "P 1");
    } else {
      assert.match(text, /_cod_original_sg_symbol_H-M/);
      assert.equal(model.metadata.spaceGroup, "P 1");
    }

    if (expectedCounts[key]) assert.equal(model.unitAtoms.length, expectedCounts[key]);
  });

  test(`${key} has licensed real-image metadata`, () => {
    assert.match(example.mineralImage.path, /^assets\/minerals\/.+\.jpg$/);
    assert.ok(example.mineralImage.author);
    assert.ok(example.mineralImage.license);
    assert.match(example.mineralImage.source, /^https:\/\/commons\.wikimedia\.org\//);
    assert.ok(example.mineralImage.alt.length > 20);
    assert.ok(example.mineralImage.caption.length > 30);
  });
}

test("carbon route distinguishes sp3 diamond and sp2 graphite", () => {
  const diamond = SCIENCE_EXAMPLES.carbonDiamond;
  const graphite = SCIENCE_EXAMPLES.carbonGraphite;
  assert.equal(diamond.hybridization, "sp³");
  assert.equal(graphite.hybridization, "sp²");
  assert.match(diamond.dimensionality, /tridimensional/i);
  assert.match(graphite.dimensionality, /bidimensionais/i);
  assert.equal(LESSON_FAMILIES.carbon.comparison.length, 5);
  assert.equal(LESSON_FAMILIES.carbon.questions.length, 3);
});

test("carbon bond rules include only short C-C covalent contacts", async () => {
  for (const key of ["carbonDiamond", "carbonGraphite"]) {
    const example = SCIENCE_EXAMPLES[key];
    const text = await readFile(new URL(`../${example.path}`, import.meta.url), "utf8");
    const model = buildCrystalModel(parseCIFDocument(text), 2);
    const bonds = inferBonds(model.atoms, 18000, example.bondRules);
    assert.ok(bonds.length > 0);
    for (const [a, b] of bonds) {
      assert.equal(model.atoms[a].element, "C");
      assert.equal(model.atoms[b].element, "C");
    }
  }
});

test("rutile image avoids a quartz-dominated teaching example", () => {
  const image = SCIENCE_EXAMPLES.tio2Rutile.mineralImage;
  assert.match(image.alt, /sem quartzo dominando/i);
  assert.match(image.caption, /rutilo é o mineral protagonista/i);
});

test("vaterite exposes partial occupancy and an explicit scientific warning", async () => {
  const example = SCIENCE_EXAMPLES.caco3Vaterite;
  const text = await readFile(new URL(`../${example.path}`, import.meta.url), "utf8");
  const model = buildCrystalModel(parseCIFDocument(text), 1);
  assert.ok(model.unitAtoms.some(atom => Math.abs(atom.occupancy - 1/3) < 1e-4));
  assert.match(example.scientificWarning, /ocupação 1\/3/);
  assert.match(example.teachingNote, /não significa ausência/);
  assert.match(example.mineralImage.kind, /Micrografia eletrônica real/);
  assert.match(example.mineralImage.caption, /não é uma fotografia.*macroscópica/i);
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
