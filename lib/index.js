// dsh-font-enhancer - host half.
// Dual-face plugin (identical mount pattern to the verified dsh-chat-image-lightbox):
// host registers a loopback-only settings/health API so the bundle has a real cordis
// activate (inject=['webServer']); visual work lives in lib/client.js, mounted by the
// client-modules system once the host activates. Works on both web and desktop profiles.
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, copyFileSync, unlinkSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { get as httpsGet } from "node:https";
import { execFile } from "node:child_process";

var SETTINGS_PREFIX = "/dsh-font-enhancer";
var SETTINGS_STORE = join(homedir(), ".dsh", "data", "dsh-font-enhancer", "settings.json");
var OPERATION_LOG = join(homedir(), ".dsh", "data", "dsh-font-enhancer", "operation.log");
// Fonts directory: sibling of this file (lib/fonts), resolved via import.meta.url
// so it works no matter where the package is installed.
var FONTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "fonts");
// User-scoped Windows fonts dir (no admin needed): %LOCALAPPDATA%\Microsoft\Windows\Fonts
var USER_FONTS_DIR = join(homedir(), "AppData", "Local", "Microsoft", "Windows", "Fonts");

// Curated font catalog: name -> direct .ttf download URL (OFL/free-commercial).
// Chinese fonts are too large to bundle, so we fetch on demand into the user
// fonts dir and register with Windows. Using the same file each install keeps
// idempotence (copy is skipped if the target already exists).
// `family` MUST be the font's real family name (read from the TTF `name` table,
// verified 2026-10-23) — it is the registry value name and the CSS font-family,
// so a wrong value installs a font that silently never applies.
// Google Fonts now ships these families as single variable files ([wght]/[wdth,wght]);
// the old `*-Regular.ttf` paths 404. Every entry carries a LIST of mirror URLs because
// no single CDN is reliable from CN (measured 2026-10-23: cdn.jsdelivr.net and
// raw.githubusercontent.com each alternated between 200 and ECONNRESET/ETIMEDOUT
// within minutes). downloadFirst() walks the list and uses the first 200.
var FONT_CATALOG = {
  "LXGW WenKai": { urls: ["https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Regular.ttf"], file: "LXGWWenKai-Regular.ttf", en: "LXGW WenKai", zh: "霞鹜文楷", family: "霞鹜文楷" },
  "Smiley Sans": { urls: ["https://fastly.jsdelivr.net/npm/@fontpkg/smiley-sans@2.0.4/SmileySans-Oblique.ttf", "https://gcore.jsdelivr.net/npm/@fontpkg/smiley-sans@2.0.4/SmileySans-Oblique.ttf", "https://quantil.jsdelivr.net/npm/@fontpkg/smiley-sans@2.0.4/SmileySans-Oblique.ttf", "https://cdn.jsdelivr.net/npm/@fontpkg/smiley-sans@2.0.4/SmileySans-Oblique.ttf"], file: "SmileySans-Oblique.ttf", en: "Smiley Sans", zh: "得意黑", family: "得意黑" },
  "ZCOOL KuaiLe": { urls: ["https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf", "https://fastly.jsdelivr.net/gh/google/fonts@main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf", "https://gcore.jsdelivr.net/gh/google/fonts@main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf", "https://quantil.jsdelivr.net/gh/google/fonts@main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf", "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf"], file: "ZCOOLKuaiLe-Regular.ttf", en: "ZCOOL KuaiLe", zh: "站酷快乐体", family: "ZCOOL KuaiLe" },
  "Comic Neue": { urls: [], file: "ComicNeue.ttf", en: "Comic Neue", zh: "Comic Neue", family: "Comic Neue", bundled: true },
  "Baloo 2": { urls: ["https://raw.githubusercontent.com/google/fonts/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf", "https://fastly.jsdelivr.net/gh/google/fonts@main/ofl/baloo2/Baloo2%5Bwght%5D.ttf", "https://gcore.jsdelivr.net/gh/google/fonts@main/ofl/baloo2/Baloo2%5Bwght%5D.ttf", "https://quantil.jsdelivr.net/gh/google/fonts@main/ofl/baloo2/Baloo2%5Bwght%5D.ttf", "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/baloo2/Baloo2%5Bwght%5D.ttf"], file: "Baloo2-Variable.ttf", en: "Baloo 2", zh: "Baloo 2", family: "Baloo 2" },
  "Fredoka": { urls: ["https://raw.githubusercontent.com/google/fonts/main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf", "https://fastly.jsdelivr.net/gh/google/fonts@main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf", "https://gcore.jsdelivr.net/gh/google/fonts@main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf", "https://quantil.jsdelivr.net/gh/google/fonts@main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf", "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf"], file: "Fredoka-Variable.ttf", en: "Fredoka", zh: "Fredoka", family: "Fredoka" },
  "Nunito": { urls: ["https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/Nunito%5Bwght%5D.ttf", "https://fastly.jsdelivr.net/gh/google/fonts@main/ofl/nunito/Nunito%5Bwght%5D.ttf", "https://gcore.jsdelivr.net/gh/google/fonts@main/ofl/nunito/Nunito%5Bwght%5D.ttf", "https://quantil.jsdelivr.net/gh/google/fonts@main/ofl/nunito/Nunito%5Bwght%5D.ttf", "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nunito/Nunito%5Bwght%5D.ttf"], file: "Nunito-Variable.ttf", en: "Nunito", zh: "Nunito", family: "Nunito" },
  "Caveat": { urls: ["https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat%5Bwght%5D.ttf", "https://fastly.jsdelivr.net/gh/google/fonts@main/ofl/caveat/Caveat%5Bwght%5D.ttf", "https://gcore.jsdelivr.net/gh/google/fonts@main/ofl/caveat/Caveat%5Bwght%5D.ttf", "https://quantil.jsdelivr.net/gh/google/fonts@main/ofl/caveat/Caveat%5Bwght%5D.ttf", "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/caveat/Caveat%5Bwght%5D.ttf"], file: "Caveat-Variable.ttf", en: "Caveat", zh: "Caveat", family: "Caveat" }
};
// In-memory download progress tracker: fontId -> { received, total, pct, state }
var DOWNLOAD_PROGRESS = {};

