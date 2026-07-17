import { parseCIFDocument } from "./cif-parser.js";
import { buildCrystalModel } from "./crystal.js";
import { CrystalRenderer } from "./renderer.js";

const COD_BASE = "https://www.crystallography.net/cod";
const state = { text: "", filename: "", source: "", doc: null, model: null, stream: null, facing: "environment" };
const $ = id => document.getElementById(id);
const renderer = new CrystalRenderer($("scene"));

function showLoading(message = "Carregando…") {
  $("loadingText").textContent = message;
  $("loading").classList.remove("hidden");
}
function hideLoading() { $("loading").classList.add("hidden"); }
function setStatus(message, type = "") {
  const el = $("status");
  el.textContent = message;
  el.className = `status ${type}`.trim();
}
function toast(message, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`.trim();
  el.textContent = message;
  $("toastBox").appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
function item(label, value, wide = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `info-item${wide ? " wide" : ""}`;
  const span = document.createElement("span");
  span.textContent = label;
  const strong = document.createElement("strong");
  strong.textContent = value || "—";
  wrapper.append(span, strong);
  return wrapper;
}
function formatCell(cell) {
  return `a ${cell.a.toFixed(3)} · b ${cell.b.toFixed(3)} · c ${cell.c.toFixed(3)} Å`;
}
function formatAngles(cell) {
  return `α ${cell.alpha.toFixed(2)}° · β ${cell.beta.toFixed(2)}° · γ ${cell.gamma.toFixed(2)}°`;
}
function citationText(metadata) {
  const parts = [];
  if (metadata.authors) parts.push(metadata.authors);
  if (metadata.title) parts.push(metadata.title);
  const publication = [metadata.journal, metadata.year, metadata.volumeJournal, metadata.pages].filter(Boolean).join(", ");
  if (publication) parts.push(publication);
  if (metadata.doi) parts.push(`DOI: ${metadata.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`);
  return parts.join(". ");
}

function renderInfo(model, counts) {
  const { metadata, cell } = model;
  $("structureName").textContent = metadata.name || `COD ${metadata.codId}`;
  $("structureFormula").textContent = metadata.formula || "—";
  $("structureMeta").textContent = `${state.source} · ${counts.atomCount} átomos renderizados · ${counts.bondCount} ligações`;
  const grid = $("infoGrid");
  grid.replaceChildren(
    item("COD ID", metadata.codId || "arquivo local"),
    item("Grupo espacial", metadata.spaceGroup),
    item("Nº do grupo", metadata.spaceGroupNumber),
    item("Z", metadata.z),
    item("Parâmetros", formatCell(cell), true),
    item("Ângulos", formatAngles(cell), true),
    item("Volume", metadata.volume === "—" ? "—" : `${metadata.volume} Å³`),
    item("Densidade", metadata.density === "—" ? "—" : `${metadata.density} g cm⁻³`),
    item("Temperatura", metadata.temperature === "—" ? "—" : `${metadata.temperature} K`),
    item("Operações de simetria", String(model.symmetryOperations.length)),
    item("Sítios assimétricos", String(model.asymmetricAtoms.length)),
    item("Átomos na cela", String(model.unitAtoms.length))
  );
  const citation = citationText(metadata);
  const box = $("citationBox");
  if (citation) {
    box.textContent = `Citação da estrutura original: ${citation}`;
    box.classList.remove("hidden");
  } else {
    box.classList.add("hidden");
  }
}

function currentOptions() {
  return {
    representation: $("representation").value,
    showCell: $("showCell").checked,
    showBonds: $("showBonds").checked
  };
}

function processCIF(text, filename, source) {
  const doc = parseCIFDocument(text);
  const repeat = Number($("supercell").value);
  const model = buildCrystalModel(doc, repeat);
  const counts = renderer.renderModel(model, currentOptions());
  state.text = text;
  state.filename = filename;
  state.source = source;
  state.doc = doc;
  state.model = model;
  $("downloadCif").disabled = false;
  renderInfo(model, counts);
  setStatus(`Estrutura carregada: ${counts.atomCount} átomos e ${counts.bondCount} ligações na supercela ${repeat} × ${repeat} × ${repeat}.`, "success");
  toast("Estrutura cristalográfica carregada.", "success");
}

async function fetchCOD(codId) {
  if (!/^\d{7,8}$/.test(codId)) throw new Error("Digite um COD ID numérico com 7 ou 8 dígitos.");
  const url = `${COD_BASE}/${codId}.cif`;
  showLoading(`Buscando COD ${codId}…`);
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error(`COD respondeu HTTP ${response.status}.`);
    const text = await response.text();
    if (!/\bdata_/i.test(text) || !/_cell_length_a/i.test(text)) throw new Error("A resposta recebida não parece ser um arquivo CIF válido.");
    processCIF(text, `${codId}.cif`, `COD ${codId}`);
  } catch (error) {
    // O servidor COD pode variar quanto a CORS. Mantemos um exemplo CC0 local para
    // que o primeiro carregamento continue funcional, sem ocultar a origem do dado.
    if (codId === "9012293") {
      const fallback = await fetch("examples/diamond-9012293-demo.cif");
      if (fallback.ok) {
        const text = await fallback.text();
        processCIF(text, "diamond-9012293-demo.cif", "exemplo educacional local · COD 9012293");
        setStatus("Acesso direto ao COD indisponível nesta tentativa; foi carregado o exemplo educacional local do diamante.", "success");
        toast("Exemplo local carregado; tente novamente o COD mais tarde.");
        return;
      }
    }
    if (error instanceof TypeError) {
      throw new Error("O navegador não conseguiu acessar o COD diretamente. Use o upload após baixar o CIF, ou tente novamente mais tarde.");
    }
    throw error;
  } finally {
    hideLoading();
  }
}

async function handleFile(file) {
  if (!file) return;
  showLoading(`Abrindo ${file.name}…`);
  try {
    const text = await file.text();
    processCIF(text, file.name, `arquivo local: ${file.name}`);
  } finally {
    hideLoading();
  }
}

function rebuildFromState() {
  if (!state.doc) return;
  try {
    const repeat = Number($("supercell").value);
    const model = buildCrystalModel(state.doc, repeat);
    const counts = renderer.renderModel(model, currentOptions());
    state.model = model;
    renderInfo(model, counts);
    setStatus(`Visualização atualizada: ${counts.atomCount} átomos na supercela ${repeat} × ${repeat} × ${repeat}.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
    toast(error.message, "error");
  }
}

