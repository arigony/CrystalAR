// CrystalAR — alternância estável entre câmera frontal e traseira.
// Replica o padrão validado no MolecuAR: intercepta getUserMedia antes do app.
(() => {
  const STORAGE_KEY = "crystalar_camera_facing";
  const originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
  if (!originalGetUserMedia) return;

  let facing = localStorage.getItem(STORAGE_KEY) || "user";
  if (!["user", "environment"].includes(facing)) facing = "user";

  function applyFacing(constraints) {
    const next = constraints && typeof constraints === "object" ? { ...constraints } : { audio: false, video: true };
    next.video = typeof next.video === "object" ? { ...next.video } : {};
    next.video.facingMode = { ideal: facing };
    next.video.width = next.video.width || { ideal: 960 };
    next.video.height = next.video.height || { ideal: 720 };
    next.video.frameRate = next.video.frameRate || { ideal: 24, max: 30 };
    return next;
  }

  navigator.mediaDevices.getUserMedia = async constraints => {
    try {
      return await originalGetUserMedia(applyFacing(constraints));
    } catch (error) {
      if (["NotFoundError", "OverconstrainedError"].includes(error?.name)) {
        return originalGetUserMedia({ audio: false, video: true });
      }
      throw error;
    }
  };

  function button() { return document.getElementById("cameraFlip"); }

  function applyVisualState() {
    document.body.classList.toggle("front-camera", facing === "user");
    document.body.classList.toggle("rear-camera", facing === "environment");
    const el = button();
    if (el) {
      el.textContent = facing === "environment" ? "Câmera: traseira" : "Câmera: frontal";
      el.setAttribute("aria-pressed", facing === "environment" ? "true" : "false");
    }
  }

  function toast(message) {
    const box = document.getElementById("toastBox");
    if (!box) return;
    const el = document.createElement("div");
    el.className = "toast info";
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function restartARIfActive() {
    const video = document.getElementById("cameraVideo");
    const gallery = document.getElementById("galleryMode");
    const ar = document.getElementById("arMode");
    const active = Boolean(video?.srcObject) || ar?.classList.contains("active");
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
    const el = button();
    if (el && !el.dataset.cameraToggleReady) {
      el.dataset.cameraToggleReady = "1";
      el.addEventListener("click", toggleCamera);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();

  window.CrystalARCameraToggle = {
    get facingMode() { return facing; },
    setFacingMode(value) {
      if (!["user", "environment"].includes(value)) return;
      facing = value;
      localStorage.setItem(STORAGE_KEY, facing);
      applyVisualState();
    }
  };
})();
