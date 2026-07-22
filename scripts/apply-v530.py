#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

for relative in ["index.html", "src/runtime-watchdog.js", "src/provenance.js", "CITATION.cff"]:
    path = ROOT / relative
    text = path.read_text(encoding="utf-8")
    text = text.replace("5.2.0", "5.3.0")
    path.write_text(text, encoding="utf-8")

index = ROOT / "index.html"
text = index.read_text(encoding="utf-8")
text = text.replace(
    "galeria educacional com 21 estruturas cristalográficas, fotografias minerais reais licenciadas, comparação de polimorfos, coordenação, ocupação e WebAR",
    "galeria educacional com 21 estruturas cristalográficas, roteiro diamante-grafite, fotografias minerais reais, comparação de alótropos, polimorfos e WebAR",
)
text = text.replace(
    "Estruturas cristalinas e minerais reais",
    "Alótropos, minerais reais e estruturas cristalinas",
)
text = text.replace(
    "21 estruturas · minerais reais · polimorfismo · coordenação · proveniência · WebAR",
    "21 estruturas · alótropos · minerais reais · polimorfismo · WebAR",
)
text = text.replace(
    "Vinte e uma estruturas para comparar composição, rede cristalina, coordenação e aparência mineral. Fotografias e micrografias reais são identificadas e creditadas separadamente dos modelos atômicos.",
    "Vinte e uma estruturas para relacionar composição, conectividade atômica, propriedades e aparência observável. O roteiro diamante × grafite introduz alotropia, sp³/sp² e dimensionalidade da rede.",
)
index.write_text(text, encoding="utf-8")
