import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { parseCIFDocument } from "./cif-parser.js";
import { buildCrystalModel } from "./crystal.js";
import { CrystalRenderer } from "./renderer.js";
import { fetchCIFById } from "./cod-client.js";
import { computeHandPose, clamp } from "./ar-logic.js";

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || innerWidth < 780;
const DEBUG_HAND = new URLSearchParams(location.search).has("debug");
const DETECT_INTERVAL_MS = IS_MOBILE ? 120 : 90;
const $ = id => document.getElementById(id);

const EDUCATIONAL_EXAMPLES = {
  diamond: {
    label: "Diamante",
    path: "examples/diamond-9012293.cif",
    codId: "9012293",
    provenance: "Derivado da determinação experimental COD 9012293",
    teachingNote: "Rede covalente tridimensional. Cada carbono apresenta coordenação tetraédrica 4.",
    representation: "ball-stick", showBonds: true, supercell: 2
  },
  graphite: {
    label: "Grafite 2H",
    path: "examples/graphite-1200017.cif",
    codId: "1200017",
    provenance: "Derivado da determinação experimental COD 1200017",
    teachingNote: "Camadas hexagonais com empilhamento AB. Os cilindros representam as ligações C–C dentro das folhas; não representam forças entre as camadas.",
    representation: "ball-stick", showBonds: true, supercell: 2
  },
  graphene: {
    label: "Grafeno",
    path: "examples/graphene-model.cif",
    codId: "",
    provenance: "Modelo 2D educacional baseado em parâmetros experimentais",
    teachingNote: "Monocamada periódica. O parâmetro c = 20 Å é um espaço de vácuo artificial, não uma dimensão experimental do grafeno.",
    representation: "ball-stick", showBonds: true, supercell: 3
  },
  sulfurAlpha: {
    label: "Enxofre α-S₈",
    path: "examples/sulfur-alpha-9011362.cif",
    codId: "9011362",
    provenance: "Determinação experimental COD 9011362",
    teachingNote: "Polimorfo ortorrômbico do S₈, estável em condições ambientes. A unidade molecular é um anel coroado de oito átomos de enxofre.",
    representation: "ball-stick", showBonds: true, supercell: 1
  },
  sulfurBeta: {
    label: "Enxofre β-S₈",
    path: "examples/sulfur-beta-4124791.cif",
    codId: "4124791",
    provenance: "Determinação experimental COD 4124791",
    teachingNote: "Polimorfo monoclínico do S₈. Possui a mesma molécula cíclica do α-S₈, mas outro empacotamento cristalino.",
    representation: "ball-stick", showBonds: true, supercell: 1
  },
  sulfurGamma: {
    label: "Enxofre γ-S₈",
    path: "examples/sulfur-gamma-2002079.cif",
    codId: "2002079",
    provenance: "Determinação experimental COD 2002079",
    teachingNote: "Outro polimorfo monoclínico do S₈. Compare a forma da cela e o empacotamento com α-S₈ e β-S₈.",
    representation: "ball-stick", showBonds: true, supercell: 1
  },
  sulfurS6: {
    label: "Ciclo-S₆",
    path: "examples/sulfur-s6-9012361.cif",
    codId: "9012361",
    provenance: "Determinação experimental COD 9012361",
    teachingNote: "Alótropo molecular constituído por anéis S₆. Aqui muda a identidade molecular, não apenas o empacotamento do S₈.",
    representation: "ball-stick", showBonds: true, supercell: 2
  },
  iodine: {
    label: "Iodo sólido — I₂",
    path: "examples/iodine-9008595.cif",
    codId: "9008595",
    provenance: "Determinação experimental COD 9008595",
    teachingNote: "Cristal molecular formado por moléculas discretas I₂. A ligação intramolecular I–I é distinta das interações intermoleculares no sólido.",
    representation: "ball-stick", showBonds: true, supercell: 2
  },
  mof5: {
    label: "MOF-5 — IRMOF-1",
    path: "examples/mof5-1516287.cif",
    codId: "1516287",
    provenance: "Determinação experimental COD 1516287",
    teachingNote: "Rede metal-orgânica cúbica formada por unidades Zn₄O conectadas por ligantes tereftalato (BDC). Observe os grandes vazios periódicos.",
    representation: "wire", showBonds: true, supercell: 1
  },
  zif8: {
    label: "ZIF-8",
    path: "examples/zif8-7111973.cif",
    codId: "7111973",
    provenance: "Determinação experimental COD 7111973",
    teachingNote: "Rede de Zn tetraédrico e 2-metilimidazolato, com topologia do tipo sodalita. É um exemplo de MOF com conectividade semelhante à de zeólitas.",
    representation: "wire", showBonds: true, supercell: 1
  },
  nacl: {
    label: "NaCl — sal-gema",
    path: "examples/nacl-1000041.cif",
    codId: "1000041",
    provenance: "Derivado da determinação experimental COD 1000041",
    teachingNote: "Estrutura tipo sal-gema, coordenação 6:6. O modo space-filling evita sugerir ligações covalentes localizadas.",
    representation: "space-fill", showBonds: false, supercell: 2
  },
  cscl: {
    label: "CsCl",
    path: "examples/cscl-9008789.cif",
    codId: "9008789",
    provenance: "Derivado da determinação experimental COD 9008789",
    teachingNote: "Estrutura tipo CsCl, coordenação 8:8. A cela primitiva contém um Cs e um Cl.",
    representation: "space-fill", showBonds: false, supercell: 3
  },
  mgo: {
    label: "MgO — periclásio",
    path: "examples/mgo-1011173.cif",
    codId: "1011173",
    provenance: "Derivado da determinação experimental COD 1011173",
    teachingNote: "Óxido iônico com estrutura tipo sal-gema e coordenação 6:6.",
    representation: "space-fill", showBonds: false, supercell: 2
  },
  caf2: {
    label: "CaF₂ — fluorita",
    path: "examples/caf2-1000043.cif",
    codId: "1000043",
    provenance: "Derivado da determinação experimental COD 1000043",
    teachingNote: "Estrutura fluorita: cada Ca²⁺ é coordenado por oito F⁻; cada F⁻ possui coordenação tetraédrica por quatro Ca²⁺.",
    representation: "space-fill", showBonds: false, supercell: 2
  },
  znsSphalerite: {
    label: "ZnS — blenda",
    path: "examples/zns-sphalerite-9000107.cif",
    codId: "9000107",
    provenance: "Derivado da determinação experimental COD 9000107",
    teachingNote: "Polimorfo cúbico do ZnS. Zn e S apresentam coordenação tetraédrica 4:4.",
    representation: "ball-stick", showBonds: true, supercell: 2
  },
  znsWurtzite: {
    label: "ZnS — wurtzita 2H",
    path: "examples/zns-wurtzite-1100044.cif",
    codId: "1100044",
    provenance: "Derivado da determinação experimental COD 1100044",
    teachingNote: "Polimorfo hexagonal do ZnS. Mantém coordenação tetraédrica 4:4, mas altera a sequência de empilhamento.",
    representation: "ball-stick", showBonds: true, supercell: 2
  }
};

