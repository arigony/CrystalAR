import { parseCIFDocument } from "./cif-parser.js";
import { buildCrystalModel } from "./crystal.js";
import { CrystalRenderer } from "./renderer.js";

const COD_BASE = "https://www.crystallography.net/cod";
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 780;
const state = { text: "", filename: "", source: "", doc: null, model: null, stream: null };
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
    const response = await fetch(url);
    if (!response.ok) throw new Error(`COD respondeu HTTP ${response.status}.`);
    const text = await response.text();
    if (!/\bdata_/i.test(text) || !/_cell_length_a/i.test(text)) throw new Error("A resposta recebida não parece ser um arquivo CIF válido.");
    const route = response.headers.get("X-CrystalAR-Route") || "COD";
    processCIF(text, `${codId}.cif`, `${route} · COD ${codId}`);
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

function cameraErrorMessage(error) {
  if (["NotAllowedError", "SecurityError"].includes(error?.name)) {
    return "A câmera foi bloqueada. Autorize a câmera nas permissões do navegador e toque em AR novamente.";
  }
  if (["NotFoundError", "OverconstrainedError"].includes(error?.name)) {
    return "Nenhuma câmera compatível foi encontrada neste dispositivo.";
  }
  if (["NotReadableError", "AbortError"].includes(error?.name)) {
    return "A câmera está ocupada por outro aplicativo ou não pôde ser iniciada.";
  }
  return error?.message || "Não foi possível iniciar a câmera.";
}

async function startCamera() {
  if (!window.isSecureContext) throw new Error("Abra esta página em HTTPS. No GitHub Pages isso já ocorre automaticamente.");
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Este navegador não oferece suporte à câmera.");

  stopCamera();
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "environment",
      width: { ideal: IS_MOBILE ? 640 : 1280 },
      height: { ideal: IS_MOBILE ? 480 : 720 },
      frameRate: { ideal: IS_MOBILE ? 24 : 30, max: 30 }
    }
  });

  const video = $("cameraVideo");
  video.srcObject = state.stream;
  await new Promise((resolve, reject) => {
    let done = false;
    const finish = async () => {
      if (done) return;
      done = true;
      try {
        await video.play();
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    video.onloadedmetadata = finish;
    setTimeout(finish, 700);
  });
}

async function startAR() {
  if (document.body.classList.contains("ar-active")) return;
  showLoading("Iniciando câmera…");
  try {
    await startCamera();
    const video = $("cameraVideo");
    video.classList.add("ar-visible");
    document.body.classList.add("ar-active");
    renderer.setAR(true);
    $("galleryMode").classList.remove("active");
    $("arMode").classList.add("active");
    setStatus("AR ativo. Arraste para girar e use o gesto de pinça para ampliar.", "success");
    hideLoading();
    toast("Câmera ativada. CrystalAR em modo AR.", "success");
  } catch (error) {
    hideLoading();
    stopAR();
    throw new Error(cameraErrorMessage(error));
  }
}

function stopCamera() {
  if (state.stream) state.stream.getTracks().forEach(track => track.stop());
  state.stream = null;
  const video = $("cameraVideo");
  video.srcObject = null;
  video.onloadedmetadata = null;
}

function stopAR() {
  stopCamera();
  $("cameraVideo").classList.remove("ar-visible");
  document.body.classList.remove("ar-active");
  renderer.setAR(false);
  $("galleryMode").classList.add("active");
  $("arMode").classList.remove("active");
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

$("arMode").addEventListener("click", () => startAR().catch(error => {
  setStatus(error.message, "error");
  toast(error.message, "error");
}));
$("galleryMode").addEventListener("click", stopAR);

addEventListener("beforeunload", stopCamera);
addEventListener("pagehide", stopCamera);

fetchCOD("9012293").catch(error => {
  hideLoading();
  setStatus(error.message, "error");
  toast("Busca inicial indisponível; o upload de CIF continua funcional.", "error");
});
