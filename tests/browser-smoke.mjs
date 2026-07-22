import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const chrome = process.env.CHROME_BIN || "google-chrome";
const port = 4173;
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  stdio: ["ignore", "pipe", "pipe"]
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
await delay(1200);

const args = [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--enable-logging=stderr",
  "--log-level=0",
  "--virtual-time-budget=22000",
  "--dump-dom",
  `http://127.0.0.1:${port}/`
];

const browser = spawn(chrome, args, { stdio: ["ignore", "pipe", "pipe"] });
let dom = "";
let stderr = "";
browser.stdout.on("data", chunk => { dom += chunk; });
browser.stderr.on("data", chunk => { stderr += chunk; });
const exitCode = await new Promise(resolve => browser.on("close", resolve));
server.kill("SIGTERM");

await writeFile("/tmp/crystalar-browser-dom.html", dom);
await writeFile("/tmp/crystalar-browser.log", stderr);

assert.equal(exitCode, 0, `Chrome terminou com código ${exitCode}.\n${stderr}`);
assert.match(dom, /CrystalAR/, "A página não contém a aplicação CrystalAR.");
assert.doesNotMatch(dom, /Aguardando estrutura/, `A estrutura inicial não foi carregada.\nConsole do navegador:\n${stderr}`);
assert.match(dom, /Diamante/, `O exemplo inicial não apareceu no DOM após a inicialização.\n${stderr}`);
assert.match(dom, /Versão v5\.3\.0/, `A versão 5.3.0 não apareceu no DOM renderizado.\n${stderr}`);
assert.match(dom, /id="scienceGallery510"/, `A galeria científica não foi injetada.\n${stderr}`);
assert.match(dom, /Carbono: diamante e grafite/, `O roteiro do carbono não apareceu no DOM.\n${stderr}`);
assert.match(dom, /Polimorfos do TiO₂/, `A família TiO₂ não apareceu no DOM.\n${stderr}`);
assert.match(dom, /Polimorfos do CaCO₃/, `A família CaCO₃ não apareceu no DOM.\n${stderr}`);
assert.match(dom, /id="mineralImage"/, `A imagem mineral não apareceu no roteiro.\n${stderr}`);
assert.match(dom, /assets\/minerals\/diamond\.jpg\?v=5\.3\.0/, `A fotografia de diamante não foi sincronizada ao roteiro inicial.\n${stderr}`);
assert.match(dom, /Cristal bruto e isolado de diamante/i, `O texto alternativo da fotografia de diamante está ausente.\n${stderr}`);
assert.match(dom, /Tõnu Pani/, `O crédito da imagem do diamante não apareceu.\n${stderr}`);
assert.match(dom, /Estrutura → propriedade/, `A matriz de comparação não apareceu.\n${stderr}`);
assert.match(dom, /tetraédrica · sp³/, `A comparação sp3 do diamante está ausente.\n${stderr}`);
assert.match(dom, /trigonal planar · sp²/, `A comparação sp2 do grafite está ausente.\n${stderr}`);
assert.match(dom, /Perguntas de investigação/, `As perguntas formativas não apareceram.\n${stderr}`);
assert.match(dom, /Ver fonte e licença/, `O link de licença da imagem não apareceu.\n${stderr}`);
assert.match(dom, /Escalas diferentes/, `O aviso macro\/micro não apareceu.\n${stderr}`);
assert.match(dom, /id="showPolyhedra"/, `O controle de poliedros não apareceu no DOM.\n${stderr}`);
assert.match(dom, /id="measureMode"/, `O controle de medição não apareceu no DOM.\n${stderr}`);
console.log("Browser smoke PASS: CrystalAR 5.3.0 e roteiro diamante-grafite carregados no navegador real.");