async function startAR() {
  if (!window.isSecureContext) throw new Error("O modo AR requer HTTPS.");
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Este navegador não oferece acesso à câmera.");
  stopCamera();
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: state.facing }, width: { ideal: 1280 }, height: { ideal: 720 } }
  });
  $("cameraVideo").srcObject = state.stream;
  await $("cameraVideo").play();
  document.body.classList.add("ar-active");
  document.body.classList.toggle("front-camera", state.facing === "user");
  renderer.setAR(true);
  $("galleryMode").classList.remove("active");
  $("arMode").classList.add("active");
  $("cameraFlip").disabled = false;
}

function stopCamera() {
  if (state.stream) state.stream.getTracks().forEach(track => track.stop());
  state.stream = null;
  $("cameraVideo").srcObject = null;
}

function stopAR() {
  stopCamera();
  document.body.classList.remove("ar-active", "front-camera");
  renderer.setAR(false);
  $("galleryMode").classList.add("active");
  $("arMode").classList.remove("active");
  $("cameraFlip").disabled = true;
}

$("codForm").addEventListener("submit", async event => {
  event.preventDefault();
  const id = $("codId").value.trim();
  try { await fetchCOD(id); }
  catch (error) { hideLoading(); setStatus(error.message, "error"); toast(error.message, "error"); }
});

document.querySelectorAll("[data-cod]").forEach(button => button.addEventListener("click", async () => {
  $("codId").value = button.dataset.cod;
  try { await fetchCOD(button.dataset.cod); }
  catch (error) { hideLoading(); setStatus(error.message, "error"); toast(error.message, "error"); }
}));

$("cifFile").addEventListener("change", event => handleFile(event.target.files?.[0]).catch(error => {
  hideLoading(); setStatus(error.message, "error"); toast(error.message, "error");
}));

$("representation").addEventListener("change", rebuildFromState);
$("supercell").addEventListener("change", rebuildFromState);
$("showCell").addEventListener("change", rebuildFromState);
$("showBonds").addEventListener("change", rebuildFromState);
$("resetView").addEventListener("click", () => renderer.resetView());
$("downloadCif").addEventListener("click", () => {
  if (!state.text) return;
  const blob = new Blob([state.text], { type: "chemical/x-cif;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = state.filename || "structure.cif";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$("collapseControls").addEventListener("click", () => {
  const panel = document.querySelector(".control-panel");
  const collapsed = panel.classList.toggle("collapsed");
  $("collapseControls").textContent = collapsed ? "+" : "−";
});

$("infoToggle").addEventListener("click", () => {
  const card = $("infoCard");
  const expanded = card.classList.toggle("expanded");
  card.classList.toggle("collapsed", !expanded);
  $("infoToggle").setAttribute("aria-expanded", expanded ? "true" : "false");
});

$("arMode").addEventListener("click", () => startAR().catch(error => { setStatus(error.message, "error"); toast(error.message, "error"); stopAR(); }));
$("galleryMode").addEventListener("click", stopAR);
$("cameraFlip").addEventListener("click", async () => {
  state.facing = state.facing === "environment" ? "user" : "environment";
  $("cameraFlip").textContent = state.facing === "environment" ? "Câmera: traseira" : "Câmera: frontal";
  try { await startAR(); } catch (error) { setStatus(error.message, "error"); toast(error.message, "error"); }
});

addEventListener("beforeunload", stopCamera);

// Carrega o exemplo inicial. Se o servidor COD bloquear CORS, a interface orienta o upload local.
fetchCOD("9012293").catch(error => {
  hideLoading();
  setStatus(error.message, "error");
  toast("Busca direta indisponível; o upload de CIF continua funcional.", "error");
});
