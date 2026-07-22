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


# Synchronize release number in runtime, metadata and tests.
paths = [
    "package.json",
    "index.html",
    "src/science-v510.js",
    "src/runtime-watchdog.js",
    "src/provenance.js",
    "CITATION.cff",
    "README.md",
    "assets/minerals/IMAGE_CREDITS.md",
]
paths.extend(str(path.relative_to(ROOT)) for path in (ROOT / "tests").glob("*.mjs"))
for relative in paths:
    text = read(relative)
    text = text.replace("5.3.1", "5.3.2").replace(r"5\.3\.1", r"5\.3\.2")
    write(relative, text)

# Remove the visual label requested by the author.
css = read("style-v510.css")
css = re.sub(
    r'\n\.mineral-image-frame::after \{\n  content: "imagem real";.*?\n\}\n',
    "\n",
    css,
    count=1,
    flags=re.S,
)
css = re.sub(
    r'\n\.mineral-figure\.image-expanded \.mineral-image-frame::after \{.*?\n\}\n',
    "\n",
    css,
    count=1,
    flags=re.S,
)
if 'content: "imagem real"' in css:
    raise RuntimeError('O selo "imagem real" ainda permanece no CSS.')
write("style-v510.css", css)

# Replace the licensed source used by the reproducible image pipeline.
fetcher = read("scripts/fetch-mineral-images.py")
fetcher = fetcher.replace("CrystalAR/5.3.1 educational image sync", "CrystalAR/5.3.2 educational image sync")
old_entry = '''    {
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
new_entry = '''    {
        "key": "diamond",
        "filename": "diamond.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Diamond-diamond_macle1.jpg",
        "source_page": "https://commons.wikimedia.org/wiki/File:Diamond-diamond_macle1.jpg",
        "author": "Rob Lavinsky, iRocks.com",
        "license": "CC BY-SA 3.0",
        "license_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "description": "Diamante natural maclado (macle), triangular, transparente, 9,94 ct, 1,5 × 1,5 × 0,4 cm, África do Sul.",
        "crop": "square-center",
    },'''
fetcher = replace_once(fetcher, old_entry, new_entry, "entrada do diamante no pipeline")
write("scripts/fetch-mineral-images.py", fetcher)

# Update the visible scientific description and attribution.
presets = read("src/science-presets.js")
old_preset = '''    mineralImage: {
      path: "assets/minerals/diamond.jpg", kind: "Fotografia de cristal real", title: "Diamante bruto — C",
      alt: "Diamante natural transparente, branco e octaédrico arredondado, isolado sobre fundo neutro.",
      caption: "Diamante natural de 0,06 ct do Crater of Diamonds State Park, Arkansas. A forma octaédrica arredondada é uma morfologia externa real, não uma fotografia da rede atômica.",
      author: "Rob Lavinsky, iRocks.com", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Diamond-260146.jpg"
    },'''
new_preset = '''    mineralImage: {
      path: "assets/minerals/diamond.jpg", kind: "Fotografia de cristal", title: "Diamante maclado — C",
      alt: "Diamante natural transparente com macla triangular do tipo macle, isolado sobre fundo preto.",
      caption: "Diamante natural maclado (macle), de 9,94 ct, procedente da África do Sul. A forma triangular resulta da geminação cristalina e não representa diretamente a rede atômica.",
      author: "Rob Lavinsky, iRocks.com", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Diamond-diamond_macle1.jpg"
    },'''
presets = replace_once(presets, old_preset, new_preset, "metadados do diamante")
write("src/science-presets.js", presets)

# Update the formal image credit record.
credits = read("assets/minerals/IMAGE_CREDITS.md")
credits = re.sub(
    r"## Diamante — `diamond\.jpg`\n.*?(?=\n## Grafite)",
    '''## Diamante — `diamond.jpg`

- Fotografia: **Rob Lavinsky, iRocks.com**
- Exemplar: diamante natural maclado (`macle`), triangular e transparente, `9,94 ct`, `1,5 × 1,5 × 0,4 cm`, África do Sul
- Fonte: <https://commons.wikimedia.org/wiki/File:Diamond-diamond_macle1.jpg>
- Licença: **CC BY-SA 3.0**
- Alterações: recorte quadrado, redimensionamento e compressão JPEG
- Nota didática: a forma triangular decorre da macla cristalina; o visualizador 3D apresenta a rede covalente periódica
''',
    credits,
    count=1,
    flags=re.S,
)
write("assets/minerals/IMAGE_CREDITS.md", credits)

# Keep README aligned with the actual release.
readme = read("README.md")
readme = readme.replace(
    "Na correção 5.3.2, as imagens minerais usam miniaturas compactas com ampliação por mouse ou toque, e a fotografia do diamante foi substituída por um exemplar transparente octaédrico arredondado com licença CC BY-SA 3.0.",
    "Na correção 5.3.2, o selo visual ‘imagem real’ foi removido e a fotografia do diamante foi substituída por um exemplar natural maclado, triangular e transparente, com licença CC BY-SA 3.0. As miniaturas compactas e a ampliação por mouse ou toque foram preservadas.",
)
write("README.md", readme)

# Update tests for the selected specimen and assert that the removed label does not return.
mineral_test = read("tests/mineral-images-v520.test.mjs")
mineral_test = mineral_test.replace("/transparente.*octaédrico/i", "/maclado.*triangular.*transparente/i")
write("tests/mineral-images-v520.test.mjs", mineral_test)

zoom_test = read("tests/mineral-image-zoom-v531.test.mjs")
if 'does not display the old "imagem real" label' not in zoom_test:
    zoom_test += '''\n
test('does not display the old "imagem real" label', () => {
  assert.doesNotMatch(css, /content:\s*["']imagem real["']/i);
});
'''
write("tests/mineral-image-zoom-v531.test.mjs", zoom_test)

browser = read("tests/browser-smoke.mjs")
browser = browser.replace(
    "Diamante natural transparente, branco e octaédrico arredondado",
    "Diamante natural transparente com macla triangular do tipo macle",
)
write("tests/browser-smoke.mjs", browser)

release = '''# CrystalAR 5.3.2 — diamante maclado e interface sem selo

## Ajustes

- remoção completa do selo visual “imagem real” das miniaturas e da visualização ampliada;
- substituição da fotografia do diamante pelo arquivo `Diamond-diamond_macle1.jpg`;
- exemplar natural maclado (`macle`), triangular, transparente e procedente da África do Sul;
- autoria de Rob Lavinsky e licença CC BY-SA 3.0 registradas na interface, créditos e manifesto;
- preservação da ampliação por mouse, toque e teclado.

## Integridade

A fotografia representa a morfologia externa de uma macla natural. O modelo cristalográfico continua representando a rede periódica do diamante e não a forma macroscópica triangular.
'''
write("RELEASE_NOTES_5.3.2.md", release)

print("CrystalAR 5.3.2 source migration applied.")
