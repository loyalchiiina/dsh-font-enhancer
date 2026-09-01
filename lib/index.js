// dsh-font-enhancer - host half.
// Dual-face plugin (identical mount pattern to the verified dsh-chat-image-lightbox):
// host registers a loopback-only settings/health API so the bundle has a real cordis
// activate (inject=['webServer']); visual work lives in lib/client.js, mounted by the
// client-modules system once the host activates. Works on both web and desktop profiles.
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, copyFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { get as httpsGet } from "node:https";

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
var FONT_CATALOG = {
  "LXGW WenKai": { url: "https://github.com/lxgw/LxgwWenKai/releases/download/v1.330/LXGWWenKai-Regular.ttf", file: "LXGWWenKai-Regular.ttf", zh: "霞鹜文楷" },
  "Smiley Sans": { url: "https://github.com/atelier-anchor/smiley-sans/releases/download/v2.0.1/SmileySans-Oblique.ttf", file: "SmileySans-Oblique.ttf", zh: "得意黑" },
  "ZCOOL KuaiLe": { url: "https://github.com/google/fonts/raw/main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf", file: "ZCOOLKuaiLe-Regular.ttf", zh: "站酷快乐体" },
  "Comic Neue": { url: "", file: "ComicNeue.ttf", en: "Comic Neue", bundled: true },
  "Baloo 2": { url: "https://github.com/google/fonts/raw/main/ofl/baloo2/Baloo2-Regular.ttf", file: "Baloo2-Regular.ttf", en: "Baloo 2" },
  "Fredoka": { url: "https://github.com/google/fonts/raw/main/ofl/fredoka/Fredoka-Regular.ttf", file: "Fredoka-Regular.ttf", en: "Fredoka" },
  "Nunito": { url: "https://github.com/google/fonts/raw/main/ofl/nunito/Nunito-Regular.ttf", file: "Nunito-Regular.ttf", en: "Nunito" },
  "Caveat": { url: "https://github.com/google/fonts/raw/main/ofl/caveat/Caveat-Regular.ttf", file: "Caveat-Regular.ttf", en: "Caveat" }
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

// Install a font to the per-user Windows fonts dir. No admin needed for
// %LOCALAPPDATA%\Microsoft\Windows\Fonts. Returns true if newly copied,
// false if it already exists (idempotent).
function installFont(file, url, fontId) {
  return new Promise(function (resolve) {
    try {
      mkdirSync(USER_FONTS_DIR, { recursive: true });
      var dest = join(USER_FONTS_DIR, file);
      if (existsSync(dest)) { if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "done", already: true, pct: 100, dest: dest }; resolve({ ok: true, already: true, dest: dest }); return; }
      if (fontId) DOWNLOAD_PROGRESS[fontId] = { state: "started", received: 0, total: 0, pct: 0 };
      downloadTo(url, dest, fontId).then(function () {
        resolve({ ok: true, already: false, dest: dest });
      }).catch(function (e) {
        try { if (existsSync(dest)) { try { require("node:fs").unlinkSync(dest); } catch (eu) {} } } catch (eu2) {}
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
          // bundled font: copy from plugin's fonts dir to user fonts dir
          try {
            mkdirSync(USER_FONTS_DIR, { recursive: true });
            var src = join(FONTS_DIR, info.file);
            var dest = join(USER_FONTS_DIR, info.file);
            if (!existsSync(dest) && existsSync(src)) { copyFileSync(src, dest); }
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, already: existsSync(dest) && existsSync(src) ? false : true, dest: dest, fontId: fontId }));
            return;
          } catch (e) { res.writeHead(500, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, error: String(e) })); return; }
        }
        if (!info.url) { res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, error: "no download url for " + fontId })); return; }
        try {
          var result = await installFont(info.file, info.url, fontId);
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
      req.on("end", function () {
        var body;
        try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch (e) { body = {}; }
        var fileName = body.fileName || "";
        var data = body.data || "";
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
          var fontName = safeName.replace(/\.(ttf|otf)$/i, "");
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: true, dest: dest, fontName: fontName, file: safeName }));
        } catch (e) {
          res.writeHead(500, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: String(e) }));
        }
      });
    }});
    return function () { h1(); h2(); h3(); h4(); h5(); h6(); try { h7(); } catch (e) {} try { h8(); } catch (e) {} try { h9(); } catch (e) {} };
  }, "dsh-font-enhancer: settings routes");
}