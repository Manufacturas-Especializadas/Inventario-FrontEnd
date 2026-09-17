const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const { spawn } = require("node:child_process");

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "codex-colors-"));
const dist = path.resolve("dist");
let browser, socket, server;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let sequence = 0;
const commands = new Map();
const requests = [];
const browserErrors = [];
let colors = [{ id: 1, name: "Azul", isActive: true }, { id: 2, name: "Rojo", isActive: true }, { id: 3, name: "Negro", isActive: false }];
let failGet = false, failMutation = false, viewer = false;

function send(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
        commands.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
    });
}
async function evaluate(expression) {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
}
async function until(expression) {
    for (let i = 0; i < 100; i++) {
        if (await evaluate(expression)) return;
        await delay(50);
    }
    throw new Error("Timed out: " + expression + "\n" + await evaluate("document.body.innerText"));
}
const click = label => evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)}); if (!button || button.disabled) throw new Error('Button unavailable: ' + ${JSON.stringify(label)}); button.focus(); button.click(); })()`);
const change = (id, value) => evaluate(`(() => { const input = document.getElementById(${JSON.stringify(id)}); const proto = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`);
const key = async (key, code, modifiers = 0) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key, windowsVirtualKeyCode: code, modifiers });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: code, modifiers });
};
const getCount = () => requests.filter(r => r.method === "GET" && r.pathname.endsWith("/colors")).length;
async function screenshot(name) {
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const file = path.join(profile, name + ".png");
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log("SCREENSHOT " + file);
}

async function intercept(params) {
    const { requestId, request, resourceType } = params;
    const url = new URL(request.url);
    if (!["XHR", "Fetch"].includes(resourceType) && request.method !== "OPTIONS") {
        if (url.hostname === "127.0.0.1") return send("Fetch.continueRequest", { requestId });
        return send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" });
    }
    const headers = [
        { name: "Content-Type", value: "application/json" },
        { name: "Access-Control-Allow-Origin", value: "*" },
        { name: "Access-Control-Allow-Headers", value: "authorization,content-type" },
        { name: "Access-Control-Allow-Methods", value: "GET,POST,PUT,OPTIONS" },
    ];
    let status = 200, body;
    const pathname = url.pathname;
    if (request.method === "OPTIONS") body = {};
    else if (pathname.endsWith("/auth/me")) body = { userId: 1, employeeId: 1, employeeNumber: "TEST", name: "Prueba local", username: "test", roles: [viewer ? "Viewer" : "Administrator"] };
    else if (/\/colors(?:\/\d+(?:\/status)?)?$/.test(pathname)) {
        requests.push({ method: request.method, pathname });
        await delay(request.method === "GET" ? 150 : 800);
        if (request.method === "GET") {
            if (failGet) { failGet = false; status = 500; body = { message: "Fallo de consulta simulado" }; }
            else body = colors;
        } else if (failMutation) {
            failMutation = false; status = 500; body = { message: "Fallo de guardado simulado" };
        } else {
            const payload = JSON.parse(request.postData);
            if (request.method === "POST") {
                body = { id: 4, name: payload.name, isActive: true }; colors.push(body);
            } else {
                const id = Number(pathname.match(/\/colors\/(\d+)/)[1]);
                body = { ...colors.find(color => color.id === id), ...payload };
                colors = colors.map(color => color.id === id ? body : color);
            }
        }
    } else {
        throw new Error("Unexpected API request: " + request.method + " " + pathname);
    }
    return send("Fetch.fulfillRequest", { requestId, responseCode: status, responseHeaders: headers, body: Buffer.from(JSON.stringify(body)).toString("base64") });
}

(async () => {
    server = http.createServer((req, res) => {
        const pathname = new URL(req.url, "http://127.0.0.1").pathname;
        let file = path.resolve(dist, "." + pathname);
        if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, "index.html");
        res.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" })[path.extname(file)] || "application/octet-stream");
        res.end(fs.readFileSync(file));
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    browser = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"], { windowsHide: true, stdio: "ignore" });
    browser.on("error", error => { console.error(error); process.exitCode = 1; });
    const portFile = path.join(profile, "DevToolsActivePort");
    for (let i = 0; i < 150 && !fs.existsSync(portFile); i++) await delay(100);
    const port = fs.readFileSync(portFile, "utf8").split(/\r?\n/)[0];
    const tabs = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
    socket = new WebSocket(tabs.find(tab => tab.type === "page").webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }));
    socket.addEventListener("message", event => {
        const message = JSON.parse(event.data);
        if (message.id) {
            const command = commands.get(message.id);
            commands.delete(message.id);
            if (message.error) command.reject(message.error); else command.resolve(message.result);
        } else if (message.method === "Fetch.requestPaused") {
            intercept(message.params).catch(error => browserErrors.push(String(error)));
        } else if (message.method === "Runtime.exceptionThrown") browserErrors.push(JSON.stringify(message.params));
    });
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: "localStorage.setItem('ppe_inventory_access_token', 'local-test-only');" });
    await send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: "http://127.0.0.1:" + server.address().port + "/colors" });
    await until("document.querySelectorAll('tbody tr').length === 3");
    assert.equal(getCount(), 1);
    assert.equal(await evaluate("!!document.querySelector('dialog')"), false);
    await screenshot("colors-desktop");
    await change("color-search", "azul");
    await until("document.querySelectorAll('tbody tr').length === 1");
    await change("color-search", "");
    await change("color-status", "inactive");
    await until("document.querySelectorAll('tbody tr').length === 1 && document.querySelector('tbody').textContent.includes('Negro')");
    await click("Limpiar");
    await until("document.querySelectorAll('tbody tr').length === 3");
    assert.equal(getCount(), 1);
    await click("Nuevo color");
    await until("document.querySelector('dialog:modal') && document.activeElement.id === 'color-name'");
    assert.equal(await evaluate("document.body.style.overflow"), "hidden");
    await key("Tab", 9, 8);
    assert.equal(await evaluate("!!document.activeElement.closest('dialog')"), true);
    await key("Tab", 9, 8);
    assert.equal(await evaluate("!!document.activeElement.closest('dialog')"), true);
    await evaluate("document.querySelector('dialog form').requestSubmit()");
    await until("!!document.querySelector('dialog [role=alert]')");
    await change("color-name", "  AZUL  ");
    await until("document.querySelector('dialog button[type=submit]').disabled");
    assert.equal(requests.filter(r => r.method === "POST").length, 0);
    await click("Cancelar");
    await until("!document.querySelector('dialog')");
    assert.equal(await evaluate("document.activeElement.textContent.trim()"), "Nuevo color");
    await click("Nuevo color");
    await until("!!document.querySelector('dialog:modal')");
    assert.equal(await evaluate("document.getElementById('color-name').value"), "");
    await key("Escape", 27);
    await until("!document.querySelector('dialog')");
    assert.notEqual(await evaluate("document.body.style.overflow"), "hidden");
    await click("Nuevo color");
    await until("!!document.querySelector('dialog:modal')");
    await change("color-name", "Verde");
    failMutation = true;
    await click("Crear Color");
    await until("!!document.querySelector('dialog [role=alert]') && !document.querySelector('dialog button[type=submit]').disabled");
    await click("Crear Color");
    await until("document.querySelector('dialog')?.getAttribute('aria-busy') === 'true'");
    await key("Escape", 27);
    assert.equal(await evaluate("!!document.querySelector('dialog:modal')"), true);
    await until("!document.querySelector('dialog') && document.querySelectorAll('tbody tr').length === 4");
    assert.equal(getCount(), 1);
    await click("Editar");
    await until("!!document.querySelector('dialog:modal')");
    assert.equal(await evaluate("document.getElementById('color-name').value"), "Azul");
    await change("color-name", "Azul marino");
    await click("Guardar cambios");
    await until("!document.querySelector('dialog') && document.querySelector('tbody').textContent.includes('Azul marino')");
    await click("Desactivar");
    await until("document.querySelector('tbody tr:last-child').textContent.includes('Negro') && [...document.querySelectorAll('tbody tr')].find(r=>r.textContent.includes('Azul marino')).textContent.includes('Activar')");
    assert.equal(getCount(), 1);
    await click("Actualizar");
    await until("document.querySelectorAll('tbody tr').length === 4");
    assert.equal(getCount(), 2);
    failGet = true;
    await click("Actualizar");
    await until("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Reintentar')");
    await click("Reintentar");
    await until("document.querySelectorAll('tbody tr').length === 4");
    assert.equal(getCount(), 4);
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true);
    await click("Nuevo color");
    await until("!!document.querySelector('dialog:modal')");
    assert.equal(await evaluate("(()=>{const r=document.querySelector('dialog').getBoundingClientRect();return r.width<=innerWidth && r.height<=innerHeight && r.left>=0;})()"), true);
    await screenshot("colors-mobile-modal");
    await click("Cancelar");
    colors = [];
    await click("Actualizar");
    await until("document.body.textContent.includes('No hay colores registrados.')");
    viewer = true;
    colors = [{ id: 1, name: "Azul", isActive: true }];
    await send("Page.reload");
    await until("document.querySelectorAll('tbody tr').length === 1");
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(b=>['Nuevo color','Editar','Desactivar'].includes(b.textContent.trim()))"), false);
    assert.deepEqual(browserErrors, []);
    console.log("PASS: browser desktop/mobile, modal focus and focus return, native focus containment, Escape/cancel/reset, pending-save close prevention, validation/duplicates, create/edit/status without GET, explicit refresh/retry, empty state and Viewer permissions.");
    console.log(JSON.stringify({ colorGets: getCount(), mutations: requests.filter(r => r.method !== "GET").length }));
})().catch(error => { console.error(error); console.error(browserErrors); process.exitCode = 1; }).finally(async () => {
    if (socket?.readyState === WebSocket.OPEN) {
        send("Browser.close").catch(() => {});
        await delay(300);
        socket.close();
    }
    if (browser && browser.exitCode === null) browser.kill();
    server?.close();
});
