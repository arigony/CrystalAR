(() => {
  "use strict";

  const APP_VERSION = "v0.4.1";
  const INCORPORATED_ON = "20/07/2026";
  const COD_BASE = "https://www.crystallography.net/cod/";

  const EXAMPLES = {
    diamond: { label: "Diamante", path: "examples/diamond-9012293.cif", codId: "9012293", type: "Derivado de determinação experimental COD" },
    graphite: { label: "Grafite 2H", path: "examples/graphite-1200017.cif", codId: "1200017", type: "Derivado de determinação experimental COD" },
    graphene: { label: "Grafeno", path: "examples/graphene-model.cif", codId: "", type: "Modelo periódico 2D educacional" },
    nacl: { label: "NaCl — sal-gema", path: "examples/nacl-1000041.cif", codId: "1000041", type: "Derivado de determinação experimental COD" },
    cscl: { label: "CsCl", path: "examples/cscl-9008789.cif", codId: "9008789", type: "Derivado de determinação experimental COD" },
    mgo: { label: "MgO — periclásio", path: "examples/mgo-1011173.cif", codId: "1011173", type: "Derivado de determinação experimental COD" },
    caf2: { label: "CaF₂ — fluorita", path: "examples/caf2-1000043.cif", codId: "1000043", type: "Derivado de determinação experimental COD" },
    znsSphalerite: { label: "ZnS — blenda", path: "examples/zns-sphalerite-9000107.cif", codId: "9000107", type: "Derivado de determinação experimental COD" },
    znsWurtzite: { label: "ZnS — wurtzita 2H", path: "examples/zns-wurtzite-1100044.cif", codId: "1100044", type: "Derivado de determinação experimental COD" }
  };

  const $ = id => document.getElementById(id);
  let current = {
    label: "Diamante",
    type: EXAMPLES.diamond.type,
    codId: EXAMPLES.diamond.codId,
    uri: officialUri(EXAMPLES.diamond.codId),
    date: INCORPORATED_ON,
    hash: "calculando…",
    filename: "diamond-9012293.cif"
  };
  let hashRequest = 0;

  function officialUri(id) {
    return /^\d{7,8}$/.test(String(id || "")) ? `${COD_BASE}${id}.cif` : "";
  }

  function validCodId(value) {
    const id = String(value || "").trim();
    return /^\d{7,8}$/.test(id) ? id : "";
  }

  function showToast(message, type = "info") {
    const box = $("toastBox");
    if (!box) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => el.remove(), 4600);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("Não foi possível copiar para a área de transferência.");
  }

  async function sha256Text(text) {
    if (!globalThis.crypto?.subtle || !globalThis.TextEncoder) return "indisponível neste navegador";
    const bytes = new TextEncoder().encode(String(text));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
  }

  function render() {
    if ($("provType")) $("provType").textContent = current.type || "—";
    if ($("provCodId")) $("provCodId").textContent = current.codId || "não se aplica";
    if ($("provUri")) $("provUri").textContent = current.uri || "não se aplica";
    if ($("provDate")) $("provDate").textContent = current.date || "—";
    if ($("provVersion")) $("provVersion").textContent = APP_VERSION;
    if ($("provHash")) {
      $("provHash").textContent = current.hash || "—";
      $("provHash").title = current.hash || "";
    }
    const officialButton = $("openOfficialCif");
    if (officialButton) officialButton.disabled = !current.uri;
  }

  function updateUriPreview() {
    const input = $("codId");
    const preview = $("codUriPreview");
    if (!input || !preview) return;
    const id = validCodId(input.value);
    preview.textContent = id ? officialUri(id) : "Digite um COD ID com 7 ou 8 algarismos.";
    preview.classList.toggle("invalid", !id);
  }

  function syncCodInput(codId) {
    const input = $("codId");
    if (!input) return;
    input.value = codId || "";
    updateUriPreview();
  }

  async function updateHash(text, requestId) {
    try {
      const hash = await sha256Text(text);
      if (requestId !== hashRequest) return;
      current.hash = hash;
      render();
    } catch (error) {
      if (requestId !== hashRequest) return;
      current.hash = `erro: ${error.message}`;
      render();
    }
  }

  async function setExample(key) {
    const example = EXAMPLES[key];
    if (!example) return;
    const requestId = ++hashRequest;
    current = {
      label: example.label,
      type: example.type,
      codId: example.codId,
      uri: officialUri(example.codId),
      date: INCORPORATED_ON,
      hash: "calculando…",
      filename: example.path.split("/").pop()
    };
    syncCodInput(example.codId);
    render();
    try {
      const response = await fetch(example.path, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await updateHash(await response.text(), requestId);
    } catch (error) {
      if (requestId !== hashRequest) return;
      current.hash = `não calculado (${error.message})`;
      render();
    }
  }

  function extractCodId(text) {
    return String(text || "").match(/^\s*_cod_database_code(?:_structure)?\s+['"]?(\d{7,8})/mi)?.[1]
      || String(text || "").match(/^\s*data_(\d{7,8})\b/mi)?.[1]
      || "";
  }

  async function setUploadedFile(file) {
    if (!file) return;
    const requestId = ++hashRequest;
    const text = await file.text();
    const codId = extractCodId(text);
    current = {
      label: file.name,
      type: "Arquivo CIF fornecido pelo usuário",
      codId,
      uri: officialUri(codId),
      date: "sessão atual",
      hash: "calculando…",
      filename: file.name
    };
    if (codId) syncCodInput(codId);
    render();
    await updateHash(text, requestId);
  }

  function openEnteredCod() {
    const id = validCodId($("codId")?.value);
    if (!id) {
      showToast("Digite um COD ID válido com 7 ou 8 algarismos.", "error");
      $("codId")?.focus();
      return;
    }
    const uri = officialUri(id);
    window.open(uri, "_blank", "noopener,noreferrer");
    showToast("URI oficial do COD aberta. Salve o arquivo CIF e carregue-o no passo 2.", "success");
  }

  function provenanceText() {
    const lines = [
      `Estrutura/arquivo: ${current.label || current.filename || "—"}`,
      `Tipo: ${current.type || "—"}`,
      `COD ID: ${current.codId || "não se aplica"}`,
      `URI oficial: ${current.uri || "não se aplica"}`,
      `Data de incorporação/uso: ${current.date || "—"}`,
      `Versão do aplicativo: CrystalAR ${APP_VERSION}`,
      `SHA-256 do texto CIF carregado: ${current.hash || "—"}`
    ];
    const citation = $("citationBox")?.textContent?.trim();
    if (citation) lines.push(citation);
    return lines.join("\n");
  }

  const form = $("codForm");
  form?.addEventListener("submit", event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    openEnteredCod();
  }, true);

  $("codId")?.addEventListener("input", updateUriPreview);
  $("copyCodUri")?.addEventListener("click", async () => {
    const id = validCodId($("codId")?.value);
    if (!id) {
      showToast("Digite um COD ID válido antes de copiar a URI.", "error");
      return;
    }
    try {
      await copyText(officialUri(id));
      showToast("URI oficial copiada.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  $("openOfficialCif")?.addEventListener("click", () => {
    if (current.uri) window.open(current.uri, "_blank", "noopener,noreferrer");
  });

  $("copyProvenance")?.addEventListener("click", async () => {
    try {
      await copyText(provenanceText());
      showToast("Proveniência copiada para a área de transferência.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.querySelectorAll("[data-example]").forEach(button => {
    button.addEventListener("click", () => setExample(button.dataset.example));
  });

  $("cifFile")?.addEventListener("change", event => {
    setUploadedFile(event.target.files?.[0]).catch(error => {
      showToast(`Não foi possível calcular a proveniência: ${error.message}`, "error");
    });
  });

  updateUriPreview();
  render();
  setExample("diamond");
})();
