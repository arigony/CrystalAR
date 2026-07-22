import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SCIENCE_EXAMPLES } from "../src/science-presets.js";

const manifest = JSON.parse(await readFile(new URL("../assets/minerals/manifest.json", import.meta.url), "utf8"));
const credits = await readFile(new URL("../assets/minerals/IMAGE_CREDITS.md", import.meta.url), "utf8");
const expectedKeys = ["diamond", "graphite", "rutile", "anatase", "brookite", "calcite", "aragonite", "vaterite"];

test("manifest records eight licensed and processed scientific images", () => {
  assert.deepEqual(manifest.map(entry => entry.key), expectedKeys);
  for (const entry of manifest) {
    assert.deepEqual(entry.output_size, [900, 900]);
    assert.match(entry.output, /^assets\/minerals\/.+\.jpg$/);
    assert.match(entry.source_page, /^https:\/\/commons\.wikimedia\.org\//);
    assert.ok(entry.author);
    assert.ok(entry.license);
    assert.match(entry.source_sha256, /^[a-f0-9]{64}$/);
    assert.match(entry.processed_sha256, /^[a-f0-9]{64}$/);
    assert.match(entry.modifications, /recorte|Recorte/);
  }
});

for (const entry of manifest) {
  test(`${entry.filename} is a non-empty JPEG asset`, async () => {
    const bytes = await readFile(new URL(`../${entry.output}`, import.meta.url));
    assert.ok(bytes.length > 10_000, `${entry.filename} parece pequeno demais`);
    assert.equal(bytes[0], 0xff);
    assert.equal(bytes[1], 0xd8);
    assert.equal(bytes.at(-2), 0xff);
    assert.equal(bytes.at(-1), 0xd9);
  });
}

test("credits document every image and separates image licenses from MIT code", () => {
  for (const entry of manifest) {
    assert.match(credits, new RegExp(entry.filename.replace(".", "\\.")));
    assert.ok(credits.includes(entry.author));
    assert.ok(credits.includes(entry.license));
  }
  assert.match(credits, /fotografias ou micrografias reais/i);
  assert.match(credits, /Cor e hábito podem variar/i);
});

test("science presets map one image to every scientific route example", () => {
  const paths = Object.values(SCIENCE_EXAMPLES).map(example => example.mineralImage.path);
  assert.deepEqual(paths, expectedKeys.map(key => `assets/minerals/${key}.jpg`));
  assert.equal(new Set(paths).size, 8);
});

test("carbon images distinguish rough diamond and lamellar graphite", () => {
  const diamond = manifest.find(entry => entry.key === "diamond");
  const graphite = manifest.find(entry => entry.key === "graphite");
  assert.match(diamond.description, /maclado.*triangular.*transparente/i);
  assert.match(graphite.description, /lamelar|foliado/i);
  assert.match(diamond.license, /CC BY-SA 3\.0/);
  assert.match(graphite.license, /CC BY-SA 3\.0/);
});

test("vaterite manifest preserves the SEM evidence type and panel crop", () => {
  const vaterite = manifest.find(entry => entry.key === "vaterite");
  assert.match(vaterite.description, /Micrografia eletrônica/i);
  assert.match(vaterite.crop, /SEM panel c/i);
  assert.match(vaterite.modifications, /painel c/i);
});