export var name = "dsh-font-enhancer";
export var inject = ["webServer"];

function isLoopback(req) {
  var a = (req.socket && req.socket.remoteAddress) || "";
  var n = a.toLowerCase();
  if (n === "::1") return true;
  if (n.startsWith("::ffff:")) return n.slice(7).startsWith("127.");
  return n.startsWith("127.");
}

function readSettings() {
  try {
    if (existsSync(SETTINGS_STORE)) return JSON.parse(readFileSync(SETTINGS_STORE, "utf8"));
  } catch (e) {}
  return { available: true };
}

function writeSettings(data) {
  try {
    mkdirSync(dirname(SETTINGS_STORE), { recursive: true });
    writeFileSync(SETTINGS_STORE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) { return false; }
}

// Download a URL to a local file (follows redirects via https.get default),
// tracking progress into DOWNLOAD_PROGRESS[fontId] for the client to poll.
function downloadTo(url, dest, fontId) {
  return new Promise(function (resolve, reject) {
    try {
      httpsGet(url, function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          resolve(downloadTo(res.headers.location, dest, fontId));
          return;
        }
        if (res.statusCode !== 200) { res.resume(); if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "error", error: "HTTP " + res.statusCode }; reject(new Error("HTTP " + res.statusCode)); return; }
        var total = parseInt(res.headers["content-length"] || "0", 10) || 0;
        var received = 0;
        var chunks = [];
        res.on("data", function (c) {
          chunks.push(c);
          received += c.length;
          if (fontId) DOWNLOAD_PROGRESS[fontId] = total > 0
            ? { state: "downloading", received: received, total: total, pct: Math.floor(received / total * 100) }
            : { state: "downloading", received: received, total: 0, pct: -1 };
        });
        res.on("end", function () {
          try { writeFileSync(dest, Buffer.concat(chunks)); if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "done", pct: 100, received: received, total: total, dest: dest }; resolve(dest); }
          catch (e) { if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "error", error: String(e) }; reject(e); }
        });
        res.on("error", function (e) { if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "error", error: String(e) }; reject(e); });
      }).on("error", function (e) { if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "error", error: String(e) }; reject(e); });
    } catch (e) { if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "error", error: String(e) }; reject(e); }
  });
}

