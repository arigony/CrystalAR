import * as THREE from "three";
import { parseCIFDocument } from "./cif-parser.js";
import { buildCrystalModel } from "./crystal.js";
import { CrystalRenderer } from "./renderer.js";
import { fetchCIFById } from "./cod-client.js";
import { computeHandPose, clamp } from "./ar-logic.js";

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || innerWidth < 780;
const DEBUG_HAND = new URLSearchParams(location.search).has("debug");
const DETECT_INTERVAL_MS = IS_MOBILE ? 120 : 90;
const $ = id => document.getElementById(id);

const state = {
  text: "", filename: "", source: "", doc: null, model: null,
  stream: null, arActive: false, tracker: null, trackerPromise: null,
  detectTimer: null, handDetected: false, handSeenAt: 0,
  pinchScaleFactor: 1, lastPinchDistance: null,
  touchRotationX: 0, touchRotationY: 0, touchScaleFactor: 1,
  pointerActive: false, pointerX: 0, pointerY: 0
};

const renderer = new CrystalRenderer($("scene"));
const video = $("cameraVideo");
const handCanvas = $("handOverlay");
const handCtx = handCanvas?.getContext("2d");
if (DEBUG_HAND) handCanvas?.classList.add("visible");

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
function toast(message, type = "info") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  $("toastBox").appendChild(el);
  setTimeout(() => el.remove(), 4600);
}
function setHandStatus(text, ok = false) {
  const el = $("handStatus");
  el.textContent = text;
  el.classList.remove("hidden");
  el.classList.toggle("detected", ok);
}
function hideHandStatus() { $("handStatus").classList.add("hidden"); }

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
function formatCell(cell) { return `a ${cell.a.toFixed(3)} · b ${cell.b.toFixed(3)} · c ${cell.c.toFixed(3)} Å`; }
function formatAngles(cell) { return `α ${cell.alpha.toFixed(2)}° · β ${cell.beta.toFixed(2)}° · γ ${cell.gamma.toFixed(2)}°`; }
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
  $("infoGrid").replaceChildren(
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
  } else box.classList.add("hidden");
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
  setStatus(`Estrutura carregada: ${counts.atomCount} átomos e ${counts.bondCount} ligações na supercela ${repeat} × ${repeat} × ${repeat}. Fonte: ${source}.`, "success");
  toast("Estrutura cristalográfica carregada.", "success");
}

async function loadCOD(codId) {
  const id = String(codId || "").trim();
  showLoading(`Buscando COD ${id}…`);
  $("searchButton").disabled = true;
  setStatus(`Consultando COD ${id}…`, "pending");
  try {
    const result = await fetchCIFById(id);
    processCIF(result.text, `${id}.cif`, `${result.source} · COD ${id}`);
  } catch (error) {
    const previous = state.model?.metadata?.codId || state.filename || "nenhuma";
    setStatus(`Falha ao carregar COD ${id}. A visualização anterior (${previous}) foi mantida. ${error.message}`, "error");
    $("structureMeta").textContent = `BUSCA COD ${id} FALHOU — exibindo a estrutura anterior`;
    toast(`COD ${id} não foi carregado. Veja a mensagem no painel.`, "error");
    console.error(error);
  } finally {
    hideLoading();
    $("searchButton").disabled = false;
  }
}

async function handleFile(file) {
  if (!file) return;
  showLoading(`Abrindo ${file.name}…`);
  try {
    processCIF(await file.text(), file.name, `arquivo local: ${file.name}`);
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
  if (["NotAllowedError", "SecurityError"].includes(error?.name)) return "A câmera foi bloqueada. Autorize a câmera nas permissões do navegador e toque em AR novamente.";
  if (["NotFoundError", "OverconstrainedError"].includes(error?.name)) return "Nenhuma câmera compatível foi encontrada neste dispositivo.";
  if (["NotReadableError", "AbortError"].includes(error?.name)) return "A câmera está ocupada por outro aplicativo ou não pôde ser iniciada.";
  return error?.message || "Não foi possível iniciar a câmera.";
}

async function startCamera() {
  if (!window.isSecureContext) throw new Error("Abra esta página em HTTPS.");
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Este navegador não oferece suporte à câmera.");
  stopCamera();
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: { ideal: IS_MOBILE ? 640 : 960 },
      height: { ideal: IS_MOBILE ? 480 : 720 },
      frameRate: { ideal: IS_MOBILE ? 24 : 30, max: 30 }
    }
  });
  video.srcObject = state.stream;
  await new Promise((resolve, reject) => {
    let done = false;
    const finish = async () => {
      if (done) return;
      done = true;
      try { await video.play(); resolve(); } catch (error) { reject(error); }
    };
    video.onloadedmetadata = finish;
    setTimeout(finish, 700);
  });
}

