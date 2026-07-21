(() => {
  "use strict";
  const FAILURE_DELAY_MS = 9000;
  const scienceModuleUrl = new URL("./science-v510.js?v=5.1.1", document.currentScript.src).href;
  let ready = false, lastError = "";
  const $ = id => document.getElementById(id);
  function hideAlert() { ready = true; $("runtimeAlert")?.classList.add("hidden"); }
  function showAlert(message) {
    if (ready) return;
    const detail = String(message || lastError || "O módulo 3D não concluiu a inicialização.");
    const alert = $("runtimeAlert"), text = $("runtimeAlertText");
    if (text) text.textContent = `${detail} Recarregue a página. Se o problema persistir, teste uma janela anônima ou verifique se cdn.jsdelivr.net está bloqueado.`;
    alert?.classList.remove("hidden"); const status = $("status"); if (status) { status.textContent = `Falha ao iniciar o visualizador 3D: ${detail}`; status.className = "status error"; }
  }
  window.addEventListener("error", event => {
    const target = event.target;
    if (target && target !== window && (target.tagName === "SCRIPT" || target.tagName === "LINK")) { lastError = `Não foi possível carregar ${target.src || target.href || "um recurso externo"}.`; showAlert(lastError); return; }
    if (event.message) { lastError = event.message; setTimeout(() => showAlert(lastError), 0); }
  }, true);
  window.addEventListener("unhandledrejection", event => { lastError = event.reason?.message || String(event.reason || "Erro não tratado durante a inicialização."); showAlert(lastError); });
  window.addEventListener("DOMContentLoaded", () => {
    $("retryApp")?.addEventListener("click", () => location.reload());
    const formula = $("structureFormula");
    if (formula) { const observer = new MutationObserver(() => { if (formula.textContent?.trim() && formula.textContent.trim() !== "Aguardando estrutura") { observer.disconnect(); hideAlert(); } }); observer.observe(formula, { childList: true, characterData: true, subtree: true }); }
    import(scienceModuleUrl).catch(error => { console.error("CrystalAR 5.1.1 scientific module:", error); const status=$("status"); if(status) status.textContent=`Galeria base ativa; módulo científico 5.1.1 não iniciou: ${error.message}`; });
    setTimeout(() => { const waiting = $("structureFormula")?.textContent?.trim() === "Aguardando estrutura"; if (waiting) showAlert(lastError || "A estrutura inicial não foi carregada dentro do tempo esperado."); }, FAILURE_DELAY_MS);
  });
})();
