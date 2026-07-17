const nativeFetch = window.fetch.bind(window);

const LOCAL_CIF = {
  "9012293": "examples/diamond-9012293-demo.cif",
  "5910030": "examples/bao-5910030-demo.cif",
  "5910063": "examples/cofe2o4-5910063-demo.cif"
};

function extractCodId(url) {
  const match = String(url || "").match(/crystallography\.net\/cod\/(\d{7,8})\.cif(?:[?#].*)?$/i);
  return match?.[1] || "";
}

function looksLikeCIF(text) {
  return /(^|\n)\s*data_/i.test(text) &&
    /_cell_length_a/i.test(text) &&
    /_atom_site_/i.test(text);
}

function cifResponse(text, route) {
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "chemical/x-cif; charset=utf-8",
      "X-CrystalAR-Route": route
    }
  });
}

function staticCodPath(id) {
  return `${id[0]}/${id.slice(1, 3)}/${id.slice(3, 5)}/${id}.cif`;
}

function routesFor(id) {
  const staticPath = staticCodPath(id);
  const targets = [
    `https://www.crystallography.net/cod/${id}.cif`,
    `https://crystallography.net/cod/${id}.cif`,
    `https://qiserver.ugr.es/cod/${id}.cif`,
    `https://www.crystallography.net/cod/cif/${staticPath}`,
    `https://qiserver.ugr.es/cod/cif/${staticPath}`
  ];

  return [
    ...targets,
    ...targets.slice(0, 3).map(target => `https://corsproxy.io/?url=${encodeURIComponent(target)}`),
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targets[0])}`
  ];
}

async function fetchRoute(route, controller, timeoutMs = 9000) {
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await nativeFetch(route, {
      mode: "cors",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!looksLikeCIF(text)) throw new Error("resposta não reconhecida como CIF");
    return { text, route };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRemoteCIF(id) {
  const controllers = routesFor(id).map(() => new AbortController());
  const tasks = routesFor(id).map((route, index) => fetchRoute(route, controllers[index]));
  try {
    return await Promise.any(tasks);
  } finally {
    controllers.forEach(controller => controller.abort());
  }
}

async function fetchCOD(id) {
  const cacheKey = `crystalar-cif-${id}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached && looksLikeCIF(cached)) return cifResponse(cached, "local-cache");
  } catch {
    // Storage can be disabled in private browsing.
  }

  const localPath = LOCAL_CIF[id];
  if (localPath) {
    const response = await nativeFetch(localPath, { cache: "no-store" });
    if (response.ok) {
      const text = await response.text();
      if (looksLikeCIF(text)) return cifResponse(text, "local-example");
    }
  }

  try {
    const result = await fetchRemoteCIF(id);
    try { localStorage.setItem(cacheKey, result.text); } catch {}
    return cifResponse(result.text, result.route.includes("corsproxy") || result.route.includes("allorigins") ? "cors-proxy" : "cod-server");
  } catch {
    throw new TypeError("Não foi possível recuperar o CIF automaticamente em até 9 segundos. Baixe o arquivo na ficha do COD e use a opção ‘Abrir arquivo CIF’.");
  }
}

window.fetch = function crystalARFetch(input, init = {}) {
  const target = typeof input === "string" ? input : input?.url;
  const id = extractCodId(target);
  return id ? fetchCOD(id) : nativeFetch(input, init);
};

// Improve mobile-camera compatibility before app.js installs the AR controls.
if (navigator.mediaDevices?.getUserMedia) {
  const nativeGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = async constraints => {
    try {
      return await nativeGetUserMedia(constraints);
    } catch (error) {
      if (["NotFoundError", "OverconstrainedError"].includes(error?.name)) {
        return nativeGetUserMedia({ audio: false, video: true });
      }
      if (["NotAllowedError", "SecurityError"].includes(error?.name)) {
        throw new Error("A câmera foi bloqueada. Autorize a câmera nas permissões do navegador e toque em AR novamente.");
      }
      if (["NotReadableError", "AbortError"].includes(error?.name)) {
        throw new Error("A câmera está ocupada por outro aplicativo ou não pôde ser iniciada.");
      }
      throw error;
    }
  };
}

const video = document.getElementById("cameraVideo");
if (video) {
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
}

document.querySelector(".eyebrow")?.replaceChildren("Protótipo v0.1.1");
await import("./app.js?v=0.1.1");