const state = {
  text: "", filename: "", source: "", doc: null, model: null,
  displayName: "", provenance: "", teachingNote: "", experimentalCod: "", exampleKey: "",
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
  const displayedCod = state.experimentalCod || (metadata.codId && /^\d{7,8}$/.test(metadata.codId) ? metadata.codId : "não se aplica");
  $("structureName").textContent = state.displayName || metadata.name || `COD ${metadata.codId}`;
  $("structureFormula").textContent = metadata.formula || "—";
  $("structureMeta").textContent = `${state.source} · ${counts.atomCount} átomos renderizados · ${counts.bondCount} ligações`;
  $("infoGrid").replaceChildren(
    item("Classificação", state.provenance || "Arquivo CIF", true),
    item("COD ID", displayedCod),
    item("Grupo espacial", metadata.spaceGroup),
    item("Nº do grupo", metadata.spaceGroupNumber),
    item("Z", metadata.z),
    item("Parâmetros", formatCell(cell), true),
    item("Ângulos", formatAngles(cell), true),
    item("Volume", metadata.volume === "—" ? "—" : `${metadata.volume} Å³`),
    item("Densidade", metadata.density === "—" ? "—" : `${metadata.density} g cm⁻³`),
    item("Temperatura", metadata.temperature === "—" ? "—" : `${metadata.temperature} K`),
    item("Sítios no arquivo", String(model.asymmetricAtoms.length)),
    item("Átomos na cela", String(model.unitAtoms.length))
  );
  const citation = citationText(metadata);
  const box = $("citationBox");
  const parts = [];
  if (state.teachingNote) parts.push(`Nota didática: ${state.teachingNote}`);
  if (citation) parts.push(`Referência estrutural: ${citation}`);
  if (parts.length) {
    box.textContent = parts.join(" ");
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

function processCIF(text, filename, context = {}) {
  const doc = parseCIFDocument(text);
  const repeat = Number($("supercell").value);
  const model = buildCrystalModel(doc, repeat);
  const counts = renderer.renderModel(model, currentOptions());
  state.text = text;
  state.filename = filename;
  state.source = context.source || "arquivo CIF";
  state.displayName = context.displayName || "";
  state.provenance = context.provenance || "Arquivo CIF";
  state.teachingNote = context.teachingNote || "";
  state.experimentalCod = context.experimentalCod || "";
  state.exampleKey = context.exampleKey || "";
  state.doc = doc;
  state.model = model;
  $("downloadCif").disabled = false;
  renderInfo(model, counts);
  setStatus(`Estrutura carregada: ${counts.atomCount} átomos e ${counts.bondCount} ligações na supercela ${repeat} × ${repeat} × ${repeat}. Fonte: ${state.source}.`, "success");
  toast(`${state.displayName || model.metadata.name} carregado.`, "success");
}

function setActiveExample(key = "") {
  document.querySelectorAll("[data-example]").forEach(button => {
    const active = button.dataset.example === key;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

async function loadLocalExample(key) {
  const example = EDUCATIONAL_EXAMPLES[key];
  if (!example) return;
  showLoading(`Abrindo ${example.label}…`);
  setStatus(`Carregando o exemplo local ${example.label}…`, "pending");
  setActiveExample(key);
  $("representation").value = example.representation;
  $("showBonds").checked = example.showBonds;
  $("showCell").checked = true;
  $("supercell").value = String(example.supercell);
  if (example.codId) $("codId").value = example.codId;
  try {
    const response = await fetch(example.path, { cache: "no-store" });
    if (!response.ok) throw new Error(`Arquivo local respondeu HTTP ${response.status}.`);
    const text = await response.text();
    processCIF(text, example.path.split("/").pop(), {
      source: example.codId ? `galeria local · COD ${example.codId}` : "galeria local · modelo 2D",
      displayName: example.label,
      provenance: example.provenance,
      teachingNote: example.teachingNote,
      experimentalCod: example.codId,
      exampleKey: key
    });
  } catch (error) {
    setActiveExample("");
    setStatus(`Não foi possível abrir ${example.label}. ${error.message}`, "error");
    toast(`Falha ao abrir ${example.label}.`, "error");
    console.error(error);
  } finally { hideLoading(); }
}

async function loadCOD(codId) {
  const id = String(codId || "").trim();
  showLoading(`Buscando COD ${id}…`);
  $("searchButton").disabled = true;
  setActiveExample("");
  setStatus(`Consultando COD ${id}…`, "pending");
  try {
    const result = await fetchCIFById(id);
    processCIF(result.text, `${id}.cif`, {
      source: `${result.source} · COD ${id}`,
      provenance: "CIF solicitado por COD ID",
      experimentalCod: id
    });
  } catch (error) {
    const previous = state.displayName || state.model?.metadata?.codId || state.filename || "nenhuma";
    setStatus(`Falha ao carregar COD ${id}. A visualização anterior (${previous}) foi mantida. ${error.message}`, "error");
    $("structureMeta").textContent = `BUSCA COD ${id} FALHOU — exibindo a estrutura anterior`;
    toast(`COD ${id} não foi carregado. Use a galeria local ou abra um CIF.`, "error");
    console.error(error);
  } finally {
    hideLoading();
    $("searchButton").disabled = false;
  }
}

async function handleFile(file) {
  if (!file) return;
  showLoading(`Abrindo ${file.name}…`);
  setActiveExample("");
  try {
    processCIF(await file.text(), file.name, {
      source: `arquivo local: ${file.name}`,
      provenance: "Arquivo CIF fornecido pelo usuário"
    });
  } finally { hideLoading(); }
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
      runningMode: "VIDEO", numHands: 1,
      minHandDetectionConfidence: .2, minHandPresenceConfidence: .2, minTrackingConfidence: .2
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

$("codForm").addEventListener("submit", event => {
  event.preventDefault();
  loadCOD($("codId").value);
});
document.querySelectorAll("[data-example]").forEach(button => {
  button.addEventListener("click", () => loadLocalExample(button.dataset.example));
});
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

loadLocalExample("diamond");