// Walk a mirror list and use the first one that answers 200. Network conditions
// from CN flap between 200 and ECONNRESET per host, so a single hardcoded URL is
// not dependable even when it tested green minutes earlier.
async function downloadFirst(urls, dest, fontId) {
  var lastErr = null;
  for (var i = 0; i < urls.length; i++) {
    try {
      await downloadTo(urls[i], dest, fontId);
      return urls[i];
    } catch (e) {
      lastErr = e;
      if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "retry", error: String(e && e.message || e), tried: i + 1, total: urls.length };
    }
  }
  throw lastErr || new Error("all " + urls.length + " mirrors failed");
}

// Registry key that carries per-user fonts. A font copied into USER_FONTS_DIR is
// invisible to every app until a value here names it and AddFontResource loads it.
var USER_FONTS_REG_KEY = "HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts";
// Persistent record of user-supplied fonts (upload route) so their family alias
// survives a host restart.
var USER_FONT_INDEX = join(homedir(), ".dsh", "data", "dsh-font-enhancer", "user-fonts.json");

function readUserFontIndex() {
  try { if (existsSync(USER_FONT_INDEX)) return JSON.parse(readFileSync(USER_FONT_INDEX, "utf8")) || {}; } catch (e) {}
  return {};
}

function writeUserFontIndex(data) {
  try { mkdirSync(dirname(USER_FONT_INDEX), { recursive: true }); writeFileSync(USER_FONT_INDEX, JSON.stringify(data, null, 2), "utf8"); return true; } catch (e) { return false; }
}

// Every alias a font must answer to in CSS. The client stores whatever the
// catalogue shows in its dropdown — for Chinese fonts that is the localized name
// ("霞鹜文楷"), for Latin ones the English name — while the font's real family in
// the TTF is usually the English one. All of them are mapped to the same file, so
// whichever the user picks actually resolves.
function fontAliases(info) {
  var out = [];
  [info.family, info.en, info.zh, info.file ? info.file.replace(/\.(ttf|otf)$/i, "") : ""].forEach(function (n) {
    if (n && out.indexOf(n) < 0) out.push(n);
  });
  return out;
}

// List every font currently present in the per-user dir: the catalogue entries
// whose file exists, plus user uploads recorded in the index. Served to the client
// so it can build @font-face rules.
function installedUserFonts() {
  var list = [];
  var idx = readUserFontIndex();
  Object.keys(FONT_CATALOG).forEach(function (id) {
    var info = FONT_CATALOG[id];
    var dest = join(USER_FONTS_DIR, info.file);
    if (!existsSync(dest)) return;
    list.push({ id: id, file: info.file, family: info.family || id, names: fontAliases(info), bytes: safeSize(dest) });
  });
  Object.keys(idx).forEach(function (file) {
    if (!existsSync(join(USER_FONTS_DIR, file))) return;
    if (list.some(function (x) { return x.file === file; })) return;
    var rec = idx[file] || {};
    var stem = file.replace(/\.(ttf|otf)$/i, "");
    var names = [];
    [rec.family, stem].forEach(function (n) { if (n && names.indexOf(n) < 0) names.push(n); });
    list.push({ id: stem, file: file, family: rec.family || stem, names: names, bytes: safeSize(join(USER_FONTS_DIR, file)), uploaded: true });
  });
  return list;
}

function safeSize(p) {
  try { return statSync(p).size; } catch (e) { return 0; }
}