async function buildTracker() {
  if (state.tracker) return state.tracker;
  if (state.trackerPromise) return state.trackerPromise;
  state.trackerPromise = (async () => {
    const { HandLandmarker, FilesetResolver } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/vision_bundle.mjs");
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm");
    state.tracker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "CPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: .2,
      minHandPresenceConfidence: .2,
      minTrackingConfidence: .2
    });
    return state.tracker;
  })();
  try { return await state.trackerPromise; }
  finally { state.trackerPromise = null; }
}

function drawHandDebug(hand) {
  if (!handCtx || !DEBUG_HAND) return;
  const w = innerWidth;
  const h = innerHeight;
  handCanvas.width = Math.floor(w * Math.min(devicePixelRatio || 1, 1.5));
  handCanvas.height = Math.floor(h * Math.min(devicePixelRatio || 1, 1.5));
  handCanvas.style.width = `${w}px`;
  handCanvas.style.height = `${h}px`;
  const dpr = handCanvas.width / w;
  handCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  handCtx.clearRect(0, 0, w, h);
  const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  handCtx.lineWidth = 2;
  handCtx.strokeStyle = "rgba(30,190,120,.9)";
  for (const [a,b] of connections) {
    const pa = hand[a], pb = hand[b];
    handCtx.beginPath();
    handCtx.moveTo((1 - pa.x) * w, pa.y * h);
    handCtx.lineTo((1 - pb.x) * w, pb.y * h);
    handCtx.stroke();
  }
}
function clearHandDebug() { handCtx?.clearRect(0, 0, handCanvas.width, handCanvas.height); }

function applyHandPose(hand) {
  const result = computeHandPose(hand, {
    isMobile: IS_MOBILE,
    baseScale: renderer.getARBaseScale(),
    pinchScaleFactor: state.pinchScaleFactor,
    lastPinchDistance: state.lastPinchDistance
  });
  state.pinchScaleFactor = result.pinchScaleFactor;
  state.lastPinchDistance = result.lastPinchDistance;
  state.handSeenAt = performance.now();
  state.handDetected = true;
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(result.angleX, result.angleY, result.angleZ));
  renderer.setARTarget({ position: [0, .08, 0], quaternion, scale: result.scale });
  setHandStatus(result.isPinching ? "Mão detectada — pinça controla o zoom" : "Mão detectada — gire e incline", true);
}

function detectStep() {
  if (!state.arActive || !state.tracker || video.readyState < 2) return;
  try {
    const result = state.tracker.detectForVideo(video, performance.now());
    if (result?.landmarks?.length) {
      applyHandPose(result.landmarks[0]);
      drawHandDebug(result.landmarks[0]);
    } else {
      state.handDetected = false;
      if (performance.now() - state.handSeenAt > 900) setHandStatus("Mostre a mão aberta ou use arraste/pinça", false);
      clearHandDebug();
    }
  } catch (error) {
    setHandStatus("Rastreamento temporariamente indisponível; use toque ou mouse", false);
    console.warn(error);
  }
}

