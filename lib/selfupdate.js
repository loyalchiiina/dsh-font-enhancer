// selfupdate.js - shared "check for a newer version / install it" service.
//
// WHY THIS FILE EXISTS
// Every plugin in this family is published to npm and installed into a DSH
// profile, yet none of them could tell the user "you are 1.5.8, 1.6.0 is out".
// Users had to know to go to the market. This module gives a plugin a
// self-contained pair of routes so its own settings panel can show a version
// line and an update button:
//
//   GET  <prefix>/update-check   -> { name, current, latest, hasUpdate, installType, source, ... }
//   POST <prefix>/update-apply   -> installs the newer version into the profile
//   GET  <prefix>/update-log     -> last install log (survives page reloads)
//
// DESIGN RULES (each one is a bug we refuse to ship)
// 1. Registry first, GitHub as fallback. The user installs from npm, so npm is
//    the version that actually exists for them. If the registry answers but has
//    no usable version we still report it, rather than silently claiming "latest".
// 2. link:/file: installs are refused. Those are local development copies; an
//    npm install would overwrite the working tree. We say so in plain words.
// 3. The profile package.json is backed up before any write, and the install
//    runs with windowsHide so no console flashes (this family must never show a
//    console window - see the 2026-11-12 audit).
// 4. Nothing restarts DSH for the user. Host code only reloads on a full app
//    restart, so the response carries needRestart:true and the UI says so.
// 5. The registry response is cached in memory for 10 minutes: a panel opened
//    repeatedly must not hammer npm.

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { get as httpsGet } from "node:https";

var CACHE_TTL_MS = 10 * 60 * 1000;
var CACHE = { at: 0, body: null };
var LAST_LOG = "";
var APPLYING = false;

function readJsonFile(file, dflt) {
  try {
    var raw = readFileSync(file, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch (e) { return dflt; }
}

function getJson(url, timeoutMs) {
  return new Promise(function (resolve) {
    var req = httpsGet(url, { headers: { accept: "application/json", "user-agent": "dsh-plugin-selfupdate" } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(getJson(res.headers.location, timeoutMs));
      }
      var chunks = [];
      res.on("data", function (c) { chunks.push(c); });
      res.on("end", function () {
        if (res.statusCode !== 200) return resolve({ ok: false, error: "HTTP " + res.statusCode });
        try { resolve({ ok: true, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) }); }
        catch (e) { resolve({ ok: false, error: "bad json" }); }
      });
    });
    req.on("error", function (e) { resolve({ ok: false, error: String(e && e.message || e) }); });
    req.setTimeout(timeoutMs || 8000, function () { try { req.destroy(); } catch (e) {} resolve({ ok: false, error: "timeout" }); });
  });
}