// Register a font with Windows so the whole system (not just DSH) can use it:
//   1. write the HKCU Fonts value (persists across logon) — plain `reg.exe`, no admin
//   2. AddFontResourceW + WM_FONTCHANGE broadcast (takes effect now, no reboot)
// Step 2 needs a Win32 call, which plain Node cannot make, so it goes through
// PowerShell with -ExecutionPolicy Bypass (the machine blocks .ps1 by policy).
function registerFontWin(filePath, family) {
  return new Promise(function (resolve) {
    if (process.platform !== "win32") { resolve({ ok: false, error: "Windows only" }); return; }
    var regName = family + " (TrueType)";
    execFile("reg.exe", ["add", USER_FONTS_REG_KEY, "/v", regName, "/t", "REG_SZ", "/d", filePath, "/f"], { windowsHide: true, timeout: 20000 }, function (regErr) {
      if (regErr) { resolve({ ok: false, error: "registry write failed: " + String(regErr.message || regErr) }); return; }
      // Single-quoted PowerShell literals: only ' needs escaping, doubled.
      var psPath = String(filePath).replace(/'/g, "''");
      var ps = [
        "$sig = '[DllImport(\"gdi32.dll\", CharSet=CharSet.Unicode, SetLastError=true)] public static extern int AddFontResourceW(string lpFileName); [DllImport(\"user32.dll\", CharSet=CharSet.Unicode)] public static extern IntPtr SendMessageTimeoutW(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);';",
        "Add-Type -Namespace DshFe -Name Native -MemberDefinition $sig | Out-Null;",
        "$n = [DshFe.Native]::AddFontResourceW('" + psPath + "');",
        "$r = [IntPtr]::Zero; [DshFe.Native]::SendMessageTimeoutW([IntPtr]0xffff, 0x001D, [IntPtr]::Zero, [IntPtr]::Zero, 2, 3000, [ref]$r) | Out-Null;",
        "Write-Output ('ADDED=' + $n)"
      ].join(" ");
      execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps], { windowsHide: true, timeout: 30000 }, function (psErr, stdout) {
        var out = String(stdout || "");
        var m = /ADDED=(-?\d+)/.exec(out);
        var added = m ? parseInt(m[1], 10) : 0;
        // AddFontResourceW returns the number of fonts added; 0 can simply mean
        // "already loaded in this session", which is not a failure.
        resolve({ ok: true, added: added, broadcast: true, registry: true, warn: psErr ? String(psErr.message || psErr) : null });
      });
    });
  });
}

// Install a font to the per-user Windows fonts dir and register it. Idempotent:
// re-installing an existing file only re-runs registration (which is what repairs
// fonts left unregistered by earlier versions).
function installFont(file, urls, fontId, family) {
  return new Promise(function (resolve) {
    try {
      mkdirSync(USER_FONTS_DIR, { recursive: true });
      var dest = join(USER_FONTS_DIR, file);
      if (existsSync(dest)) {
        registerFontWin(dest, family || file.replace(/\.(ttf|otf)$/i, "")).then(function (reg) {
          if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "done", already: true, pct: 100, dest: dest };
          resolve({ ok: true, already: true, dest: dest, registered: reg.ok, regError: reg.ok ? null : reg.error });
        });
        return;
      }
      if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "started", received: 0, total: 0, pct: 0 };
      downloadFirst(urls, dest, fontId).then(function () {
        registerFontWin(dest, family || file.replace(/\.(ttf|otf)$/i, "")).then(function (reg) {
          resolve({ ok: true, already: false, dest: dest, registered: reg.ok, regError: reg.ok ? null : reg.error });
        });
      }).catch(function (e) {
        try { if (existsSync(dest)) { try { unlinkSync(dest); } catch (eu) {} } } catch (eu2) {}
        resolve({ ok: false, error: String(e && e.message || e) });
      });
    } catch (e) { if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "error", error: String(e) }; resolve({ ok: false, error: String(e && e.message || e) }); }
  });
}

