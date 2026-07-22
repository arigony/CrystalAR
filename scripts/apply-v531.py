#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Trecho não encontrado: {label}")
    return text.replace(old, new, 1)


# Release/version synchronization.
version_paths = [
    "package.json",
    "index.html",
    "src/science-v510.js",
    "src/runtime-watchdog.js",
    "src/provenance.js",
    "CITATION.cff",
    "README.md",
]
version_paths.extend(str(path.relative_to(ROOT)) for path in (ROOT / "tests").glob("*.mjs"))
for relative in version_paths:
    text = read(relative).replace("5.3.0", "5.3.1")
    write(relative, text)

citation = read("CITATION.cff").replace('date-released: "2026-07-21"', 'date-released: "2026-07-22"')
write("CITATION.cff", citation)

science = read("src/science-v510.js")
science = science.replace('const INCORPORATED_ON = "21/07/2026";', 'const INCORPORATED_ON = "22/07/2026";')
science = replace_once(
    science,
    '''        <div class="mineral-image-frame">
          <img id="mineralImage" src="" alt="" loading="lazy" decoding="async" />
        </div>''',
    '''        <button id="mineralImageButton" class="mineral-image-frame" type="button" aria-expanded="false" aria-label="Ampliar fotografia do mineral">
          <img id="mineralImage" src="" alt="" loading="lazy" decoding="async" />
          <span class="mineral-zoom-hint" aria-hidden="true">⌕</span>
        </button>''',
    "botão da imagem mineral",
)
zoom_functions = '''function closeMineralImageZoom() {
  const figure = $("mineralFigure");
  const button = $("mineralImageButton");
  if (!figure || !button) return;
  figure.classList.remove("image-expanded");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", `Ampliar fotografia: ${$("mineralImageTitle")?.textContent || "mineral"}`);
  document.body.classList.remove("mineral-image-open");
}

function toggleMineralImageZoom() {
  const figure = $("mineralFigure");
  const button = $("mineralImageButton");
  if (!figure || !button) return;
  const expanded = !figure.classList.contains("image-expanded");
  figure.classList.toggle("image-expanded", expanded);
  button.setAttribute("aria-expanded", String(expanded));
  button.setAttribute("aria-label", expanded
    ? "Fechar fotografia ampliada"
    : `Ampliar fotografia: ${$("mineralImageTitle")?.textContent || "mineral"}`);
  document.body.classList.toggle("mineral-image-open", expanded);
}

'''
science = replace_once(science, "function renderMineralImage(example) {", zoom_functions + "function renderMineralImage(example) {", "funções de ampliação")
science = replace_once(
    science,
    '''  const element = $("mineralImage");
  element.src = `${image.path}?v=5.3.1`;
  element.alt = image.alt;''',
    '''  closeMineralImageZoom();
  const element = $("mineralImage");
  element.src = `${image.path}?v=5.3.1`;
  element.alt = image.alt;
  $("mineralImageButton").setAttribute("aria-label", `Ampliar fotografia: ${image.title}`);''',
    "sincronização da imagem",
)
science = replace_once(
    science,
    '''  $("mineralImage").addEventListener("error", () => {
    $("mineralImageCaption").textContent = "A imagem mineral não pôde ser carregada. A estrutura 3D permanece disponível.";
  });''',
    '''  $("mineralImage").addEventListener("error", () => {
    $("mineralImageCaption").textContent = "A imagem mineral não pôde ser carregada. A estrutura 3D permanece disponível.";
  });

  $("mineralImageButton").addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    toggleMineralImageZoom();
  });

  document.addEventListener("click", event => {
    if ($("mineralFigure")?.classList.contains("image-expanded") && !$("mineralImageButton")?.contains(event.target)) {
      closeMineralImageZoom();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMineralImageZoom();
  });''',
    "eventos de ampliação",
)
write("src/science-v510.js", science)

