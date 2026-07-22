import { parseCIFDocument } from "./cif-parser.js";
import { buildCrystalModel } from "./crystal.js";
import { LESSON_FAMILIES, SCIENCE_EXAMPLES } from "./science-presets.js";

const VERSION = "v5.3.2";
const INCORPORATED_ON = "22/07/2026";
const $ = id => document.getElementById(id);
const state = { key: "", text: "", filename: "", doc: null, model: null, measure: false, family: "carbon" };
const BASE_SCIENCE_MAP = { diamond: "carbonDiamond", graphite: "carbonGraphite" };
const SCIENCE_BASE_MAP = { carbonDiamond: "diamond", carbonGraphite: "graphite" };

function injectStyle() {
  if (document.querySelector('link[data-crystalar-v510]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "style-v510.css?v=5.3.2";
  link.dataset.crystalarV510 = "true";
  document.head.appendChild(link);
}

function cardsFor(family) {
  return Object.entries(SCIENCE_EXAMPLES)
    .filter(([, item]) => item.family === family)
    .map(([key, item]) => `
      <button class="example-card science-card" type="button" data-science-example="${key}" aria-pressed="false">
        <strong>${item.shortLabel}</strong><span class="badge experimental">COD ${item.codId}</span>
      </button>`)
    .join("");
}

function injectInterface() {
  if (document.getElementById("scienceGallery510")) return;
  document.title = "CrystalAR 5.3.2 — composição, estrutura e propriedade";
  document.querySelector(".panel-heading .eyebrow").textContent = `Versão ${VERSION}`;
  const brandText = document.querySelector(".brand p");
  if (brandText) brandText.textContent = "21 estruturas · alótropos · minerais reais · polimorfismo · WebAR";
  const intro = document.querySelector(".gallery-intro");
  if (intro) intro.textContent = "Vinte e uma estruturas para relacionar composição, conectividade atômica, propriedades e aparência observável. O novo roteiro diamante × grafite introduz alotropia, sp³/sp² e dimensionalidade da rede.";
  $("provVersion").textContent = VERSION;

  const divider = document.querySelector(".control-body > .divider");
  const sections = document.createElement("div");
  sections.id = "scienceGallery510";
  sections.innerHTML = `
    <section class="example-group" aria-labelledby="tio2Title">
      <div class="example-group-heading"><h3 id="tio2Title">Polimorfos do TiO₂</h3><span>octaedros TiO₆ e conectividade</span></div>
      <div class="example-grid">${cardsFor("tio2")}</div>
    </section>
    <section class="example-group" aria-labelledby="caco3Title">
      <div class="example-group-heading"><h3 id="caco3Title">Polimorfos do CaCO₃</h3><span>coordenação, empacotamento e desordem</span></div>
      <div class="example-grid">${cardsFor("caco3")}</div>
    </section>
    <section class="science-lesson" aria-labelledby="scienceLessonTitle">
      <div class="lesson-heading"><span class="eyebrow">Roteiro comparativo</span><h3 id="scienceLessonTitle">Investigue antes de concluir</h3></div>
      <label>Família estrutural
        <select id="scienceFamily">
          <option value="carbon">Carbono: diamante e grafite</option>
          <option value="tio2">TiO₂: rutilo, anatásio e brookita</option>
          <option value="caco3">CaCO₃: calcita, aragonita e vaterita</option>
        </select>
      </label>
      <figure id="mineralFigure" class="mineral-figure">
        <button id="mineralImageButton" class="mineral-image-frame" type="button" aria-expanded="false" aria-label="Ampliar fotografia do mineral">
          <img id="mineralImage" src="" alt="" loading="lazy" decoding="async" />
          <span class="mineral-zoom-hint" aria-hidden="true">⌕</span>
        </button>
        <figcaption class="mineral-image-copy">
          <span id="mineralImageKind" class="eyebrow"></span>
          <h4 id="mineralImageTitle"></h4>
          <p id="mineralImageCaption"></p>
          <small id="mineralImageCredit"></small>
          <a id="mineralImageSource" href="#" target="_blank" rel="noopener noreferrer">Ver fonte e licença</a>
        </figcaption>
      </figure>
      <p class="macro-micro-note"><strong>Escalas diferentes:</strong> a fotografia mostra a aparência da amostra; o visualizador 3D mostra a organização atômica periódica. Hábito, cor e brilho também dependem de crescimento, defeitos e impurezas.</p>
      <div id="lessonPrompt" class="lesson-prompt"></div>
      <div id="lessonComparison" class="lesson-comparison hidden"></div>
      <div id="lessonQuestions" class="lesson-questions hidden"></div>
      <div id="lessonSteps" class="lesson-steps"></div>
      <div class="lesson-nav"><button id="lessonPrev" class="secondary" type="button">Estrutura anterior</button><button id="lessonNext" class="primary" type="button">Próxima estrutura</button></div>
    </section>`;
  divider?.before(sections);

  const checkRow = document.querySelector(".check-row");
  const enhanced = document.createElement("div");
  enhanced.className = "science-controls";
  enhanced.innerHTML = `
    <label><input id="showPolyhedra" type="checkbox" /> Mostrar poliedros de coordenação</label>
    <button id="measureMode" class="secondary" type="button" aria-pressed="false">Medir distância/ângulo</button>
    <output id="measurementResult">Selecione dois átomos para distância ou três para ângulo.</output>`;
  checkRow?.after(enhanced);
}

function rendererReady() {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const tick = () => {
      if (globalThis.CrystalARRenderer) return resolve(globalThis.CrystalARRenderer);
      if (++tries > 100) return reject(new Error("Renderizador não disponível para o módulo científico."));
      setTimeout(tick, 50);
    };
    tick();
  });
}

