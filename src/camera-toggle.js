// CrystalAR — alternância estável entre câmera frontal e traseira.
// Adaptado da estratégia já validada no MolecuAR: intercepta getUserMedia
// antes de app.js solicitar a câmera e reinicia o modo AR após a troca.
(() => {
  const STORAGE_KEY = "crystalar_camera_facing";
  const originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);

  if (!originalGetUserMedia) {
    console.warn("[CrystalAR camera-toggle] getUserMedia indisponível.");
    return;
  }

  let facing = localStorage.getItem(STORAGE_KEY) || "environment";
  if (!["user", "environment"].includes(facing)) facing = "environment";

  function cloneConstraints(constraints) {
    if (!constraints || typeof constraints !== "object") return constraints;
    return {
      ...constraints,
      video: typeof constraints.video === "object" ? { ...constraints.video } : constraints.video
    };
  }

  function applyFacingToConstraints(constraints) {
    const next = cloneConstraints(constraints || { video: true, audio: false });
    if (!next.video) return next;
    if (typeof next.video !== "object") next.video = {};

    next.video.facingMode = { ideal: facing };
    next.video.width = next.video.width || { ideal: 1280 };
    next.video.height = next.video.height || { ideal: 720 };
    next.video.frameRate = next.video.frameRate || { ideal: 24, max: 30 };
    return next;
  }

  navigator.mediaDevices.getUserMedia = async function patchedGetUserMedia(constraints) {
    try {
      return await originalGetUserMedia(applyFacingToConstraints(constraints));
    } catch (error) {
      // Alguns navegadores antigos não aceitam facingMode/constraints avançadas.
      if (["NotFoundError", "OverconstrainedError"].includes(error?.name)) {
        return originalGetUserMedia({ audio: false, video: true });
      }
      throw error;
    }
  };

  function getButton() {
    return document.getElementById("cameraFlip");
  }

  function applyVisualState() {
    document.body.classList.toggle("front-camera", facing === "user");
    document.body.classList.toggle("rear-camera", facing === "environment");

    const button = getButton();
    if (button) {
      const rear = facing === "environment";
      button.textContent = rear ? "Câmera: traseira" : "Câmera: frontal";
      button.classList.toggle("active", rear);
      button.setAttribute("aria-pressed", rear ? "true" : "false");
      button.disabled = false;
    }
  }

  function toast(message) {
    const box = document.getElementById("toastBox");
    if (!box) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function restartARIfActive() {
    const video = document.getElementById("cameraVideo");
    const gallery = document.getElementById("galleryMode");
    const ar = document.getElementById("arMode");
    const active = Boolean(video?.srcObject) || video?.classList.contains("ar-visible") || ar?.classList.contains("active");

    if (!active || !gallery || !ar) return;
    gallery.click();
    setTimeout(() => ar.click(), 650);
  }

  function toggleCamera() {
    facing = facing === "user" ? "environment" : "user";
    localStorage.setItem(STORAGE_KEY, facing);
    applyVisualState();
    toast(facing === "environment" ? "Câmera traseira selecionada." : "Câmera frontal selecionada.");
    restartARIfActive();
  }

  function setup() {
    applyVisualState();
    const button = getButton();
    if (button && !button.dataset.cameraToggleReady) {
      button.dataset.cameraToggleReady = "1";
      button.addEventListener("click", toggleCamera);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }

  window.CrystalARCameraToggle = {
    version: "molecuar-pattern-1",
    get facingMode() { return facing; },
    setFacingMode(value) {
      if (!["user", "environment"].includes(value)) return;
      facing = value;
      localStorage.setItem(STORAGE_KEY, facing);
      applyVisualState();
    }
  };
})();
