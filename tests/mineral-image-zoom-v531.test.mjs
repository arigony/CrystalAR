import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../style-v510.css", import.meta.url), "utf8");
const module = await readFile(new URL("../src/science-v510.js", import.meta.url), "utf8");

test("mineral image is compact in desktop and mobile layouts", () => {
  assert.match(css, /grid-template-columns: 104px minmax\(0, 1fr\)/);
  assert.match(css, /width: 104px;\s*height: 104px/);
  assert.match(css, /grid-template-columns: 84px minmax\(0, 1fr\)/);
  assert.match(css, /width: 84px; height: 84px/);
});

test("mouse hover and touch click both enlarge the mineral image", () => {
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /\.mineral-image-frame:hover/);
  assert.match(css, /\.mineral-figure\.image-expanded/);
  assert.match(css, /position: fixed/);
  assert.match(module, /id="mineralImageButton"/);
  assert.match(module, /toggleMineralImageZoom/);
  assert.match(module, /aria-expanded/);
  assert.match(module, /event\.key === "Escape"/);
});


test('does not display the old "imagem real" label', () => {
  assert.doesNotMatch(css, /content:\s*["']imagem real["']/i);
});