function toast(message, type = "info") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  $("toastBox")?.appendChild(el);
  setTimeout(() => el.remove(), 4600);
}

function setStatus(message, type = "") {
  const el = $("status");
  if (!el) return;
  el.textContent = message;
  el.className = `status ${type}`.trim();
}

function item(label, value, wide = false) {
  const container = document.createElement("div");
  container.className = `info-item${wide ? " wide" : ""}`;
  const heading = document.createElement("span");
  heading.textContent = label;
  const content = document.createElement("strong");
  content.textContent = value || "—";
  container.append(heading, content);
  return container;
}

function formatCell(cell) { return `a ${cell.a.toFixed(3)} · b ${cell.b.toFixed(3)} · c ${cell.c.toFixed(3)} Å`; }
function formatAngles(cell) { return `α ${cell.alpha.toFixed(2)}° · β ${cell.beta.toFixed(2)}° · γ ${cell.gamma.toFixed(2)}°`; }

async function sha256(text) {
  if (!crypto?.subtle) return "indisponível";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

function closeMineralImageZoom() {
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

function renderMineralImage(example) {
  const image = example.mineralImage;
  if (!image) return;
  closeMineralImageZoom();
  const element = $("mineralImage");
  element.src = `${image.path}?v=5.3.2`;
  element.alt = image.alt;
  $("mineralImageButton").setAttribute("aria-label", `Ampliar fotografia: ${image.title}`);
  $("mineralImageKind").textContent = image.kind;
  $("mineralImageTitle").textContent = image.title;
  $("mineralImageCaption").textContent = image.caption;
  $("mineralImageCredit").textContent = `Imagem: ${image.author} · ${image.license} · recortada e redimensionada para a CrystalAR`;
  $("mineralImageSource").href = image.source;
}

function renderInfo(example, model, counts) {
  $("structureName").textContent = example.label;
  $("structureFormula").textContent = model.metadata.formula;
  $("structureMeta").textContent = `galeria científica · ${counts.atomCount} átomos · ${counts.bondCount} contatos explícitos · ${counts.polyhedronCount || 0} poliedros`;
  const entries = [
    item("Classificação", "Derivado educacional de determinação experimental COD", true),
    item("COD ID", example.codId),
    item("Grupo espacial original", example.originalSpaceGroup, true),
    item("Sistema cristalino", example.crystalSystem),
    item("Coordenação", example.coordination, true)
  ];
  if (example.hybridization) entries.push(item("Hibridização", example.hybridization), item("Dimensionalidade", example.dimensionality, true));
  if (example.propertySummary) entries.push(item("Estrutura → propriedade", example.propertySummary, true));
  entries.push(
    item("Parâmetros", formatCell(model.cell), true),
    item("Ângulos", formatAngles(model.cell), true),
    item("Z original", model.metadata.z),
    item("Átomos na cela expandida", String(model.unitAtoms.length)),
    item("Ocupação mínima", Math.min(...model.unitAtoms.map(atom => atom.occupancy)).toFixed(3))
  );
  $("infoGrid").replaceChildren(...entries);
  const box = $("citationBox");
  box.textContent = `Nota didática: ${example.teachingNote} Pergunta de investigação: ${example.question}${example.scientificWarning ? ` ALERTA CIENTÍFICO: ${example.scientificWarning}` : ""}`;
  box.classList.remove("hidden");
  box.classList.toggle("scientific-warning", Boolean(example.scientificWarning));
}

function updateProvenance(example, text) {
  $("provType").textContent = "Derivado educacional de determinação experimental COD";
  $("provCodId").textContent = example.codId;
  $("provUri").textContent = `https://www.crystallography.net/cod/${example.codId}.cif`;
  $("provDate").textContent = INCORPORATED_ON;
  $("provVersion").textContent = VERSION;
  $("provHash").textContent = "calculando…";
  $("openOfficialCif").disabled = false;
  sha256(text).then(hash => { if (state.key && state.text === text) $("provHash").textContent = hash; });
}

function options(example) {
  return {
    representation: $("representation").value,
    showCell: $("showCell").checked,
    showBonds: $("showBonds").checked,
    bondRules: example.bondRules,
    showPolyhedra: $("showPolyhedra").checked,
    polyhedra: example.polyhedra
  };
}

function rerender() {
  if (!state.key || !state.doc) return;
  const example = SCIENCE_EXAMPLES[state.key];
  const repeat = Number($("supercell").value);
  const renderer = globalThis.CrystalARRenderer;
  const model = buildCrystalModel(state.doc, repeat);
  const counts = renderer.renderModel(model, options(example));
  state.model = model;
  renderInfo(example, model, counts);
  setStatus(`Visualização científica atualizada: ${counts.atomCount} átomos, ${counts.bondCount} contatos por regras explícitas e ${counts.polyhedronCount || 0} poliedros.`, "success");
}

async function loadScienceExample(key) {
  const example = SCIENCE_EXAMPLES[key];
  if (!example) return;
  state.key = key;
  state.family = example.family;
  const baseKey = SCIENCE_BASE_MAP[key] || "";
  document.querySelectorAll("[data-example],[data-science-example]").forEach(button => {
    const active = button.dataset.scienceExample === key || (baseKey && button.dataset.example === baseKey);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  $("representation").value = example.representation;
  $("showBonds").checked = example.showBonds;
  $("showBonds").disabled = example.allowBonds === false;
  $("showCell").checked = true;
  $("supercell").value = String(example.supercell);
  $("showPolyhedra").checked = false;
  $("showPolyhedra").disabled = !example.polyhedra;
  $("codId").value = example.codId;
  setStatus(`Carregando ${example.label}…`, "pending");

  try {
    const response = await fetch(example.path, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const doc = parseCIFDocument(text);
    const model = buildCrystalModel(doc, example.supercell);
    const renderer = await rendererReady();
    const counts = renderer.renderModel(model, options(example));
    Object.assign(state, { text, filename: example.path.split("/").pop(), doc, model });
    renderInfo(example, model, counts);
    updateProvenance(example, text);
    $("scienceFamily").value = example.family;
    renderLesson(example.family, key);
    $("downloadCif").disabled = false;
    setStatus(`${example.label}: relacione conectividade atômica, dimensionalidade e propriedade observada.`, "success");
    toast(`${example.label} carregado no roteiro científico.`, "success");
  } catch (error) {
    state.key = "";
    setStatus(`Não foi possível abrir ${example.label}. ${error.message}`, "error");
    toast(`Falha ao abrir ${example.label}.`, "error");
    console.error(error);
  }
}

function renderComparison(lesson) {
  const comparison = $("lessonComparison");
  const questions = $("lessonQuestions");
  if (lesson.comparison?.length) {
    const [firstKey, secondKey] = lesson.keys;
    comparison.innerHTML = `
      <div class="comparison-heading"><span class="eyebrow">Estrutura → propriedade</span><strong>Compare antes de responder</strong></div>
      <div class="comparison-scroll"><table><thead><tr><th>Critério</th><th>${SCIENCE_EXAMPLES[firstKey].shortLabel}</th><th>${SCIENCE_EXAMPLES[secondKey].shortLabel}</th></tr></thead>
      <tbody>${lesson.comparison.map(row => `<tr><th>${row[0]}</th><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("")}</tbody></table></div>`;
    comparison.classList.remove("hidden");
  } else {
    comparison.replaceChildren();
    comparison.classList.add("hidden");
  }
  if (lesson.questions?.length) {
    questions.innerHTML = `<strong>Perguntas de investigação</strong><ol>${lesson.questions.map(question => `<li>${question}</li>`).join("")}</ol>`;
    questions.classList.remove("hidden");
  } else {
    questions.replaceChildren();
    questions.classList.add("hidden");
  }
}

function renderLesson(family, activeKey = "") {
  const lesson = LESSON_FAMILIES[family];
  if (!lesson) return;
  const current = activeKey || lesson.keys[0];
  const example = SCIENCE_EXAMPLES[current];
  renderMineralImage(example);
  renderComparison(lesson);
  $("lessonPrompt").innerHTML = `<strong>${lesson.guidingQuestion}</strong><span>${lesson.synthesis}</span>`;
  $("lessonSteps").innerHTML = lesson.keys.map((key, index) => {
    const entry = SCIENCE_EXAMPLES[key];
    return `<button type="button" data-lesson-key="${key}" class="${key === current ? "active" : ""}"><span>${index + 1}</span><strong>${entry.shortLabel}</strong><small>${entry.originalSpaceGroup}</small></button>`;
  }).join("");
  document.querySelectorAll("[data-lesson-key]").forEach(button => button.addEventListener("click", () => loadScienceExample(button.dataset.lessonKey)));
}

function nextLesson(delta) {
  const lesson = LESSON_FAMILIES[$("scienceFamily").value];
  const index = Math.max(0, lesson.keys.indexOf(state.key));
  loadScienceExample(lesson.keys[(index + delta + lesson.keys.length) % lesson.keys.length]);
}

function deactivateScience() {
  if (!state.key) return;
  state.key = "";
  globalThis.CrystalARRenderer?.setMeasurementMode(false);
  $("measureMode")?.setAttribute("aria-pressed", "false");
  $("showBonds").disabled = false;
  $("showPolyhedra").disabled = false;
}

function wireEvents() {
  document.querySelectorAll("[data-science-example]").forEach(button => button.addEventListener("click", () => loadScienceExample(button.dataset.scienceExample)));
  document.querySelectorAll("[data-example]").forEach(button => button.addEventListener("click", event => {
    const mapped = BASE_SCIENCE_MAP[button.dataset.example];
    if (mapped) {
      event.preventDefault();
      event.stopImmediatePropagation();
      loadScienceExample(mapped);
      return;
    }
    deactivateScience();
    requestAnimationFrame(() => { $("provVersion").textContent = VERSION; });
  }, { capture: true }));

  $("scienceFamily").addEventListener("change", event => {
    state.family = event.target.value;
    renderLesson(state.family);
    loadScienceExample(LESSON_FAMILIES[state.family].keys[0]);
  });
  $("lessonPrev").addEventListener("click", () => nextLesson(-1));
  $("lessonNext").addEventListener("click", () => nextLesson(1));
  ["representation", "supercell", "showCell", "showBonds", "showPolyhedra"].forEach(id => $(id).addEventListener("change", event => {
    if (!state.key) return;
    event.stopImmediatePropagation();
    rerender();
  }, true));

  $("mineralImage").addEventListener("error", () => {
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
  });

  $("measureMode").addEventListener("click", async () => {
    if (!state.key) {
      toast("Abra uma estrutura do roteiro científico antes de medir.", "info");
      return;
    }
    const renderer = await rendererReady();
    state.measure = !state.measure;
    $("measureMode").setAttribute("aria-pressed", String(state.measure));
    $("measureMode").classList.toggle("active", state.measure);
    $("measureMode").textContent = state.measure ? "Encerrar medição" : "Medir distância/ângulo";
    renderer.setMeasurementMode(state.measure, result => { $("measurementResult").textContent = result.text; });
    $("measurementResult").textContent = state.measure ? "Toque em dois átomos para distância; em três para ângulo." : "Medição encerrada.";
  });

  $("downloadCif").addEventListener("click", event => {
    if (!state.key) return;
    event.stopImmediatePropagation();
    const url = URL.createObjectURL(new Blob([state.text], { type: "chemical/x-cif;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = state.filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, true);

  $("openOfficialCif").addEventListener("click", event => {
    if (!state.key) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const example = SCIENCE_EXAMPLES[state.key];
    window.open(`https://www.crystallography.net/cod/${example.codId}.cif`, "_blank", "noopener,noreferrer");
  }, true);

  $("copyProvenance").addEventListener("click", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const image = state.key ? SCIENCE_EXAMPLES[state.key]?.mineralImage : null;
    const text = [
      `Estrutura/arquivo: ${$("structureName").textContent}`,
      `Tipo: ${$("provType").textContent}`,
      `COD ID: ${$("provCodId").textContent}`,
      `URI da fonte: ${$("provUri").textContent}`,
      `Data de incorporação/uso: ${$("provDate").textContent}`,
      `Versão do aplicativo: CrystalAR ${VERSION}`,
      `SHA-256 do texto CIF carregado: ${$("provHash").textContent}`,
      image ? `Imagem mineral: ${image.author}; ${image.license}; ${image.source}` : "",
      $("citationBox")?.textContent || ""
    ].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast("Proveniência 5.3.2 copiada.", "success");
    } catch {
      toast("Não foi possível copiar a proveniência.", "error");
    }
  }, true);

  $("codForm").addEventListener("submit", deactivateScience, true);
  $("cifFile").addEventListener("change", deactivateScience, true);
}

injectStyle();
injectInterface();
wireEvents();
renderLesson("carbon");
loadScienceExample("carbonDiamond");