async function startAR() {
  if (state.arActive) return;
  if (!state.model) {
    toast("Carregue uma estrutura antes de iniciar o AR.", "error");
    return;
  }
  showLoading("Iniciando câmera…");
  try {
    await startCamera();
    state.arActive = true;
    state.pinchScaleFactor = 1;
    state.lastPinchDistance = null;
    state.touchScaleFactor = 1;
    video.classList.add("ar-visible");
    document.body.classList.add("ar-active");
    renderer.setAR(true);
    $("galleryMode").classList.remove("active");
    $("arMode").classList.add("active");
    hideLoading();
    setStatus("AR ativo. Arraste para girar; pinça/roda para zoom. Carregando rastreamento de mãos…", "success");
    setHandStatus("AR por toque ativo — carregando HandLandmarker…", false);

    buildTracker().then(() => {
      if (!state.arActive) return;
      clearInterval(state.detectTimer);
      state.detectTimer = setInterval(detectStep, DETECT_INTERVAL_MS);
      setHandStatus("Mostre a mão aberta ou use arraste/pinça", false);
      toast("Rastreamento de mãos ativo.", "success");
    }).catch(error => {
      console.error(error);
      if (state.arActive) {
        setHandStatus("HandLandmarker indisponível; AR por toque e mouse continua ativo", false);
        toast("Rastreamento de mãos indisponível; use toque ou mouse.", "info");
      }
    });
  } catch (error) {
    hideLoading();
    stopAR();
    const message = cameraErrorMessage(error);
    setStatus(message, "error");
    toast(message, "error");
  }
}

function stopCamera() {
  if (state.stream) state.stream.getTracks().forEach(track => track.stop());
  state.stream = null;
  video.srcObject = null;
  video.onloadedmetadata = null;
}

function stopAR() {
  clearInterval(state.detectTimer);
  state.detectTimer = null;
  state.handDetected = false;
  stopCamera();
  video.classList.remove("ar-visible");
  document.body.classList.remove("ar-active");
  renderer.setAR(false);
  state.arActive = false;
  $("galleryMode").classList.add("active");
  $("arMode").classList.remove("active");
  hideHandStatus();
  clearHandDebug();
}

function applyManualPose() {
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(state.touchRotationX, state.touchRotationY, 0));
  const base = renderer.getARBaseScale();
  const scale = clamp(base * state.touchScaleFactor, base * .55, base * 1.8);
  renderer.setARTarget({ position: [0, .08, 0], quaternion, scale });
}

const canvas = $("scene");
canvas.addEventListener("pointerdown", event => {
  if (!state.arActive) return;
  state.pointerActive = true;
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (!state.arActive || !state.pointerActive) return;
  state.touchRotationY += (event.clientX - state.pointerX) * .008;
  state.touchRotationX = clamp(state.touchRotationX + (event.clientY - state.pointerY) * .008, -Math.PI / 2, Math.PI / 2);
  state.pointerX = event.clientX;
  state.pointerY = event.clientY;
  if (!state.handDetected || performance.now() - state.handSeenAt > 700) applyManualPose();
});
canvas.addEventListener("pointerup", event => {
  state.pointerActive = false;
  canvas.releasePointerCapture?.(event.pointerId);
});
canvas.addEventListener("pointercancel", () => { state.pointerActive = false; });
canvas.addEventListener("wheel", event => {
  if (!state.arActive) return;
  event.preventDefault();
  state.touchScaleFactor = clamp(state.touchScaleFactor - event.deltaY * .0012, .55, 1.8);
  if (!state.handDetected || performance.now() - state.handSeenAt > 700) applyManualPose();
}, { passive: false });

let touchStartDistance = 0;
function touchDistance(touches) { return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY); }
canvas.addEventListener("touchstart", event => {
  if (!state.arActive) return;
  if (event.touches.length === 2) touchStartDistance = touchDistance(event.touches);
}, { passive: true });
canvas.addEventListener("touchmove", event => {
  if (!state.arActive || event.touches.length !== 2) return;
  event.preventDefault();
  const distance = touchDistance(event.touches);
  state.touchScaleFactor = clamp(state.touchScaleFactor + (distance - touchStartDistance) * .0035, .55, 1.8);
  touchStartDistance = distance;
  if (!state.handDetected || performance.now() - state.handSeenAt > 700) applyManualPose();
}, { passive: false });

$("codForm").addEventListener("submit", event => { event.preventDefault(); loadCOD($("codId").value); });
document.querySelectorAll("[data-cod]").forEach(button => button.addEventListener("click", () => {
  $("codId").value = button.dataset.cod;
  loadCOD(button.dataset.cod);
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
$("arMode").addEventListener("click", startAR);
$("galleryMode").addEventListener("click", stopAR);
addEventListener("beforeunload", stopCamera);
addEventListener("pagehide", stopCamera);

loadCOD("9012293");