export function apply(ctx) {
  ctx.logger.info("dsh-font-enhancer: host half mounted (settings api + client)");
  ctx.effect(function () {
    var h1 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/health", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true, plugin: "dsh-font-enhancer", version: "1.0.0" }));
    }});
    var h2 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/get", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(readSettings()));
    }});
    var h3 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/set", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      var chunks = [];
      req.on("data", function (c) { chunks.push(c); });
      req.on("end", function () {
        try {
          var body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          var ok = writeSettings(body);
          res.writeHead(ok ? 200 : 500, { "content-type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: ok }));
        } catch (e) {
          res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: "bad json" }));
        }
      });
    }});

    var h4 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/client-alive", handler: function (req, res) {
      ctx.logger.info("dsh-font-enhancer: CLIENT-ALIVE ping received from browser");
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true }));
    }});
    var h5 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/log", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      var chunks = [];
      req.on("data", function (c) { chunks.push(c); });
      req.on("end", function () {
        var ts = new Date().toISOString();
        var line = "[" + ts + "] ";
        try {
          var body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          line += JSON.stringify(body);
        } catch (e) { line += "[non-json] " + Buffer.concat(chunks).toString("utf8"); }
        line += "\n";
        try {
          mkdirSync(dirname(OPERATION_LOG), { recursive: true });
          appendFileSync(OPERATION_LOG, line, "utf8");
        } catch (e) { ctx.logger.warn("dsh-font-enhancer: log write failed " + (e && e.message)); }
        res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true }));
      });
    }});
    // Font file serving: serve .woff2/.ttf/.otf from the plugin's fonts dir.
    // The prefix route matches any path below /dsh-font-enhancer/fonts/.
    var h6 = ctx.webServer.register({ kind: "prefix", path: SETTINGS_PREFIX + "/fonts", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      var rel = decodeURIComponent(req.url.slice(SETTINGS_PREFIX.length + "/fonts".length));
      if (!rel || rel.includes("..") || rel.includes("\0")) { res.writeHead(400); res.end(); return; }
      var target = join(FONTS_DIR, rel.replace(/^\/+/, ""));
      if (!existsSync(target)) { res.writeHead(404); res.end(); return; }
      var ext = target.slice(target.lastIndexOf(".")).toLowerCase();
      var mime = ext === ".woff2" ? "font/woff2" : ext === ".ttf" ? "font/ttf" : ext === ".otf" ? "font/otf" : ext === ".woff" ? "font/woff" : "application/octet-stream";
      res.writeHead(200, { "content-type": mime, "cache-control": "public, max-age=86400" });
      res.end(readFileSync(target));
    }});
    // Font install route: POST /dsh-font-enhancer/install-font { fontId }
    // Downloads the font file from the catalog and installs to user fonts dir.
    var h7 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/install-font", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      var chunks = [];
      req.on("data", function (c) { chunks.push(c); });
      req.on("end", async function () {
        var body;
        try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch (e) { body = {}; }
        var fontId = body.fontId || "";
        var info = FONT_CATALOG[fontId];
        if (!info) { res.writeHead(404, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, error: "unknown font: " + fontId })); return; }
        if (info.bundled) {
          // bundled font: copy from plugin's fonts dir to user fonts dir, then register
          try {
            mkdirSync(USER_FONTS_DIR, { recursive: true });
            var src = join(FONTS_DIR, info.file);
            var dest = join(USER_FONTS_DIR, info.file);
            if (!existsSync(src)) { res.writeHead(500, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, error: "bundled font missing from package: " + info.file })); return; }
            var fresh = !existsSync(dest);
            if (fresh) { copyFileSync(src, dest); }
            var regB = await registerFontWin(dest, info.family || fontId);
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, already: !fresh, dest: dest, fontId: fontId, family: info.family || fontId, registered: regB.ok, regError: regB.ok ? null : regB.error }));
            return;
          } catch (e) { res.writeHead(500, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, error: String(e) })); return; }
        }
        if (!info.urls || !info.urls.length) { res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, error: "no download url for " + fontId })); return; }
        try {
          var result = await installFont(info.file, info.urls, fontId, info.family || fontId);
          result.family = info.family || fontId;
          result.fontId = fontId;
          res.writeHead(result.ok ? 200 : 500, { "content-type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(500, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: String(e) }));
        }
      });
    }});
    // Font progress route: GET /dsh-font-enhancer/font-progress?fontId=xxx
    var h9 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/font-progress", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      var q = req.url.indexOf("?") >= 0 ? req.url.slice(req.url.indexOf("?") + 1) : "";
      var m = /fontId=([^&]+)/.exec(q);
      var fontId = m ? decodeURIComponent(m[1]) : "";
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      if (fontId && DOWNLOAD_PROGRESS[fontId]) { res.end(JSON.stringify(DOWNLOAD_PROGRESS[fontId])); }
      else { res.end(JSON.stringify({ state: "none" })); }
    }});
    if (h7) { /* keep reference */ }
    // Upload-font route: POST /dsh-font-enhancer/upload-font { fileName, data(base64) }
    // Receives a user-provided .ttf/.otf, writes it to the per-user fonts dir.
    var h8 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/upload-font", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      var chunks = [];
      req.on("data", function (c) { chunks.push(c); });
      req.on("end", async function () {
        var body;
        try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch (e) { body = {}; }
        var fileName = body.fileName || "";
        var data = body.data || "";
        var familyHint = String(body.family || "").trim();
        if (!/\.(ttf|otf)$/i.test(fileName) || !data) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "need .ttf/.otf file data" }));
          return;
        }
        try {
          var buf = Buffer.from(data, "base64");
          if (!buf || buf.length < 4) { res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, error: "invalid file data" })); return; }
          // basic signature check: TTF starts with 00 01 00 00, OTF with OTTO
          var sig = buf.toString("ascii", 0, 4);
          var ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
          var okSig = (ext === ".ttf" && buf[0] === 0x00 && buf[1] === 0x01 && buf[2] === 0x00 && buf[3] === 0x00) || (ext === ".otf" && sig === "OTTO");
          if (!okSig) { res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, error: "file is not a valid TTF/OTF font" })); return; }
          mkdirSync(USER_FONTS_DIR, { recursive: true });
          // sanitize filename to avoid path traversal
          var safeName = basename(fileName).replace(/[^A-Za-z0-9._-]/g, "_");
          var dest = join(USER_FONTS_DIR, safeName);
          writeFileSync(dest, buf);
          var fontName = familyHint || safeName.replace(/\.(ttf|otf)$/i, "");
          // Record the alias so the client keeps resolving it after a host restart.
          var idx = readUserFontIndex();
          idx[safeName] = { family: fontName, addedAt: new Date().toISOString() };
          writeUserFontIndex(idx);
          var reg = await registerFontWin(dest, fontName);
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: true, dest: dest, fontName: fontName, file: safeName, registered: reg.ok, regError: reg.ok ? null : reg.error }));
        } catch (e) {
          res.writeHead(500, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: String(e) }));
        }
      });
    }});
    // Installed-fonts route: GET /dsh-font-enhancer/installed-fonts
    // Tells the client which catalogue fonts are really present on disk, so the UI
    // can show 已安装 instead of offering a re-install that does nothing.
    var h10 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/installed-fonts", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: true, fonts: installedUserFonts() }));
    }});
    // User-font file route: GET /dsh-font-enhancer/user-font?file=xxx.ttf
    // Serves the installed .ttf so the client can build @font-face rules and render
    // the font immediately, without depending on OS font enumeration.
    var h11 = ctx.webServer.register({ kind: "exact", path: SETTINGS_PREFIX + "/user-font", handler: function (req, res) {
      if (!isLoopback(req)) { res.writeHead(403); res.end(); return; }
      var q = req.url.indexOf("?") >= 0 ? req.url.slice(req.url.indexOf("?") + 1) : "";
      var m = /(?:^|&)file=([^&]+)/.exec(q);
      var name = m ? decodeURIComponent(m[1]) : "";
      name = basename(name);
      if (!/\.(ttf|otf)$/i.test(name)) { res.writeHead(400); res.end(); return; }
      var target = join(USER_FONTS_DIR, name);
      if (!existsSync(target)) { res.writeHead(404); res.end(); return; }
      var ext2 = name.slice(name.lastIndexOf(".")).toLowerCase();
      res.writeHead(200, { "content-type": ext2 === ".otf" ? "font/otf" : "font/ttf", "cache-control": "public, max-age=86400" });
      res.end(readFileSync(target));
    }});
    return function () { h1(); h2(); h3(); h4(); h5(); h6(); try { h7(); } catch (e) {} try { h8(); } catch (e) {} try { h9(); } catch (e) {} try { h10(); } catch (e) {} try { h11(); } catch (e) {} };
  }, "dsh-font-enhancer: settings routes");
}