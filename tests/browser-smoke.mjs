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
  "--virtual-time-budget=15000",
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
console.log("Browser smoke PASS: a estrutura inicial foi carregada no navegador real.");
