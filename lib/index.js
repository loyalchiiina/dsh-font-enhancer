// dsh-font-enhancer - host half.
// Dual-face plugin (identical mount pattern to the verified dsh-chat-image-lightbox):
// host registers a loopback-only settings/health API so the bundle has a real cordis
// activate (inject=['webServer']); visual work lives in lib/client.js, mounted by the
// client-modules system once the host activates. Works on both web and desktop profiles.
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

var SETTINGS_PREFIX = "/dsh-font-enhancer";
var SETTINGS_STORE = join(homedir(), ".dsh", "data", "dsh-font-enhancer", "settings.json");
var OPERATION_LOG = join(homedir(), ".dsh", "data", "dsh-font-enhancer", "operation.log");

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
    return function () { h1(); h2(); h3(); h4(); h5(); };
  }, "dsh-font-enhancer: settings routes");
}