css = read("style-v510.css")
old_css = '''.mineral-figure {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(130px, 0.82fr) minmax(0, 1.25fr);
  gap: 14px;
  align-items: stretch;
  padding: 12px;
  border: 1px solid rgba(29, 109, 120, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 8px 22px rgba(28, 62, 68, 0.08);
}

.mineral-image-frame {
  position: relative;
  min-height: 160px;
  overflow: hidden;
  border-radius: 11px;
  background: #dfe7e8;
}

.mineral-image-frame::after {
  content: "imagem real";
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 4px 7px;
  border-radius: 999px;
  background: rgba(12, 31, 35, 0.78);
  color: #fff;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.mineral-image-frame img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 160px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
'''
new_css = '''.mineral-figure {
  margin: 0;
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 10px;
  border: 1px solid rgba(29, 109, 120, 0.22);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 8px 22px rgba(28, 62, 68, 0.08);
  position: relative;
  overflow: visible;
}

.mineral-image-frame {
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  width: 104px;
  height: 104px;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(29, 109, 120, 0.18);
  border-radius: 11px;
  background: #eef2f2;
  cursor: zoom-in;
  isolation: isolate;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.mineral-image-frame::after {
  content: "imagem real";
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 3px 6px;
  border-radius: 999px;
  background: rgba(12, 31, 35, 0.78);
  color: #fff;
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  pointer-events: none;
}

.mineral-image-frame img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  background: #fff;
}

.mineral-zoom-hint {
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 23px;
  height: 23px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #155f69;
  box-shadow: 0 2px 8px rgba(12, 31, 35, 0.2);
  font-size: 1rem;
  font-weight: 900;
  pointer-events: none;
}

@media (hover: hover) and (pointer: fine) {
  .mineral-image-frame:hover {
    z-index: 40;
    transform: scale(2.05);
    transform-origin: left center;
    box-shadow: 0 16px 38px rgba(12, 31, 35, 0.32);
  }
}

.mineral-image-open { overflow: hidden; }

.mineral-figure.image-expanded::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(7, 20, 24, 0.72);
  backdrop-filter: blur(3px);
}

.mineral-figure.image-expanded .mineral-image-frame {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 1000;
  width: min(86vw, 520px);
  height: min(86vw, 520px);
  transform: translate(-50%, -50%);
  transform-origin: center;
  border: 4px solid #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
  cursor: zoom-out;
}

.mineral-figure.image-expanded .mineral-image-frame:hover {
  transform: translate(-50%, -50%);
}

.mineral-figure.image-expanded .mineral-image-frame::after {
  left: 10px;
  bottom: 10px;
  font-size: 0.7rem;
}
'''
css = replace_once(css, old_css, new_css, "estilo da miniatura")
old_mobile = '''@media (max-width: 620px) {
  .science-lesson { padding: 12px; }
  .mineral-figure { grid-template-columns: 1fr; }
  .mineral-image-frame,
  .mineral-image-frame img { min-height: 210px; }
  .lesson-steps { grid-template-columns: 1fr; }
  .lesson-nav { grid-template-columns: 1fr; }
  .science-controls { position: relative; }
}'''
new_mobile = '''@media (max-width: 620px) {
  .science-lesson { padding: 12px; }
  .mineral-figure { grid-template-columns: 84px minmax(0, 1fr); gap: 10px; }
  .mineral-image-frame { width: 84px; height: 84px; }
  .mineral-image-copy h4 { font-size: 1rem; }
  .mineral-image-copy p { font-size: 0.82rem; }
  .lesson-steps { grid-template-columns: 1fr; }
  .lesson-nav { grid-template-columns: 1fr; }
  .science-controls { position: relative; }
}

@media (max-width: 380px) {
  .mineral-figure { grid-template-columns: 74px minmax(0, 1fr); }
  .mineral-image-frame { width: 74px; height: 74px; }
}'''
css = replace_once(css, old_mobile, new_mobile, "estilo móvel")
write("style-v510.css", css)

fetcher = read("scripts/fetch-mineral-images.py")
fetcher = fetcher.replace('CrystalAR/5.3 educational image sync', 'CrystalAR/5.3.1 educational image sync')
old_diamond = '''    {
        "key": "diamond",
        "filename": "diamond.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Diamond_crystal%2C_0%2C7_ct.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Diamond_crystal,_0,7_ct.jpg",
        "author": "Tõnu Pani",
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "description": "Cristal bruto e isolado de diamante, 0,7 ct, com faces naturais preservadas.",
        "crop": "square-center",
    },'''
new_diamond = '''    {
        "key": "diamond",
        "filename": "diamond.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/b/be/Diamond-260146.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Diamond-260146.jpg",
        "author": "Rob Lavinsky, iRocks.com",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "description": "Diamante natural transparente, branco e octaédrico arredondado, 0,06 ct, do Crater of Diamonds State Park, Arkansas, EUA.",
        "crop": "square-center",
    },'''
fetcher = replace_once(fetcher, old_diamond, new_diamond, "fonte da imagem do diamante")
write("scripts/fetch-mineral-images.py", fetcher)

