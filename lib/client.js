window.__ModuleLoader__.load({
  id: "dsh-font-enhancer",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;

    // ---- Word-style font lists (label, css-family) ----
    var EN_FONTS = [
      ["Times New Roman", "Times New Roman"],
      ["Arial", "Arial"],
      ["Calibri", "Calibri"],
      ["Cambria", "Cambria"],
      ["Georgia", "Georgia"],
      ["Verdana", "Verdana"],
      ["Tahoma", "Tahoma"],
      ["Segoe UI", "Segoe UI"],
      ["Garamond", "Garamond"],
      ["Book Antiqua", "Book Antiqua"],
      ["Palatino Linotype", "Palatino Linotype"],
      ["Trebuchet MS", "Trebuchet MS"],
      ["Lucida Sans Unicode", "Lucida Sans Unicode"],
      ["Comic Sans MS", "Comic Sans MS"],
      ["Consolas (mono)", "Consolas"],
      ["Courier New (mono)", "Courier New"],
      ["Impact", "Impact"],
      ["Bahnschrift", "Bahnschrift"]
    ];
    // Simplified-Chinese fonts shipped with Word / Windows.
    // 楷体 (KaiTi) is first so it is both the default and the first option.
    var ZH_FONTS = [
      ["楷体 (KaiTi)", "KaiTi"],
      ["微软雅黑 (Microsoft YaHei)", "Microsoft YaHei"],
      ["宋体 (SimSun)", "SimSun"],
      ["黑体 (SimHei)", "SimHei"],
      ["新宋体 (NSimSun)", "NSimSun"],
      ["仿宋 (FangSong)", "FangSong"],
      ["微软雅黑 Light", "Microsoft YaHei Light"],
      ["等线 (DengXian)", "DengXian"],
      ["等线 Light", "DengXian Light"],
      ["华文细黑 (STXihei)", "STXihei"],
      ["华文宋体 (STSong)", "STSong"],
      ["华文中宋 (STZhongsong)", "STZhongsong"],
      ["华文楷体 (STKaiti)", "STKaiti"],
      ["华文行楷 (STXingkai)", "STXingkai"],
      ["隶书 (LiSu)", "LiSu"],
      ["幼圆 (YouYuan)", "YouYuan"],
      ["方正舒体 (FZShuTi)", "FZShuTi"],
      ["方正姚体 (FZYaoti)", "FZYaoti"]
    ];

    var STORE_KEY = "dsh-font-enhancer";
    // Bump this every time the built-in default region palette changes. A stored
    // settings payload whose `ver` is older than this is treated as stale: the
    // old region colors (e.g. the first cyan/blue scheme) are dropped and the
    // latest DEFAULT_REGIONS() palette is loaded instead. This makes palette
    // refreshes survive a restart without needing the user to clear localStorage.
    var SCHEMA_VERSION = 19;

    // ---------- helpers ----------
    function esc(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
    function clamp(v, lo, hi) {
      v = Number(v);
      if (!isFinite(v)) v = lo;
      return Math.max(lo, Math.min(hi, v));
    }
    function uid() {
      return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }
    function pickWeight() {
      return [400, 500, 600, 700, 800][Math.floor(Math.random() * 5)];
    }
    function randFont(list) {
      return list[Math.floor(Math.random() * list.length)][1];
    }

    // ---------- region model ----------
    function defaultRegion() {
      return {
        id: uid(),
        name: "新区域",
        selector: "body",
        enabled: true,
        en: "Times New Roman",
        zh: "KaiTi",
        size: 15,
        lh: 1.6,
        weight: 400,
        italic: false,
        color: "#FFFFFF",
        useColor: false,
        group: "自定义",
        _open: false
      };
    }
    function normRegion(o) {
      var d = defaultRegion();
      if (!o || typeof o !== "object") return d;
      if (typeof o.id === "string") d.id = o.id;
      d.name = typeof o.name === "string" ? o.name : d.name;
      d.selector = typeof o.selector === "string" ? o.selector : d.selector;
      d.enabled = o.enabled !== false;
      if (typeof o.en === "string") d.en = o.en;
      if (typeof o.zh === "string") d.zh = o.zh;
      d.size = clamp(o.size, 12, 22);
      d.lh = clamp(o.lh, 1.3, 2.2);
      d.weight = clamp(o.weight, 100, 900);
      d.italic = o.italic === true;
      if (typeof o.color === "string") d.color = o.color;
      d.useColor = o.useColor === true;
      if (typeof o.group === "string") d.group = o.group;
      return d;
    }
    function DEFAULT_REGIONS() {
      function mk(o) {
        var d = defaultRegion();
        return Object.assign(d, o);
      }
      // Selectors calibrated against the installed DSH Desktop bundle
      // (packages @deepseek-ai/dsh-client-ui-* in app.asar.unpacked). DSH renders
      // with CSS-Modules hashed classes; the values below are the real container
      // classes for each area. They are editable per card, so if a DSH update
      // re-hashes the classes you can simply re-point them here.
      return [
        // ---- Calibrated against the installed DSH Desktop bundle ----
        // Verified live class names (each dsh-client-ui-* package's lib/client.js
        // exports a semantic->hash map). Used here:
        //   layout:      sidebarCol/.pI_x6G_sidebarCol, detailsCol/.pI_x6G_detailsCol
        //   conversation: root=.wSkVaW_root (whole chat view), composer=.wSkVaW_composer*,
        //                 title/header=.lXshSW_title|header, item=.lXshSW_item,
        //                 crumbs=.wSkVaW_crumb*
        //   sidebar:     brand/logoRow/brandMark/brandName=hHd-Xa_*,
        //                 newSession/newSessionLabel=hHd-Xa_*,
        //                 settingsArea/regionArea/footerActions=hHd-Xa_*
        //   workspace:   projectRow/projectText/sessionRow=YDXeBa_*
        //   taskboard:   sidebar entry row = [data-dsh-atb-entry] (stable attr)
        //
        // Ordering: body (widest) FIRST, then most-specific regions so later
        // rules win the cascade (same specificity, later wins with !important).
        // Never re-add ".pI_x6G_centerCol" — whole middle column, swallows title/
        // composer/token text into one color.
        //
        // whole-UI fallback: right-bottom expand bar + bottom bar
        mk({ name: "底部展开栏", selector: "body", enabled: true, _open: true, useColor: true, color: "#FF0000", group: "其他" }),
        // left workspace navigation column (root pane) — confirmed orange
        mk({ name: "左侧导航栏", selector: ".pI_x6G_sidebarCol, [data-pane=\"sidebar\"]", enabled: true, useColor: true, color: "#FF8000", group: "左侧栏" }),
        // top-left logo / brand (DeepSeek brand mark + name) — confirmed magenta
        mk({ name: "左上角 Logo", selector: ".hHd-Xa_brand, .hHd-Xa_logoRow, .hHd-Xa_brandMark, .hHd-Xa_brandName, .hHd-Xa_brandIdentity", enabled: true, useColor: true, color: "#FF00FF", group: "左侧栏" }),
        // Agent 任务看板 sidebar entry (dsh-taskboard) — confirmed yellow
        mk({ name: "任务看板入口", selector: "[data-dsh-atb-entry], .dsh-atb-entry, .dsh-atb-entry-label, .dsh-atb-entry-icon", enabled: true, useColor: true, color: "#FFFF00", group: "左侧栏" }),
        // "new session" button — used to read as green next to the workspace
        // name; black is the only base color no other region uses and reads
        // clearly on the light sidebar.
        mk({ name: "新会话", selector: ".hHd-Xa_newSession, .hHd-Xa_newSessionLabel", enabled: true, useColor: true, color: "#000000", group: "左侧栏" }),
        // workspace / project names (DSH desktop / DEEPSEEK-chat / deepseekharness) — green
        mk({ name: "工作区名称", selector: ".YDXeBa_projectText, .YDXeBa_projectRow", enabled: true, useColor: true, color: "#00FF00", group: "左侧栏" }),
        // settings area at the BOTTOM of the sidebar (footer only) — confirmed blue
        mk({ name: "设置区域", selector: ".hHd-Xa_settingsArea, .hHd-Xa_footerActions", enabled: true, useColor: true, color: "#0000FF", group: "左侧栏" }),
        // conversation messages (chat body) — confirmed white
        mk({ name: "对话区消息", selector: ".wSkVaW_root, .lXshSW_root", enabled: true, useColor: true, color: "#FFFFFF", group: "对话区" }),
        // conversation top title — session title text; unified cyan together with
        // the agent/model names per user decision
        mk({ name: "对话栏名称", selector: ".lXshSW_title, .lXshSW_header, .wSkVaW_crumb, .wSkVaW_crumbs", enabled: true, useColor: true, color: "#00FFFF", group: "对话区" }),
        // composer / input — confirmed pink; scoped narrowly (no textarea/
        // [contenteditable] wildcards or they bleed onto the turn indicator/code)
        mk({ name: "输入区", selector: ".wSkVaW_composerStack, .wSkVaW_composerSeat", enabled: true, useColor: true, color: "#FF69B4", group: "对话区" }),
        // 会话页签（对话/轨迹）above the input — verified wSkVaW_ hashes
        mk({ name: "会话页签", selector: ".wSkVaW_tabs, .wSkVaW_tab, .wSkVaW_tabActive", enabled: true, useColor: true, color: "#808080", group: "对话区" }),
        // 对话轮次指示 = the stats line BELOW the input (17 轮 · N 步 | LLM … |
        // 工具调用 … | 缓存命中 …) — StatsLine module FJxK0a_*. Must come after
        // 输入区 so it beats the pink composer descendants at equal specificity.
        mk({ name: "对话轮次指示", selector: ".FJxK0a_root, .FJxK0a_sep, .Md3f7G_turnStatus, .Md3f7G_turnStatusClock", enabled: true, useColor: true, color: "#FF8000", group: "对话区" }),
        // 智慧体/模型名称 — preset agent name right of the title.
        // Structural probe: paint everything in the header row EXCEPT the
        // crumbs subtree. :not(complex) is fine in Chromium; specificity
        // (0,2,0) beats the white root rule.
        mk({ name: "智慧体/模型名称", selector: ".wSkVaW_header :not(.wSkVaW_crumbs):not(.wSkVaW_crumbs *), .wSkVaW_crumbSubagent, .ZKlsPq_trigger, .ZKlsPq_switcherTrigger, .ZKlsPq_switcherTitle, ._7KE1Ra_trigger, ._7KE1Ra_triggerLabel, ._7KE1Ra_modelName", enabled: true, useColor: true, color: "#00FFFF", group: "对话区" }),
        // right extension / details column — panel is collapsed by default and
        // falls through to the body-red fallback; keep red so the list matches
        // what the user actually sees.
        mk({ name: "右侧扩展栏", selector: ".pI_x6G_detailsCol", enabled: true, useColor: true, color: "#FF0000", group: "其他" }),
        // code blocks — ancestor-prefixed forms out-specify ".wSkVaW_root *"
        // (the white message rule), so blue wins regardless of order
        mk({ name: "代码块", selector: "pre, code, .wSkVaW_root pre, .wSkVaW_root code, .lXshSW_root pre, .lXshSW_root code", enabled: true, useColor: true, color: "#0000FF", group: "对话区" })
      ];
    }

    function normThemes(o) {
      if (!o || !Array.isArray(o.themes)) return [];
      return o.themes.filter(function (t) {
        return t && typeof t.name === "string" && t.recipe && typeof t.recipe === "object";
      });
    }
    function normUnified(o) {
      var u = { uc: { enabled: false, color: "#FFFFFF" }, uf: { enabled: false, en: "Times New Roman", zh: "KaiTi", size: 15 } };
      if (!o || !o.unified || typeof o.unified !== "object") return u;
      var s = o.unified;
      if (s.uc && typeof s.uc === "object") {
        u.uc.enabled = s.uc.enabled === true;
        if (typeof s.uc.color === "string") u.uc.color = s.uc.color;
      }
      if (s.uf && typeof s.uf === "object") {
        u.uf.enabled = s.uf.enabled === true;
        if (typeof s.uf.en === "string") u.uf.en = s.uf.en;
        if (typeof s.uf.zh === "string") u.uf.zh = s.uf.zh;
        u.uf.size = clamp(s.uf.size, 12, 22);
      }
      return u;
    }
    function loadSettings() {
      try {
        var raw = localStorage.getItem(STORE_KEY);
        if (!raw) return { regions: DEFAULT_REGIONS(), themes: [], unified: normUnified(null), bx: null, by: null };
        var o = JSON.parse(raw);
        var themes = normThemes(o);
        var unified = normUnified(o);
        if (o && (typeof o.ver !== "number" || o.ver < SCHEMA_VERSION)) {
          // Version bump: write back fresh region palette but KEEP themes &
          // unified settings so users don't lose their saved themes.
          var fresh = { regions: DEFAULT_REGIONS(), themes: themes, unified: unified, ver: SCHEMA_VERSION };
          if (typeof o.bx === "number") fresh.bx = o.bx;
          if (typeof o.by === "number") fresh.by = o.by;
          localStorage.setItem(STORE_KEY, JSON.stringify(fresh));
          return { regions: DEFAULT_REGIONS(), themes: themes, unified: unified, bx: typeof o.bx === "number" ? o.bx : null, by: typeof o.by === "number" ? o.by : null };
        }
        if (o && Array.isArray(o.regions)) {
          return {
            regions: o.regions.map(normRegion),
            themes: themes,
            unified: unified,
            bx: typeof o.bx === "number" ? o.bx : null,
            by: typeof o.by === "number" ? o.by : null
          };
        }
        var g = defaultRegion();
        g.selector = "body";
        g.name = "全局界面（整站兜底）";
        g.enabled = true;
        g._open = true;
        if (typeof o.en === "string") g.en = o.en;
        if (typeof o.zh === "string") g.zh = o.zh;
        g.size = clamp(o.size, 12, 22);
        g.lh = clamp(o.lh, 1.3, 2.2);
        g.weight = clamp(o.weight, 100, 900);
        g.italic = o.italic === true;
        return { regions: [g], themes: themes, unified: unified, bx: typeof o.bx === "number" ? o.bx : null, by: typeof o.by === "number" ? o.by : null };
      } catch (e) {
        return { regions: DEFAULT_REGIONS(), themes: [], unified: normUnified(null), bx: null, by: null };
      }
    }
    function saveSettings(data) {
      try {
        data.ver = SCHEMA_VERSION;
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
      } catch (e) {}
    }

    // ---------- CSS generation ----------
    // No blanket descendant diffusion. Every region is scoped to its own
    // text-bearing nodes only (the element itself + its direct inline/block
    // text wrappers). This is what stops one region's rule from painting the
    // children that belong to a SIBLING region (the previous withDesc() made
    // every region apply "sel *" over all descendants, so body/sidebarCol
    // recoloured every nested label and the regions bled into each other).
    function withText(sel) {
      return sel
        .split(",")
        .map(function (s) {
          s = s.trim();
          // body * 会匹配所有元素（包括输入框），用 !important 覆盖字号可能
          // 破坏交互区域布局。body 只染 body 本身和 SVG text 元素就够了。
          if (s === "body") return "body, body text";
          return s + ", " + s + " *, " + s + " text";
        })
        .join(", ");
    }
    function buildRegionCss(r) {
      var sel = (r.selector || "").trim();
      if (!sel) return "";
      var fam = '"' + r.en + '","' + r.zh + '",sans-serif';
      var style = r.italic ? "italic" : "normal";
      var scope = withText(sel);
      var lines = [
        scope + " {",
        "  font-family: " + fam + " !important;",
        "  font-weight: " + r.weight + " !important;",
        "  font-style: " + style + " !important;"
      ];
      if (r.useColor && r.color) lines.push("  color: " + r.color + " !important;");
      lines.push("  font-size: " + r.size + "px !important;");
      lines.push("  line-height: " + r.lh + " !important;");
      lines.push("}");
      return lines.join("\n");
    }
    function applyAll(regions) {
      var u = state.unified || { uc: { enabled: false }, uf: { enabled: false } };
      var css = regions
        .filter(function (r) {
          return r.enabled;
        })
        .map(function (r) {
          // apply unified overrides without mutating the region objects
          var tmp = {
            selector: r.selector,
            en: u.uf.enabled ? u.uf.en : r.en,
            zh: u.uf.enabled ? u.uf.zh : r.zh,
            size: u.uf.enabled ? u.uf.size : r.size,
            weight: r.weight,
            italic: r.italic,
            lh: r.lh,
            useColor: u.uc.enabled || r.useColor,
            color: u.uc.enabled ? u.uc.color : r.color
          };
          return buildRegionCss(tmp);
        })
        .join("\n\n");
      var tag = document.getElementById("dsh-font-enhancer-style");
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "dsh-font-enhancer-style";
        tag.dataset.plugin = "dsh-font-enhancer";
        document.head.appendChild(tag);
      }
      tag.textContent = css;
    }

    function optionsHtml(list, selected) {
      return list
        .map(function (f) {
          var sel = f[1] === selected ? " selected" : "";
          return '<option value="' + esc(f[1]) + '"' + sel + ">" + esc(f[0]) + "</option>";
        })
        .join("");
    }

    // ---------- panel styles — premium dark design-tool aesthetic ----------
    function panelCss() {
      return [
        "#dsh-fe-root *{box-sizing:border-box;scrollbar-width:thin}",
        "",
        "/* ── toggle button — gem-like floating orb ── */",
        "#dsh-fe-toggle{position:fixed;left:auto;top:auto;right:18px;bottom:18px;z-index:2147483600;width:48px;height:48px;border-radius:50%;border:0;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.15),rgba(40,44,54,.95) 70%);color:#eef0f4;font-size:22px;font-weight:700;cursor:grab;user-select:none;touch-action:none;box-shadow:0 4px 24px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.15);backdrop-filter:blur(12px);transition:box-shadow .25s,transform .2s;text-shadow:0 1px 4px rgba(0,0,0,.4);line-height:48px;text-align:center}",
        "#dsh-fe-toggle:hover{box-shadow:0 6px 32px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.2);transform:scale(1.06)}",
        "#dsh-fe-toggle.dsh-fe-dragging{cursor:grabbing;transform:scale(1.12);box-shadow:0 8px 40px rgba(0,0,0,.8)}",
        "",
        "/* ── panel root — deep glass studio ── */",
        "#dsh-fe-panel{position:fixed;left:18px;top:18px;z-index:2147483600;width:348px;max-width:calc(100vw - 36px);max-height:86vh;overflow-y:auto;overflow-x:hidden;color:#e6e6e6;border-radius:20px;padding:20px;font:13px/1.5 KaiTi,'Microsoft YaHei',sans-serif;background:rgba(16,18,22,.85);border:1px solid rgba(255,255,255,.08);box-shadow:0 20px 60px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}",
        "#dsh-fe-panel::-webkit-scrollbar{width:3px}",
        "#dsh-fe-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:3px}",
        "#dsh-fe-panel::-webkit-scrollbar-track{background:transparent}",
        "#dsh-fe-root,#dsh-fe-root *{font-family:KaiTi,'Microsoft YaHei',sans-serif!important;font-size:13px!important;line-height:1.5!important}",
        "",
        "/* ── panel header ── */",
        "#dsh-fe-panel .dsh-fe-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.06)}",
        "#dsh-fe-panel .dsh-fe-header .dsh-fe-hl{display:flex;flex-direction:column;gap:2px}",
        "#dsh-fe-panel .dsh-fe-header h4{margin:0;font-size:16px;font-weight:700;letter-spacing:0;color:#f0f2f5;line-height:1.2}",
        "#dsh-fe-panel .dsh-fe-header .dsh-fe-sub{font-size:11px;color:#6b7280;font-weight:400;letter-spacing:.01em}",
        "#dsh-fe-close{border:0;background:rgba(255,255,255,.06);color:#8b93a1;border-radius:8px;padding:5px 11px;font-size:14px;cursor:pointer;line-height:1.3;transition:all .15s;flex-shrink:0;margin-top:2px}",
        "#dsh-fe-close:hover{background:rgba(255,255,255,.13);color:#e6e6e6}",
        "",
        "/* ── theme bar ── */",
        "#dsh-fe-themeblock{display:flex;gap:5px;margin-bottom:14px;padding:10px 12px;background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.01));border-radius:12px;align-items:center;border:1px solid rgba(255,255,255,.05)}",
        "#dsh-fe-themeblock select{flex:1;min-width:0;padding:5px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.35);color:#e6e6e6;font:inherit;font-size:12px;appearance:none;-webkit-appearance:none;background-image:url(\"data:image/svg+xml,%3Csvg width='8' height='6' viewBox='0 0 8 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L4 4.5L7 1.5' stroke='%238b93a1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 8px center;padding-right:28px;cursor:pointer;transition:border-color .15s}",
        "#dsh-fe-themeblock select:focus{border-color:rgba(106,166,255,.5);outline:0}",
        "#dsh-fe-themeblock button{padding:5px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#cfd4dc;cursor:pointer;font:inherit;font-size:12px;white-space:nowrap;transition:all .15s;flex-shrink:0}",
        "#dsh-fe-themeblock button:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2)}",
        "",
        "/* ── toolbar ── */",
        "#dsh-fe-toolbar{display:flex;gap:5px;margin-bottom:14px}",
        "#dsh-fe-toolbar button{flex:1;padding:8px 0;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#cfd4dc;cursor:pointer;font:inherit;font-size:12px;font-weight:500;transition:all .18s;letter-spacing:.01em}",
        "#dsh-fe-toolbar button:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);transform:translateY(-1px)}",
        "#dsh-fe-toolbar button:active{transform:translateY(0)}",
        "#dsh-fe-toolbar .dsh-fe-btn-accent{border-color:rgba(106,166,255,.3);background:linear-gradient(135deg,rgba(106,166,255,.12),rgba(106,166,255,.06));color:#8ab8ff;text-shadow:0 0 12px rgba(106,166,255,.2)}",
        "#dsh-fe-toolbar .dsh-fe-btn-accent:hover{background:linear-gradient(135deg,rgba(106,166,255,.2),rgba(106,166,255,.1));border-color:rgba(106,166,255,.5);box-shadow:0 0 20px rgba(106,166,255,.08)}",
        "",
        "/* ── unified controls ── */",
        "#dsh-fe-unified{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px 12px;margin-bottom:12px}",
        "#dsh-fe-unified .dsh-fe-u-row{display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap}",
        "#dsh-fe-unified .dsh-fe-u-row:last-child{margin-bottom:0}",
        "#dsh-fe-unified label{font-size:11px;color:#8b93a1;display:flex;align-items:center;gap:4px;cursor:pointer;font-weight:500}",
        "#dsh-fe-unified label input[type=checkbox]{accent-color:#6aa6ff;width:14px;height:14px;margin:0}",
        "#dsh-fe-unified select,#dsh-fe-unified input[type=color],#dsh-fe-unified input[type=number]{padding:3px 6px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.35);color:#e6e6e6;font:inherit;font-size:11px;font-family:KaiTi,'Microsoft YaHei',sans-serif!important;transition:border-color .15s}",
        "#dsh-fe-unified select:focus,#dsh-fe-unified input:focus{border-color:rgba(106,166,255,.45);outline:0}",
        "#dsh-fe-unified input[type=color]{width:28px;height:22px;padding:0;cursor:pointer}",
        "#dsh-fe-unified input[type=number]{width:48px}",
        "#dsh-fe-unified .dsh-fe-u-label{font-size:10px;color:#6b7280;font-weight:600;letter-spacing:.03em;text-transform:uppercase;margin-right:2px;flex-basis:100%}",
        "",
        "/* ── card ── */",
        "#dsh-fe-card{border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:12px 14px;margin-bottom:8px;background:linear-gradient(135deg,rgba(255,255,255,.035),rgba(255,255,255,.015));transition:all .2s}",
        "#dsh-fe-card:hover{border-color:rgba(255,255,255,.12);background:linear-gradient(135deg,rgba(255,255,255,.055),rgba(255,255,255,.025));box-shadow:0 2px 12px rgba(0,0,0,.15)}",
        "#dsh-fe-card-head{display:flex;align-items:center;gap:8px;justify-content:space-between}",
        "#dsh-fe-head-left{display:flex;align-items:center;gap:6px;flex:1;min-width:0}",
        "#dsh-fe-head-right{display:flex;align-items:center;gap:4px;flex-shrink:0}",
        "#dsh-fe-card-head .dsh-fe-cb{display:flex;align-items:center;cursor:pointer;flex-shrink:0;width:18px;height:18px;justify-content:center}",
        "#dsh-fe-card-head .dsh-fe-cb input{accent-color:#6aa6ff;width:15px;height:15px;cursor:pointer;margin:0;transition:transform .15s}",
        "#dsh-fe-card-head .dsh-fe-cb input:checked{transform:scale(1.18)}",
        "#dsh-fe-card-head input[type=text]{flex:1;min-width:0;padding:4px 8px;border-radius:7px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.35);color:#e6e6e6;font:inherit;font-size:12px;font-weight:500;transition:all .15s}",
        "#dsh-fe-card-head input[type=text]:focus{border-color:rgba(106,166,255,.45);background:rgba(0,0,0,.45);outline:0;box-shadow:0 0 0 3px rgba(106,166,255,.08)}",
        "#dsh-fe-card-head button{border:0;background:rgba(255,255,255,.05);color:#8b93a1;border-radius:6px;padding:3px 7px;cursor:pointer;font-size:11px;transition:all .15s;flex-shrink:0;font-weight:500}",
        "#dsh-fe-card-head button:hover{background:rgba(255,255,255,.13);color:#e6e6e6}",
        "#dsh-fe-card-head .dsh-fe-del{color:#8b6c6c;font-size:13px;padding:4px 7px}",
        "#dsh-fe-card-head .dsh-fe-del:hover{color:#d47a7a;background:rgba(200,80,80,.15)}",
        "#dsh-fe-enb{display:flex;align-items:center;gap:4px;color:#8b93a1;font-size:11px;white-space:nowrap;cursor:pointer;padding:3px 7px;border-radius:6px;transition:all .15s;font-weight:500}",
        "#dsh-fe-enb:hover{background:rgba(255,255,255,.06);color:#b9bfc9}",
        "#dsh-fe-enb input{accent-color:#6aa6ff;width:13px;height:13px;margin:0}",
        "#dsh-fe-dot{width:18px;height:18px;border-radius:50%;flex:none;border:2px solid rgba(255,255,255,.2);background:#888;transition:all .25s;box-shadow:0 0 8px rgba(0,0,0,.2)}",
        "#dsh-fe-card:hover #dsh-fe-dot{border-color:rgba(255,255,255,.35);transform:scale(1.05)}",
        "",
        "/* ── card body ── */",
        "#dsh-fe-card-body{display:flex;gap:12px;border-top:1px solid rgba(255,255,255,.05);margin-top:9px;padding-top:9px;animation:dsh-fe-fadeIn .18s ease}",
        "@keyframes dsh-fe-fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}",
        "#dsh-fe-body-col{flex:1;min-width:0}",
        "#dsh-fe-body-col label{display:block;margin:6px 0 3px;color:#8b93a1;font-size:10px;font-weight:600;letter-spacing:.03em;text-transform:uppercase}",
        "#dsh-fe-body-col select,#dsh-fe-body-col input[type=text],#dsh-fe-body-col input[type=number]{width:100%;padding:4px 8px;border-radius:7px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.35);color:#e6e6e6;font:inherit;font-size:12px;transition:all .15s}",
        "#dsh-fe-body-col select:focus,#dsh-fe-body-col input:focus{border-color:rgba(106,166,255,.45);outline:0;box-shadow:0 0 0 3px rgba(106,166,255,.08)}",
        "#dsh-fe-row{display:flex;gap:6px}",
        "#dsh-fe-row>div{flex:1;min-width:0}",
        "#dsh-fe-weightrow{margin-top:5px}",
        "#dsh-fe-weightrow label{display:flex;justify-content:space-between;align-items:center;margin:0}",
        "#dsh-fe-weight-val{color:#8b93a1;font-weight:500}",
        "#dsh-fe-panel input[type=range]{width:100%;margin-top:5px;accent-color:#6aa6ff;height:3px;border-radius:2px;cursor:pointer}",
        "#dsh-fe-italicrow,#dsh-fe-colorrow{display:flex;align-items:center;gap:6px;margin-top:6px;color:#8b93a1;font-size:12px;cursor:pointer;padding:3px 0;border-radius:6px;transition:all .15s}",
        "#dsh-fe-italicrow:hover,#dsh-fe-colorrow:hover{color:#b9bfc9}",
        "#dsh-fe-italicrow input,#dsh-fe-colorrow input{accent-color:#6aa6ff;width:14px;height:14px;margin:0}",
        "#dsh-fe-colorrow input[type=color]{width:38px;height:28px;padding:0;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#1b1d22;cursor:pointer;transition:border-color .15s}",
        "#dsh-fe-colorrow input[type=color]:hover{border-color:rgba(255,255,255,.25)}",
        "",
        "/* ── hint ── */",
        "#dsh-fe-hint{margin-top:12px;font-size:10px;color:#6b7280;line-height:1.6;padding:10px 12px;background:rgba(255,255,255,.02);border-radius:10px;border:1px solid rgba(255,255,255,.04)}",
        "",
        "/* ── toast ── */",
        "#dsh-fe-toast{position:fixed;left:50%;bottom:72px;z-index:2147483601;transform:translateX(-50%);padding:8px 18px;border-radius:10px;font:12px/1.4 KaiTi,'Microsoft YaHei',sans-serif;background:rgba(0,0,0,.85);border:1px solid rgba(255,255,255,.12);box-shadow:0 4px 20px rgba(0,0,0,.5);pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap;color:#e6e6e6}",
        "#dsh-fe-toast.dsh-fe-toast-ok{color:#7bc97b;border-color:rgba(123,201,123,.3)}",
        "#dsh-fe-toast.dsh-fe-toast-err{color:#e08080;border-color:rgba(224,128,128,.3)}",
        "#dsh-fe-toast.dsh-fe-toast-show{opacity:1}"
      ].join("\n");
    }

    // ---------- state ----------
    var state = loadSettings();
    var regions = state.regions;
    var root = null;
    var panel = null;
    var cardsEl = null;

    function findRegion(id) {
      for (var i = 0; i < regions.length; i++) if (regions[i].id === id) return regions[i];
      return null;
    }
    function getThemes() {
      return Array.isArray(state.themes) ? state.themes : [];
    }
    function persist() {
      saveSettings({ regions: regions, themes: getThemes(), unified: state.unified, bx: state.bx, by: state.by });
    }
    function showToast(msg, type) {
      var t = document.getElementById("dsh-fe-toast");
      if (!t) return;
      t.textContent = msg;
      t.className = "dsh-fe-toast" + (type === "ok" ? " dsh-fe-toast-ok" : type === "err" ? " dsh-fe-toast-err" : "") + " dsh-fe-toast-show";
      clearTimeout(t._hide);
      t._hide = setTimeout(function () { t.className = "dsh-fe-toast"; }, 2500);
    }
    function reloadPlugin() {
      try {
        var r = document.getElementById("dsh-fe-root");
        if (r) r.remove();
        var pc = document.getElementById("dsh-fe-panel-css");
        if (pc) pc.remove();
        var st = document.getElementById("dsh-font-enhancer-style");
        if (st) st.remove();
        buildUI();
        showToast("插件已刷新", "ok");
      } catch (e) {}
    }
    // Random vivid colors with golden-angle hue stepping so simultaneous picks
    // land far apart on the color wheel.
    function randVivid(i) {
      var h = Math.floor((i * 137.508 + Math.random() * 40) % 360);
      return "hsl(" + h + ", 95%, 62%)";
    }
    function randomizeFonts(rid) {
      var r = findRegion(rid);
      if (!r) return;
      r.en = randFont(EN_FONTS);
      r.zh = randFont(ZH_FONTS);
      renderCards();
      applyAll(regions);
      persist();
    }
    function randomizeColor(rid) {
      var r = findRegion(rid);
      if (!r) return;
      r.useColor = true;
      r.color = randVivid(0);
      renderCards();
      applyAll(regions);
      persist();
    }
    function randomizeAllFonts() {
      // 统一字体开着时，随机统一字体值（视觉立即可见），否则随机各区域
      if (state.unified.uf.enabled) {
        state.unified.uf.en = randFont(EN_FONTS);
        state.unified.uf.zh = randFont(ZH_FONTS);
        var se = root.querySelector("#dsh-fe-u-en");
        var sz = root.querySelector("#dsh-fe-u-zh");
        if (se) se.value = state.unified.uf.en;
        if (sz) sz.value = state.unified.uf.zh;
        applyAll(regions);
        persist();
        return;
      }
      regions.forEach(function (r) {
        if (!r.enabled) return;
        r.en = randFont(EN_FONTS);
        r.zh = randFont(ZH_FONTS);
      });
      renderCards();
      applyAll(regions);
      persist();
    }
    function randomizeAllColors() {
      // 统一颜色开着时，随机统一颜色值（视觉立即可见），否则随机各区域
      if (state.unified.uc.enabled) {
        state.unified.uc.color = randVivid(0);
        var pc = root.querySelector("#dsh-fe-u-color-val");
        if (pc) pc.value = state.unified.uc.color;
        applyAll(regions);
        persist();
        return;
      }
      var i = 0;
      regions.forEach(function (r) {
        if (!r.enabled) return;
        r.useColor = true;
        r.color = randVivid(i++);
      });
      renderCards();
      applyAll(regions);
      persist();
    }
    function renderThemeSel() {
      var sel = root ? root.querySelector("#dsh-fe-theme-sel") : null;
      var inp = root ? root.querySelector("#dsh-fe-theme-name") : null;
      if (!sel) return;
      var opts = '<option value="">— 选择主题 —</option>';
      getThemes().forEach(function (t) {
        opts += '<option value="' + t.name.replace(/"/g, "&quot;") + '">' + esc(t.name) + "</option>";
      });
      sel.innerHTML = opts;
      // auto-fill the name input with the default name
      if (inp) inp.value = "主题 " + (getThemes().length + 1);
    }
    function saveTheme() {
      var inp = root.querySelector("#dsh-fe-theme-name");
      var name = inp ? String(inp.value).trim() : "";
      if (!name) { showToast("请先在上方输入框填写主题名称", "err"); return; }
      var recipe = {};
      regions.forEach(function (r) {
        recipe[r.name] = {
          en: r.en, zh: r.zh, size: r.size, lh: r.lh,
          weight: r.weight, italic: r.italic === true,
          color: r.color, useColor: r.useColor === true
        };
      });
      var th = getThemes();
      // 只新增或覆盖同名主题，绝不删除其他主题
      var found = false;
      for (var i = 0; i < th.length; i++) {
        if (th[i].name === name) { th[i].recipe = recipe; th[i].ts = Date.now(); found = true; break; }
      }
      if (!found) th.push({ name: name, recipe: recipe, ts: Date.now() });
      state.themes = th;
      renderThemeSel();
      persist();
      var sel = root.querySelector("#dsh-fe-theme-sel");
      if (sel) sel.value = name;
      showToast("已保存：" + name, "ok");
    }
    function themeRename() {
      var sel = root.querySelector("#dsh-fe-theme-sel");
      var oldName = sel && sel.value;
      if (!oldName) { showToast("请先在下拉框选择要重命名的主题", "err"); return; }
      var inp = root.querySelector("#dsh-fe-theme-name");
      var newName = inp ? String(inp.value).trim() : "";
      if (!newName) { showToast("请先在上方输入框填写新名称", "err"); return; }
      if (oldName === newName) { showToast("新名称与旧名称相同", "err"); return; }
      var th = getThemes();
      var oldRecipe = null;
      var found = -1;
      for (var i = 0; i < th.length; i++) {
        if (th[i].name === oldName) { oldRecipe = th[i].recipe; found = i; break; }
      }
      if (!oldRecipe) { showToast("未找到原主题数据", "err"); return; }
      th.splice(found, 1);
      var found2 = false;
      for (var j = 0; j < th.length; j++) {
        if (th[j].name === newName) { th[j].recipe = oldRecipe; th[j].ts = Date.now(); found2 = true; break; }
      }
      if (!found2) th.push({ name: newName, recipe: oldRecipe, ts: Date.now() });
      state.themes = th;
      renderThemeSel();
      persist();
      if (sel) sel.value = newName;
      showToast("已重命名：" + oldName + " → " + newName, "ok");
    }
    function applyTheme() {
      var sel = root.querySelector("#dsh-fe-theme-sel");
      var name = sel && sel.value;
      if (!name) { showToast("请先在下拉框选择要应用的主题", "err"); return; }
      var t = null;
      getThemes().forEach(function (x) { if (x.name === name) t = x; });
      if (!t) { showToast("未找到主题数据，请重新保存", "err"); return; }
      var matched = 0;
      regions.forEach(function (r) {
        var rc = t.recipe[r.name];
        if (rc) {
          matched++;
          r.en = rc.en; r.zh = rc.zh; r.size = rc.size; r.lh = rc.lh;
          r.weight = rc.weight; r.italic = rc.italic === true;
          r.color = rc.color; r.useColor = rc.useColor === true;
        }
      });
      // 应用主题时自动关闭统一颜色和统一字体，以免覆盖
      if (state.unified.uc.enabled) {
        state.unified.uc.enabled = false;
        var ucEl = root.querySelector("#dsh-fe-u-color");
        if (ucEl) ucEl.checked = false;
      }
      if (state.unified.uf.enabled) {
        state.unified.uf.enabled = false;
        var ufEl = root.querySelector("#dsh-fe-u-font");
        if (ufEl) ufEl.checked = false;
      }
      renderCards();
      applyAll(regions);
      persist();
      if (matched === 0) { showToast("主题 " + name + " 已应用（无匹配区域）", "ok"); return; }
      showToast("已应用主题：" + name + "（" + matched + "个区域）", "ok");
    }
    function deleteTheme() {
      var sel = root.querySelector("#dsh-fe-theme-sel");
      var name = sel && sel.value;
      if (!name) return;
      state.themes = getThemes().filter(function (x) { return x.name !== name; });
      renderThemeSel();
      persist();
      showToast("已删除：" + name, "ok");
    }

    // ---------- render region cards ----------
    function cardHtml(r) {
      var body = "";
      if (r.enabled) {
        body =
          '<div class="dsh-fe-card-body">' +
          '<div class="dsh-fe-body-col">' +
          "<label>英文字体</label><select data-rid='" + r.id + "' data-fld='en'>" + optionsHtml(EN_FONTS, r.en) + "</select>" +
          "<label>中文字体</label><select data-rid='" + r.id + "' data-fld='zh'>" + optionsHtml(ZH_FONTS, r.zh) + "</select>" +
          "</div>" +
          '<div class="dsh-fe-body-col">' +
          '<div class="dsh-fe-row"><div><label>字号</label><input type="number" min="12" max="22" step="1" data-rid="' + r.id + '" data-fld="size" value="' + r.size + '"></div>' +
          '<div><label>行距</label><input type="number" min="1.3" max="2.2" step="0.1" data-rid="' + r.id + '" data-fld="lh" value="' + r.lh + '"></div></div>' +
          '<div class="dsh-fe-weightrow"><label>字重 <span data-rid="' + r.id + '" data-fld="weightVal">' + r.weight + "</span></label>" +
          '<input type="range" min="100" max="900" step="100" data-rid="' + r.id + '" data-fld="weight" value="' + r.weight + '"></div>' +
          '<label class="dsh-fe-italicrow"><input type="checkbox" data-rid="' + r.id + '" data-fld="italic"' + (r.italic ? " checked" : "") + "> 斜体</label>" +
          '<label class="dsh-fe-colorrow"><input type="checkbox" data-rid="' + r.id + '" data-fld="useColor"' + (r.useColor ? " checked" : "") + "> 文字颜色</label>" +
          '<input type="color" data-rid="' + r.id + '" data-fld="color" value="' + esc(r.color || "#e6e6e6") + '">' +
          "</div>" +
          "</div>";
      }
      return (
        '<div class="dsh-fe-card" data-card="' + r.id + '">' +
        '<div class="dsh-fe-card-head">' +
        '<div class="dsh-fe-head-left">' +
        '<label class="dsh-fe-cb"><input type="checkbox" data-rid="' + r.id + '" data-fld="enabled"' + (r.enabled ? " checked" : "") + "></label>" +
        '<span class="dsh-fe-dot" data-dot="' + r.id + '" style="background:' + esc(r.color || "#888") + '"></span>' +
        '<input type="text" data-rid="' + r.id + '" data-fld="name" value="' + esc(r.name) + '" title="区域名称">' +
        "</div>" +
        '<div class="dsh-fe-head-right">' +
        '<button type="button" data-rid="' + r.id + '" data-act="randomFont" title="随机字体">🎲字体</button>' +
        '<button type="button" data-rid="' + r.id + '" data-act="randomColor" title="随机颜色">🎨颜色</button>' +
        '<button type="button" data-rid="' + r.id + '" data-act="reset" title="重置本区域">⟳</button>' +
        '<button type="button" data-rid="' + r.id + '" data-act="delete" title="删除区域">✕</button>' +
        "</div>" +
        "</div>" +
        body +
        "</div>"
      );
    }
    function renderCards() {
      if (!cardsEl) return;
      cardsEl.innerHTML = regions
        .map(cardHtml)
        .join("");
    }

    // ---------- build UI ----------
    function buildUI() {
      if (document.getElementById("dsh-fe-root")) return;
      if (!document.body) return;

      var pc = document.createElement("style");
      pc.id = "dsh-fe-panel-css";
      pc.dataset.plugin = "dsh-font-enhancer";
      pc.textContent = panelCss();
      document.head.appendChild(pc);

      root = document.createElement("div");
      root.id = "dsh-fe-root";
      root.innerHTML =
        '<button id="dsh-fe-toggle" type="button" title="字体区域设置 Font settings">Aa</button>' +
        '<div id="dsh-fe-panel" style="display:none">' +
        '<div class="dsh-fe-header"><div class="dsh-fe-hl"><h4>字体区域设置</h4><div class="dsh-fe-sub">每个区域独立调字体/颜色</div></div><button id="dsh-fe-close" type="button" title="关闭">✕</button></div>' +
        '<div class="dsh-fe-themeblock">' +
        '<select id="dsh-fe-theme-sel"></select>' +
        '<input type="text" id="dsh-fe-theme-name" placeholder="主题名" style="width:60px;padding:4px 6px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.35);color:#e6e6e6;font:inherit;font-size:11px">' +
        '<button type="button" data-act="themeSave" title="保存当前设置为选中主题">💾存</button>' +
        '<button type="button" data-act="themeRename" title="重命名所选主题为输入框的名字">✏改</button>' +
        '<button type="button" data-act="themeApply" title="应用选中主题">应用</button>' +
        '<button type="button" data-act="themeDel" title="删除选中主题">🗑</button>' +
        "</div>" +
        '<div class="dsh-fe-unified" id="dsh-fe-unified">' +
        '<div class="dsh-fe-u-row">' +
        '<span class="dsh-fe-u-label">全局统一</span>' +
        "</div>" +
        '<div class="dsh-fe-u-row">' +
        '<label><input type="checkbox" id="dsh-fe-u-color" data-u="uc" data-u-fld="enabled">统一颜色</label>' +
        '<input type="color" id="dsh-fe-u-color-val" data-u="uc" data-u-fld="color" value="#FFFFFF">' +
        "</div>" +
        '<div class="dsh-fe-u-row">' +
        '<label><input type="checkbox" id="dsh-fe-u-font" data-u="uf" data-u-fld="enabled">统一字体</label>' +
        '<select id="dsh-fe-u-en" data-u="uf" data-u-fld="en" style="min-width:80px">' + optionsHtml(EN_FONTS, "Times New Roman") + "</select>" +
        '<select id="dsh-fe-u-zh" data-u="uf" data-u-fld="zh" style="min-width:70px">' + optionsHtml(ZH_FONTS, "KaiTi") + "</select>" +
        '<input type="number" id="dsh-fe-u-size" data-u="uf" data-u-fld="size" value="15" min="12" max="22" step="1" style="width:44px" title="字号">' +
        "</div>" +
        "</div>" +
        '<div class="dsh-fe-toolbar">' +
        '<button type="button" data-act="randomAllFonts" title="给所有启用区域随机分配英/中文字体">🎲 随机字体</button>' +
        '<button type="button" class="dsh-fe-btn-accent" data-act="randomAllColors" title="给所有启用区域随机分配颜色">🎨 随机颜色</button>' +
        '<button type="button" data-act="resetAll">恢复默认</button>' +
        "</div>" +
        '<div id="dsh-fe-cards"></div>' +
        '<div id="dsh-fe-hint">勾选区域前的复选框展开该区域设置。🎲字体只随机英/中文字体，🎨颜色随机颜色。调好的配置可保存为主题随时切换。<br><br>💡 插件卡顿/卡住时：① 点击 DSH 左下角"重载"按钮；② 或点一下右下角 Aa 悬浮球把它折叠，即可刷新插件样式。</div>' +
        '<div id="dsh-fe-toast"></div>' +
        "</div>";
      document.body.appendChild(root);

      panel = root.querySelector("#dsh-fe-panel");
      cardsEl = root.querySelector("#dsh-fe-cards");
      renderCards();
      renderThemeSel();
      applyAll(regions);

      // sync unified controls with saved state
      var u = state.unified;
      var ucEl = root.querySelector("#dsh-fe-u-color");
      var ucVal = root.querySelector("#dsh-fe-u-color-val");
      if (ucEl) ucEl.checked = u.uc.enabled;
      if (ucVal) ucVal.value = u.uc.color;
      var ufEl = root.querySelector("#dsh-fe-u-font");
      var ufEn = root.querySelector("#dsh-fe-u-en");
      var ufZh = root.querySelector("#dsh-fe-u-zh");
      var ufSz = root.querySelector("#dsh-fe-u-size");
      if (ufEl) ufEl.checked = u.uf.enabled;
      if (ufEn) ufEn.value = u.uf.en;
      if (ufZh) ufZh.value = u.uf.zh;
      if (ufSz) ufSz.value = u.uf.size;

      // Direct event listener for unified color picker (bypass delegation)
      var ucPicker = root.querySelector("#dsh-fe-u-color-val");
      if (ucPicker) {
        ucPicker.addEventListener("input", function () {
          state.unified.uc.color = ucPicker.value;
          applyAll(regions);
          persist();
        });
      }

      // initial button position (saved, else default bottom-right)
      var btn = root.querySelector("#dsh-fe-toggle");
      if (typeof state.bx === "number" && typeof state.by === "number") {
        btn.style.left = state.bx + "px";
        btn.style.top = state.by + "px";
        btn.style.right = "auto";
        btn.style.bottom = "auto";
      }

      wireEvents();
    }

    // ---------- event wiring ----------
    function wireEvents() {
      var toggle = root.querySelector("#dsh-fe-toggle");

      function show() {
        panel.style.display = "block";
        positionPanel();
      }
      function hide() {
        panel.style.display = "none";
        reloadPlugin();
      }
      function isOpen() {
        return panel.style.display === "block";
      }
      function positionPanel() {
        var r = toggle.getBoundingClientRect();
        var pw = panel.offsetWidth || 320;
        var ph = panel.offsetHeight || 360;
        var left = r.left + r.width / 2 - pw / 2;
        left = Math.max(8, Math.min(window.innerWidth - pw - 8, left));
        var top = r.top - ph - 10;
        if (top < 8) top = r.bottom + 10;
        panel.style.left = left + "px";
        panel.style.top = top + "px";
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      }

      // ---- drag the button (pet-like) ----
      var drag = { active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 };
      toggle.addEventListener("pointerdown", function (e) {
        drag.active = true;
        drag.moved = false;
        drag.sx = e.clientX;
        drag.sy = e.clientY;
        var r = toggle.getBoundingClientRect();
        drag.ox = r.left;
        drag.oy = r.top;
        try {
          toggle.setPointerCapture(e.pointerId);
        } catch (err) {}
        toggle.classList.add("dsh-fe-dragging");
        e.preventDefault();
      });
      toggle.addEventListener("pointermove", function (e) {
        if (!drag.active) return;
        var dx = e.clientX - drag.sx;
        var dy = e.clientY - drag.sy;
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
        drag.moved = true;
        var nx = Math.max(0, Math.min(window.innerWidth - toggle.offsetWidth, drag.ox + dx));
        var ny = Math.max(0, Math.min(window.innerHeight - toggle.offsetHeight, drag.oy + dy));
        toggle.style.left = nx + "px";
        toggle.style.top = ny + "px";
        toggle.style.right = "auto";
        toggle.style.bottom = "auto";
        state.bx = Math.round(nx);
        state.by = Math.round(ny);
        persist();
        // 面板展开时跟随悬浮球移动
        if (isOpen()) positionPanel();
      });
      function endDrag(e) {
        if (!drag.active) return;
        drag.active = false;
        toggle.classList.remove("dsh-fe-dragging");
        try {
          toggle.releasePointerCapture(e.pointerId);
        } catch (err) {}
        if (!drag.moved) {
          if (isOpen()) hide();
          else show();
        }
      }
      toggle.addEventListener("pointerup", endDrag);
      toggle.addEventListener("pointercancel", endDrag);

      root.querySelector("#dsh-fe-close").addEventListener("click", hide);

      // ---- delegated field edits (no re-render, keep focus) ----
      function onField(e) {
        var el = e.target;
        var rid = el.getAttribute("data-rid");
        var fld = el.getAttribute("data-fld");
        if (!rid || !fld) return;
        var r = findRegion(rid);
        if (!r) return;
        if (fld === "enabled") { r.enabled = el.checked; renderCards(); }
        else if (fld === "italic") r.italic = el.checked;
        else if (fld === "useColor") r.useColor = el.checked;
        else if (fld === "name") r.name = el.value;
        else if (fld === "selector") r.selector = el.value;
        else if (fld === "en" || fld === "zh") r[fld] = el.value;
        else if (fld === "size") r.size = clamp(el.value, 12, 22);
        else if (fld === "lh") r.lh = clamp(el.value, 1.3, 2.2);
        else if (fld === "weight") {
          r.weight = clamp(el.value, 100, 900);
          var v = root.querySelector('[data-rid="' + rid + '"][data-fld="weightVal"]');
          if (v) v.textContent = r.weight;
        } else if (fld === "color") {
          r.color = el.value;
          var dot = root.querySelector('[data-dot="' + rid + '"]');
          if (dot) dot.style.background = r.color;
        }
        else return;
        applyAll(regions);
        persist();
      }
      root.addEventListener("input", onField);
      root.addEventListener("change", onField);

      // ---- unified controls ----
      function onUnified(e) {
        var el = e.target;
        var u = el.getAttribute("data-u");
        var fld = el.getAttribute("data-u-fld");
        if (!u || !fld) return;
        var sect = u === "uc" ? "uc" : "uf";
        if (fld === "enabled") state.unified[sect].enabled = el.checked;
        else if (fld === "color") state.unified[sect].color = el.value;
        else if (fld === "en" || fld === "zh") state.unified[sect][fld] = el.value;
        else if (fld === "size") state.unified[sect].size = clamp(el.value, 12, 22);
        else return;
        applyAll(regions);
        persist();
      }
      root.addEventListener("input", onUnified);
      root.addEventListener("change", onUnified);

      // ---- theme select: auto-fill name input ----
      var themeSel = root.querySelector("#dsh-fe-theme-sel");
      if (themeSel) {
        themeSel.addEventListener("change", function () {
          var inp = root.querySelector("#dsh-fe-theme-name");
          if (inp && themeSel.value) inp.value = themeSel.value;
        });
      }

      // ---- delegated actions ----
      root.addEventListener("click", function (e) {
        var btn = e.target.closest ? e.target.closest("[data-act]") : null;
        if (!btn) return;
        var act = btn.getAttribute("data-act");
        var rid = btn.getAttribute("data-rid");

        if (act === "resetAll") {
          regions = DEFAULT_REGIONS();
          renderCards();
          applyAll(regions);
          persist();
          return;
        }
        if (act === "randomAllFonts") { randomizeAllFonts(); return; }
        if (act === "randomAllColors") { randomizeAllColors(); return; }
        if (act === "themeSave") { saveTheme(); return; }
        if (act === "themeRename") { themeRename(); return; }
        if (act === "themeApply") { applyTheme(); return; }
        if (act === "themeDel") { deleteTheme(); return; }

        var r = rid ? findRegion(rid) : null;
        if (!r) return;
        if (act === "delete") {
          regions = regions.filter(function (x) {
            return x.id !== rid;
          });
          renderCards();
          applyAll(regions);
          persist();
        } else if (act === "randomFont") {
          randomizeFonts(rid);
        } else if (act === "randomColor") {
          randomizeColor(rid);
        } else if (act === "reset") {
          // reset styling + color — keep the calibrated name/selector/group set
          r.en = "Times New Roman";
          r.zh = "KaiTi";
          r.size = 15;
          r.lh = 1.6;
          r.weight = 400;
          r.italic = false;
          r.useColor = false;
          r.color = "#e6e6e6";
          renderCards();
          applyAll(regions);
          persist();
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && isOpen()) hide();
      });
      window.addEventListener("resize", function () {
        if (isOpen()) positionPanel();
      });
    }

    // ---------- entry ----------
    var inject = [];
    function apply() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildUI);
      } else {
        buildUI();
      }
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
