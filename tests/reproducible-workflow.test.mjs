import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const workflow = await readFile(new URL("../src/provenance.js", import.meta.url), "utf8");
const watchdog = await readFile(new URL("../src/runtime-watchdog.js", import.meta.url), "utf8");
const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const renderer = await readFile(new URL("../src/renderer.js", import.meta.url), "utf8");

test("a interface apresenta CrystalAR 5.2.0 e o fluxo em duas etapas", () => {
  assert.match(index, /Versão v5\.2\.0/);
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

test("a proveniência inclui versão, identificador, URI e SHA-256", () => {
  assert.match(index, /SHA-256 do texto CIF carregado/);
  assert.match(index, /Copiar proveniência/);
  assert.match(workflow, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(workflow, /APP_VERSION = "v5\.2\.0"/);
  assert.match(workflow, /EDUSIF/);
  assert.match(workflow, /FIQCEN/);
  assert.match(workflow, /OFERUN/);
});

test("o carregamento 3D usa jsDelivr e possui recuperação visível", () => {
  assert.match(index, /cdn\.jsdelivr\.net\/npm\/three@0\.160\.0/);
  assert.match(app, /cdn\.jsdelivr\.net\/npm\/three@0\.160\.0/);
  assert.match(renderer, /cdn\.jsdelivr\.net\/npm\/three@0\.160\.0/);
  assert.match(index, /runtime-watchdog\.js\?v=5\.2\.0/);
  assert.match(watchdog, /A estrutura inicial não foi carregada/);
  assert.match(index, /Recarregar visualizador/);
});

test("a galeria-base mantém quinze estruturas e o módulo científico acrescenta seis", () => {
  const exampleButtons = index.match(/data-example=/g) || [];
  assert.equal(exampleButtons.length, 15);
  assert.match(watchdog, /science-v510\.js\?v=5\.2\.0/);
});