presets = read("src/science-presets.js")
old_preset = '''    mineralImage: {
      path: "assets/minerals/diamond.jpg", kind: "Fotografia de cristal real", title: "Diamante bruto — C",
      alt: "Cristal bruto e isolado de diamante, sem lapidação e sem outro mineral dominando a imagem.",
      caption: "Cristal bruto de diamante de 0,7 ct. As faces externas resultam do crescimento cristalino; não são uma fotografia da rede atômica.",
      author: "Tõnu Pani", license: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Diamond_crystal,_0,7_ct.jpg"
    },'''
new_preset = '''    mineralImage: {
      path: "assets/minerals/diamond.jpg", kind: "Fotografia de cristal real", title: "Diamante bruto — C",
      alt: "Diamante natural transparente, branco e octaédrico arredondado, isolado sobre fundo neutro.",
      caption: "Diamante natural de 0,06 ct do Crater of Diamonds State Park, Arkansas. A forma octaédrica arredondada é uma morfologia externa real, não uma fotografia da rede atômica.",
      author: "Rob Lavinsky, iRocks.com", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Diamond-260146.jpg"
    },'''
presets = replace_once(presets, old_preset, new_preset, "metadados didáticos do diamante")
write("src/science-presets.js", presets)

credits = read("assets/minerals/IMAGE_CREDITS.md").replace("CrystalAR 5.3.0", "CrystalAR 5.3.1")
credits = re.sub(
    r"## Diamante — `diamond\.jpg`\n.*?(?=\n## Grafite)",
    '''## Diamante — `diamond.jpg`

- Fotografia: **Rob Lavinsky, iRocks.com**
- Exemplar: diamante natural transparente, branco e octaédrico arredondado, `0,06 ct`, do Crater of Diamonds State Park, Arkansas, EUA
- Fonte: <https://commons.wikimedia.org/wiki/File:Diamond-260146.jpg>
- Licença: **CC BY-SA 3.0**
- Alterações: recorte quadrado, redimensionamento e compressão JPEG
- Nota didática: a fotografia mostra uma morfologia externa real; o modelo 3D apresenta a rede covalente periódica
''',
    credits,
    count=1,
    flags=re.S,
)
write("assets/minerals/IMAGE_CREDITS.md", credits)

browser = read("tests/browser-smoke.mjs")
browser = browser.replace("Cristal bruto e isolado de diamante", "Diamante natural transparente, branco e octaédrico arredondado")
browser = browser.replace("Tõnu Pani", "Rob Lavinsky, iRocks.com")
browser = browser.replace('assert.match(dom, /id="mineralImage"/', 'assert.match(dom, /id="mineralImageButton"[^>]*aria-expanded="false"/, `O botão acessível da imagem mineral não apareceu.\\n${stderr}`);\nassert.match(dom, /id="mineralImage"/')
write("tests/browser-smoke.mjs", browser)

mineral_test = read("tests/mineral-images-v520.test.mjs")
mineral_test = mineral_test.replace("/bruto e isolado/i", "/transparente.*octaédrico/i")
mineral_test = mineral_test.replace("/CC BY 4\\.0/", "/CC BY-SA 3\\.0/")
write("tests/mineral-images-v520.test.mjs", mineral_test)

zoom_test = '''import test from "node:test";
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
'''
write("tests/mineral-image-zoom-v531.test.mjs", zoom_test)

release_notes = '''# CrystalAR 5.3.1 — miniaturas e ampliação de imagens minerais

## Ajustes de interface

- as fotografias e micrografias passam a usar miniaturas compactas no roteiro;
- no computador, a imagem aumenta ao passar o mouse;
- em telas sensíveis ao toque, um toque abre a imagem em destaque e outro toque, toque externo ou `Esc` fecha a ampliação;
- o controle usa botão acessível com `aria-expanded` e rótulo dinâmico.

## Diamante

A fotografia anterior foi substituída por um diamante natural transparente, branco e octaédrico arredondado, fotografado por Rob Lavinsky. A fonte Wikimedia Commons e a licença CC BY-SA 3.0 permanecem visíveis na interface e no manifesto.
'''
write("RELEASE_NOTES_5.3.1.md", release_notes)

readme = read("README.md")
needle = "A versão 5.3 mantém as **21 estruturas**"
if needle in readme and "miniaturas compactas" not in readme:
    paragraph_end = readme.find("\n", readme.find(needle))
    readme = readme[:paragraph_end + 1] + "\nNa correção 5.3.1, as imagens minerais usam miniaturas compactas com ampliação por mouse ou toque, e a fotografia do diamante foi substituída por um exemplar transparente octaédrico arredondado com licença CC BY-SA 3.0.\n" + readme[paragraph_end + 1:]
write("README.md", readme)

print("CrystalAR 5.3.1 source changes applied.")
