import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const workflow = await readFile(new URL("../src/provenance.js", import.meta.url), "utf8");

test("a interface apresenta a versão 0.4.0 e o fluxo em duas etapas", () => {
  assert.match(index, /Versão v0\.4\.0/);
  assert.match(index, /Abrir a URI oficial/);
  assert.match(index, /Abrir o CIF baixado/);
  assert.match(index, /O CrystalAR não baixa dados do COD automaticamente/);
});

test("o formulário abre a URI oficial sem iniciar busca remota", () => {
  assert.match(workflow, /https:\/\/www\.crystallography\.net\/cod\//);
  assert.match(workflow, /stopImmediatePropagation\(\)/);
  assert.match(workflow, /window\.open\(uri/);
  assert.doesNotMatch(workflow, /fetch\(officialUri/);
});

test("a proveniência inclui versão, COD ID, URI e SHA-256", () => {
  assert.match(index, /SHA-256 do texto CIF carregado/);
  assert.match(index, /Copiar proveniência/);
  assert.match(workflow, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(workflow, /Versão do aplicativo: CrystalAR/);
});

test("a galeria mantém nove estruturas locais", () => {
  const exampleButtons = index.match(/data-example=/g) || [];
  assert.equal(exampleButtons.length, 9);
});