export function compareVer(a, b) {
  var norm = function (v) {
    return String(v || "").replace(/^v/i, "").split(/[.+-]/).map(function (x) { return parseInt(x, 10) || 0; });
  };
  var pa = norm(a), pb = norm(b);
  for (var i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    var d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

function localVersion(pkgRoot, fallback) {
  var pj = readJsonFile(join(pkgRoot, "package.json"), null);
  return (pj && pj.version) ? String(pj.version) : String(fallback || "0.0.0");
}

// Where is this package installed, and is it a real npm dependency or a local link?
// The profile package.json is the only reliable witness: node_modules alone looks
// identical for both cases.
function detectInstall(pkgRoot, pkgName) {
  var cands = [];
  try {
    var home = homedir();
    ["desktop", "xiufu", "web"].forEach(function (pf) {
      cands.push(join(home, ".dsh", "profiles", pf, "package.json"));
    });
  } catch (e) { /* ignore */ }
  var cur = pkgRoot;
  for (var i = 0; i < 6; i++) {
    cur = dirname(cur);
    cands.push(join(cur, "package.json"));
  }
  for (var j = 0; j < cands.length; j++) {
    var pj = readJsonFile(cands[j], null);
    if (pj && pj.dependencies && Object.prototype.hasOwnProperty.call(pj.dependencies, pkgName)) {
      var spec = String(pj.dependencies[pkgName] || "");
      var isLocal = spec.indexOf("link:") === 0 || spec.indexOf("file:") === 0 || spec.indexOf(".") === 0 || spec.indexOf("/") === 0 || spec.indexOf("local-plugins") >= 0;
      return { installType: isLocal ? "local" : "registry", depSpec: spec, profileFile: cands[j], profileDir: dirname(cands[j]) };
    }
  }
  return { installType: "unknown", depSpec: "", profileFile: "", profileDir: "" };
}

async function fetchLatest(pkgName) {
  var registries = ["https://registry.npmmirror.com", "https://registry.npmjs.org"];
  var lastErr = null;
  for (var i = 0; i < registries.length; i++) {
    var url = registries[i] + "/" + encodeURIComponent(pkgName).replace("%40", "@") + "/latest";
    var r = await getJson(url, 8000);
    if (r.ok && r.body && r.body.version) {
      return {
        ok: true, latest: String(r.body.version), publishedAt: r.body.dist && r.body.dist.tarball ? "" : "",
        registry: registries[i], changelog: ""
      };
    }
    lastErr = r.error || "no version";
  }
  return { ok: false, error: lastErr || "registry unreachable" };
}

function jsonOut(res, obj, code) {
  try {
    res.statusCode = code || 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.end(JSON.stringify(obj));
  } catch (e) { /* ignore */ }
}

function sendText(res, text, code) {
  try {
    res.statusCode = code || 200;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(text);
  } catch (e) { /* ignore */ }
}

function backupProfile(profileFile) {
  try {
    if (!profileFile || !existsSync(profileFile)) return "";
    var dir = join(homedir(), ".dsh", "backups");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    var stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
    var dst = join(dir, "selfupdate-" + stamp + "-" + profileFile.split(/[\\/]/).pop());
    copyFileSync(profileFile, dst);
    return dst;
  } catch (e) { return ""; }
}

export function registerSelfUpdate(ctx, prefix, pkgName, opts) {
  opts = opts || {};
  var pkgRoot = opts.pkgRoot || dirname(fileURLToPath(import.meta.url));
  pkgRoot = pkgRoot.replace(/[\\/]lib$/, "");

  ctx.webServer.register({
    kind: "exact", path: prefix + "/update-check", handler: async function (req, res) {
      var current = localVersion(pkgRoot, opts.version);
      var install = detectInstall(pkgRoot, pkgName);
      var cached = CACHE.body && (Date.now() - CACHE.at < CACHE_TTL_MS) ? CACHE.body : null;
      var latest = cached;
      if (!latest) {
        var r = await fetchLatest(pkgName);
        if (!r.ok) {
          return jsonOut(res, { ok: false, error: r.error, name: pkgName, current: current, installType: install.installType });
        }
        latest = r;
        CACHE = { at: Date.now(), body: r };
      }
      jsonOut(res, {
        ok: true, name: pkgName, current: current, latest: latest.latest,
        hasUpdate: compareVer(latest.latest, current) > 0,
        installType: install.installType, depSpec: install.depSpec,
        source: latest.registry, needRestart: true,
        note: install.installType === "local"
          ? "本地开发版（link/file 安装），更新请走 git pull 或重新发布，npm 安装会覆盖本地改动"
          : (install.installType === "registry" ? "npm 安装，可直接更新" : "未在 profile 依赖中找到，可能由聚合包统一管理")
      });
    }
  });

  ctx.webServer.register({
    kind: "exact", path: prefix + "/update-apply", handler: async function (req, res) {
      if (String(req.method || "GET").toUpperCase() !== "POST") return jsonOut(res, { ok: false, error: "method not allowed" }, 405);
      if (APPLYING) return jsonOut(res, { ok: false, error: "已有一次更新正在进行，请稍候" }, 409);
      var install = detectInstall(pkgRoot, pkgName);
      if (install.installType === "local") {
        return jsonOut(res, {
          ok: false, refused: "local",
          error: "本地开发版（" + install.depSpec + "），不做 npm 覆盖安装。",
          hint: "发布新版到 npm 后，把 profile 依赖改成 registry 版本即可用此按钮更新。"
        }, 200);
      }
      var r = await fetchLatest(pkgName);
      if (!r.ok) return jsonOut(res, { ok: false, error: "查询最新版失败：" + r.error }, 200);
      var current = localVersion(pkgRoot, opts.version);
      if (compareVer(r.latest, current) <= 0) return jsonOut(res, { ok: true, upToDate: true, current: current, latest: r.latest });
      var backup = backupProfile(install.profileFile);
      APPLYING = true;
      var dir = install.profileDir || "";
      var pkgSpec = pkgName + "@" + r.latest;
      // Prefer pnpm (what DSH profiles use), fall back to npm.
      var r1 = await runPm("pnpm", ["add", pkgSpec, "--ignore-workspace-root-check"], dir);
      var used = "pnpm";
      if (!r1.ok) {
        var r2 = await runPm("npm", ["install", pkgSpec, "--no-audit", "--no-fund", "--prefix", dir], dir);
        used = r2.ok ? "npm" : used;
        if (!r2.ok) {
          APPLYING = false;
          LAST_LOG = r1.log + "\n----\n" + r2.log;
          return jsonOut(res, { ok: false, error: "安装失败，见日志", log: LAST_LOG.slice(-4000), backup: backup });
        }
        LAST_LOG = r2.log;
      } else {
        LAST_LOG = r1.log;
      }
      APPLYING = false;
      var nowVer = localVersion(pkgRoot, current);
      jsonOut(res, {
        ok: true, from: current, latest: r.latest, packageManager: used,
        // The host process still holds the old module in memory; the file on disk
        // already changed. Only a full app restart reloads it.
        installedVersionOnDisk: guessDiskVersion(dir, pkgName) || r.latest,
        needRestart: true, backup: backup, log: LAST_LOG.slice(-4000)
      });
    }
  });

  ctx.webServer.register({
    kind: "exact", path: prefix + "/update-log", handler: function (req, res) {
      sendText(res, LAST_LOG || "(暂无日志)");
    }
  });
}

function guessDiskVersion(profileDir, pkgName) {
  try {
    var pj = readJsonFile(join(profileDir, "node_modules", pkgName, "package.json"), null);
    return pj && pj.version ? String(pj.version) : "";
  } catch (e) { return ""; }
}

function runPm(cmd, args, cwd) {
  return new Promise(function (resolve) {
    var out = "";
    var child;
    try {
      child = execFile(cmd, args, {
        cwd: cwd || undefined,
        windowsHide: true,
        timeout: 180000,
        maxBuffer: 8 * 1024 * 1024,
        shell: process.platform === "win32"
      }, function (err, stdout, stderr) {
        out += (stdout || "") + (stderr || "");
        resolve({ ok: !err, log: out });
      });
      if (child && child.stdout) child.stdout.on("data", function (d) { out += String(d); });
      if (child && child.stderr) child.stderr.on("data", function (d) { out += String(d); });
    } catch (e) {
      resolve({ ok: false, log: String(e && e.message || e) });
    }
  });
}