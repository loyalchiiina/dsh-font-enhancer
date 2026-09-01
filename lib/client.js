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
    var SCHEMA_VERSION = 21;
    // 21: DEFAULT_REGIONS 清空 —— 用户从零开始逐项框选/添加、逐项测试颜色稳定生效

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
      // 默认区域 = 用户采集到的「稳定 DOM 路径」（operation.log REC_NEW），跨重启有效。
      // 每项先用统一红色 #FF0000 验证是否稳定定位+变色，确认后再逐项调整颜色。
      // 注意：部分类名是 CSS-Modules 哈希（.mMKm6W_*/.xUkysG_*），若 DSH 升级 re-hash 会失效，需重新采集。
      function mk(o) { var d = defaultRegion(); return Object.assign(d, o); }
      return [
        // 探针方案：每个区域一个独特颜色，用户重启后对照界面变色位置→告诉我颜色对应哪个区域，我据此固化正确默认。
        // logo（红）
        mk({ name: "logo", selector: '[data-slot="sidebar"] .xUkysG_logoRow, [data-slot="sidebar"] [class*="logo"]', enabled: true, useColor: true, color: "#FF0000", group: "其他" }),
        // 按钮（橙）
        mk({ name: "按钮", selector: '[data-slot="sidebar"] .xUkysG_newSession, [data-slot="sidebar"] .dsh-atb-entry, [data-slot="sidebar"] .dsw-web-sessions-badge, [data-slot="sidebar"] .zOa2rq_trigger', enabled: true, useColor: true, color: "#FF8C00", group: "左侧栏" }),
        // 对话栏上方（金）
        mk({ name: "对话栏上方", selector: '[data-slot="conversation"] ._4RFuWq_titleRow, [data-slot="conversation"] ._4RFuWq_tabs', enabled: true, useColor: true, color: "#FFD700", group: "对话区" }),
        // 工作区（亮绿）
        mk({ name: "工作区", selector: '[data-slot="sidebar"] .xUkysG_regionArea', enabled: true, useColor: true, color: "#00FF00", group: "左侧栏" }),
        // 对话区（深天蓝）
        mk({ name: "对话区", selector: '[data-slot="conversation.chat.node"] .sDVxEG_body, [data-slot*="conversation.chat.node"] [data-slot="markdown"]', enabled: true, useColor: true, color: "#00BFFF", group: "对话区" }),
        // 对话信息显示（蓝紫）
        mk({ name: "对话信息显示", selector: '[data-slot="conversation.chat.node"] ._row_luwio_16, [data-slot="conversation.chat.node"] .QWj8lG_actions', enabled: true, useColor: true, color: "#8A2BE2", group: "对话区" }),
        // 输入区（品红）
        mk({ name: "输入区", selector: '[data-slot*="conversation.composer"] .krUYjW_card, [data-slot*="conversation.composer"] textarea, [data-slot*="conversation.composer"] [contenteditable="true"]', enabled: true, useColor: true, color: "#FF00FF", group: "对话区" }),
        // 对话栏底部区域（青）
        mk({ name: "对话栏底部区域", selector: '[data-slot="conversation.composer.dock"] .q2FAPq_root, [data-slot="conversation.composer.dock"] span button', enabled: true, useColor: true, color: "#00FFFF", group: "对话区" })
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
          var loaded = o.regions.map(normRegion).filter(function (x) { return x.group !== "已识别"; });
          var hasPicked = loaded.some(function (x) { return x.group === "框选"; });
          var regions = hasPicked
            // Once the user has box-picked regions, those SUPERSEDE the built-in
            // preset regions — the panel shows only what the user picked/owns.
            ? loaded.filter(function (x) { return x.group === "框选"; })
            : loaded;
          return {
            regions: regions,
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
        "/* ── toggle button — gem-like floating orb (max-visible) ── */",
        "#dsh-fe-root{position:relative;z-index:2147483647}",
        "#dsh-fe-toggle{position:fixed;left:auto;top:auto;right:18px;bottom:18px;z-index:2147483647 !important;width:54px !important;height:54px !important;border-radius:50% !important;border:0 !important;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.15),rgba(40,44,54,.95) 70%) !important;color:#eef0f4 !important;font-size:22px !important;font-weight:700 !important;cursor:grab !important;user-select:none !important;touch-action:none !important;box-shadow:0 4px 24px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.15) !important;backdrop-filter:blur(12px) !important;line-height:54px !important;text-align:center !important;display:block !important;visibility:visible !important;opacity:1 !important;transform:none !important;pointer-events:auto !important}",
        "#dsh-fe-toggle:hover{box-shadow:0 6px 32px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.2) !important;transform:scale(1.06) !important}",
        "#dsh-fe-toggle.dsh-fe-dragging{cursor:grabbing !important;transform:scale(1.12) !important;box-shadow:0 8px 40px rgba(0,0,0,.8) !important}",
        "/* ── panel root — deep glass studio (position set by JS positionPanel) ── */",
        "#dsh-fe-panel{position:fixed !important;z-index:2147483647 !important;width:348px !important;max-width:calc(100vw - 36px) !important;max-height:86vh;overflow-y:auto !important;overflow-x:hidden !important;color:#e6e6e6 !important;border-radius:20px !important;padding:20px !important;font:13px/1.5 KaiTi,'Microsoft YaHei',sans-serif !important;background:rgba(16,18,22,.92) !important;border:1px solid rgba(255,255,255,.08) !important;box-shadow:0 20px 60px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.06) !important;backdrop-filter:blur(24px) !important;-webkit-backdrop-filter:blur(24px) !important;visibility:visible !important;pointer-events:auto !important}",
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
        ".dsh-fe-toolbar{display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap}",
        "#dsh-fe-toolbar .dsh-fe-toolbar2{margin-top:8px}",
        ".dsh-fe-toolbar2{display:flex;gap:5px;margin:6px 0 14px;flex-wrap:wrap}",
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

    // ── 采集定位区域（录制模式）──────────────────────────────
    // 用户点「🔴 采集区域」按钮开/关。开启期间，每次框选/加元素都会把被选中元素的
    // 「稳定定位信息」收集并写入 ~/.dsh/data/dsh-font-enhancer/operation.log，
    // 便于排查：恢复哪个稳定选择器能在重启后仍准确定位到该元素。
    var RECORDING = false;
    var recSamples = [];
    function recToggle(on) {
      RECORDING = !!on;
      recSamples = [];
      try { localStorage.setItem("dsh-fe-rec", RECORDING ? "1" : "0"); } catch (e) {}
      // 同步按钮文案
      if (root) {
        var b = root.querySelector('[data-act="recordToggle"]');
        if (b) { b.textContent = RECORDING ? "⏹ 停止采集" : "🔴 采集区域"; b.classList.toggle("dsh-fe-rec-on", RECORDING); }
      }
      showToast(RECORDING ? "采集模式已开启：现在框选/加元素会记录元素定位到文件" : "采集模式已关闭", RECORDING ? "ok" : "");
    }
    // 元素最简稳定选择器（优先语义 data-*、id、class，最后 tag）
    function stableSelFor(node) {
      if (!node || node.nodeType !== 1) return null;
      if (node.id) return "#" + node.id;
      var cn = node.getAttribute ? (node.getAttribute("class") || "") : "";
      if (cn && cn.trim()) return "." + cn.trim().split(/\s+/)[0].replace(/[:>,\s]/g, "\\$&");
      if (node.getAttribute) {
        // 语义 data-* 钩子
        var attrs = node.attributes;
        for (var i = 0; i < attrs.length; i++) {
          var n = attrs[i].nodeName;
          if (n.indexOf("data-") === 0) return "[" + n + (attrs[i].nodeValue ? '="' + attrs[i].nodeValue + '"' : "") + "]";
        }
      }
      return node.tagName ? node.tagName.toLowerCase() : null;
    }
    // 元素的「祖先链稳定路径」（向上最多 6 层，每层用最简稳定选择器）
    function stablePathFor(el) {
      var parts = [], p = el;
      while (p && p !== document.body && parts.length < 6) {
        var s = stableSelFor(p);
        if (s) parts.unshift(s);
        p = p.parentElement;
      }
      return parts.join(" > ") || (el.tagName ? el.tagName.toLowerCase() : "?");
    }
    // 把本次采集到的元素定位信息写入日志文件
    function flushRecord(kind, name, selector) {
      if (!RECORDING || !recSamples.length) return;
      var payload = {
        kind: kind || "REC_PICK",
        t: new Date().toISOString(),
        regionName: name || "",
        regionSelector: selector || "",
        samples: recSamples.slice()
      };
      try { fetch("/dsh-font-enhancer/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(function(){}); } catch (e) {}
      recSamples = [];
    }

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

    // ── Point-and-pick custom region: hover to preview, click to select, name ─
    // User picks the exact UI text/elements they want as one region, then names
    // it. Much finer-grained than auto-discovery and never floods the panel.
    var __pick = null;
    function pickRegion(targetRid) {
      var target = (typeof targetRid === "string" && targetRid) ? findRegion(targetRid) : null;
      if (__pick && __pick.active) { pickRegionExit(true); return; }
      var toggle = document.getElementById("dsh-fe-toggle");
      var pickbar = document.createElement("div");
      pickbar.id = "dsh-fe-pickbar";
      pickbar.style.cssText = "position:fixed;z-index:2147483647;left:50%;top:64px;display:flex;gap:8px;align-items:center;padding:10px 14px;background:rgba(18,20,26,.97);border:1px solid rgba(255,255,255,.16);border-radius:14px;box-shadow:0 12px 44px rgba(0,0,0,.7);color:#e6e6e6;font:13px/1.5 KaiTi,'Microsoft YaHei',sans-serif;pointer-events:auto;cursor:move";
      var modeTip = target ? ('追加到区域「' + target.name + '」') : '拖动 ⠿ 移动工具条；Ctrl+点击多选';
      var pickNamePh = target ? (target.name + '' ) : "给这个区域命名…";
      pickbar.innerHTML =
        '<span id="dsh-fe-pick-handle" title="拖动移动工具条" style="cursor:move;padding:0 8px 0 2px;color:#8b93a1;font-size:14px;user-select:none;-webkit-user-select:none">⠿</span>' +
        '<span id="dsh-fe-pick-count">已选 <b>0</b> 个元素</span>' +
        '<input id="dsh-fe-pick-name" placeholder="' + pickNamePh + '" style="width:180px;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.45);color:#fff;font:inherit;font-size:13px">' +
        '<button id="dsh-fe-pick-done" type="button" style="padding:6px 16px;border-radius:8px;border:1px solid rgba(106,166,255,.45);background:rgba(106,166,255,.25);color:#a8ccff;cursor:pointer;font:inherit;font-weight:600">✔ 完成</button>' +
        '<button id="dsh-fe-pick-cancel" type="button" style="padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#9aa;cursor:pointer;font:inherit">✕ 取消</button>' +
        '<span style="font-size:11px;color:#8b93a1">' + modeTip + '</span>';
      // center it initially (we dropped the translateX trick so dragging works)
      pickbar.style.left = Math.max(8, Math.round((window.innerWidth - 420) / 2)) + "px";
      var mount = document.documentElement || document.body;
      mount.appendChild(pickbar);
      // drag handle → move the whole pickbar without triggering element pick
      var handle = document.getElementById("dsh-fe-pick-handle");
      (function () {
        var drag = false, sx = 0, sy = 0, ox = 0, oy = 0;
        if (!handle) return;
        handle.addEventListener("pointerdown", function (e) {
          drag = true; sx = e.clientX; sy = e.clientY;
          ox = pickbar.offsetLeft; oy = pickbar.offsetTop;
          try { handle.setPointerCapture(e.pointerId); } catch (err) {}
          e.preventDefault(); e.stopPropagation();
        });
        handle.addEventListener("pointermove", function (e) {
          if (!drag) return;
          var nx = Math.max(4, Math.min(window.innerWidth - pickbar.offsetWidth - 4, ox + (e.clientX - sx)));
          var ny = Math.max(4, Math.min(window.innerHeight - pickbar.offsetHeight - 4, oy + (e.clientY - sy)));
          pickbar.style.left = nx + "px"; pickbar.style.top = ny + "px";
        });
        function end() { drag = false; }
        handle.addEventListener("pointerup", end);
        handle.addEventListener("pointercancel", end);
      })();

      var picked = [];
      var hoverEl = null;
      function hilite(el) {
        if (hoverEl && hoverEl !== el) {
          hoverEl.style.outline = "";
          hoverEl.style.outlineOffset = "";
        }
        if (el) { el.style.outline = "2px dashed #6aa6ff"; el.style.outlineOffset = "-1px"; }
        hoverEl = el;
      }
      function onMove(e) {
        var el = e.target;
        if (!el || el === document.documentElement || el === document.body) return;
        if (el.closest && el.closest("#dsh-fe-root, #dsh-fe-pickbar")) { hilite(null); return; }
        if (el.nodeType === 1) hilite(el);
      }
      function onPick(e) {
        var el = e.target;
        if (!el || el.nodeType !== 1) return;
        if (el.closest && el.closest("#dsh-fe-root, #dsh-fe-pickbar")) return;
        e.preventDefault(); e.stopPropagation();
        var multi = e.ctrlKey || e.metaKey || e.shiftKey;
        var idx = picked.indexOf(el);
        if (idx >= 0) {
          // only un-pick on a plain click; Ctrl/Shift always keeps it selected
          if (!multi) { picked.splice(idx, 1); el.style.outline = ""; }
        } else {
          picked.push(el);
          // 采集模式：记录被框选元素的稳定定位路径
          if (RECORDING) recSamples.push({ path: stablePathFor(el), tag: el.tagName, uid: "…下次分配" });
          el.style.outline = multi ? "2px solid #ff8c5a" : "2px dotted #ffd27a";
          el.style.outlineOffset = "-1px";
        }
        var c = document.getElementById("dsh-fe-pick-count");
        if (c) c.innerHTML = "已选 <b>" + picked.length + "</b> 个元素";
      }
      function finish() {
        var nameEl = document.getElementById("dsh-fe-pick-name");
        var name = (nameEl && nameEl.value.trim()) || ("框选区域 " + (regions.length + 1));
        if (!picked.length) { showToast("未选择任何元素", "err"); return; }
        var marks = [];
        picked.forEach(function (el) {
          var m = uid();
          el.setAttribute("data-fe-reg", m);
          marks.push('[data-fe-reg="' + m + '"]');
          el.style.outline = ""; el.style.outlineOffset = "";
        });
        var target = targetRid ? findRegion(targetRid) : null;
        if (target) {
          // Append the newly picked elements into an existing region instead of
          // creating a new one ("关联框选" from that region's card).
          var existing = (target.selector || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
          marks.forEach(function (m) { if (existing.indexOf(m) < 0) existing.push(m); });
          target.selector = existing.join(", ");
          target.enabled = true;
          renderCards();
          applyAll(regions);
          persist();
          pickRegionExit(true);
          flushRecord("REC_ADD", target.name, target.selector);
          showToast("已向区域「" + target.name + "」追加 " + picked.length + " 个元素", "ok");
          return;
        }
        var nr = defaultRegion();
        nr.id = uid();
        nr.name = name;
        nr.selector = marks.join(", ");
        nr.enabled = true;
        nr.useColor = false;
        nr.color = "#e6e6e6";
        nr.group = "框选";
        // A user box-picked region REPLACES any preset/default region with the
        // same name (so your custom "左侧导航栏" supersedes the built-in one).
        regions = regions.filter(function (x) { return !(x.group && x.group !== "框选" && x.name === name); });
        regions.push(nr);
        renderCards();
        applyAll(regions);
        persist();
        pickRegionExit(true);
        flushRecord("REC_NEW", name, nr.selector);
        // Bring the newly-added card into view and pulse it so the user can
        // immediately find it and test font/color on it.
        var newCard = cardsEl && cardsEl.querySelector('[data-card="' + nr.id + '"]');
        if (newCard) {
          try { newCard.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
          newCard.style.transition = "box-shadow .4s";
          newCard.style.boxShadow = "0 0 0 2px rgba(255,160,70,.7), 0 4px 18px rgba(0,0,0,.4)";
          setTimeout(function () { if (newCard) newCard.style.boxShadow = ""; }, 1600);
        }
        showToast("已添加区域「" + name + "」（" + picked.length + " 个元素），可在卡片里改字体/颜色", "ok");
      }
      function pickRegionExit(silent) {
        if (!__pick) return;
        __pick.active = false;
        document.removeEventListener("pointerover", __pick.onMove, true);
        document.removeEventListener("click", __pick.onPick, true);
        (picked || []).forEach(function (el) { try { el.style.outline = ""; el.style.outlineOffset = ""; } catch (e) {} });
        var b = document.getElementById("dsh-fe-pickbar"); if (b) b.parentNode && b.parentNode.removeChild(b);
        if (hoverEl) { try { hoverEl.style.outline = ""; } catch (e) {} }
        var go = document.getElementById("dsh-fe-toggle");
        if (go) { go.style.display = "block"; }
      }
      document.getElementById("dsh-fe-pick-done").addEventListener("click", finish);
      document.getElementById("dsh-fe-pick-cancel").addEventListener("click", function () { pickRegionExit(true); });
      document.addEventListener("pointerover", onMove, true);
      document.addEventListener("click", onPick, true);
      __pick = { active: true, onMove: onMove, onPick: onPick, exit: pickRegionExit };
      if (toggle) toggle.style.display = "none";
    }

    // ── Show the elements a region currently applies to (like the pick outline) ─
    // Lets the user see exactly which page elements a saved region covers, and
    // doubles as a live check that the region's selector still matches anything.
    function showScope(rid) {
      if (!document.body || !rid) return;
      var r = findRegion(rid);
      if (!r) return;
      var sel = (r.selector || "").trim();
      if (!sel) { showToast("该区域没有选择器", "err"); return; }
      var nodes;
      try { nodes = document.querySelectorAll(sel); } catch (e) { showToast("选择器无效", "err"); return; }
      var arr = Array.prototype.slice.call(nodes).filter(function (n) {
        return n && n.nodeType === 1;
      });
      if (!arr.length) { showToast("该区域当前未匹配到任何元素（可能已失效）", "err"); return; }
      arr.forEach(function (el) {
        el.style.outline = "2px solid #3ddc84";
        el.style.outlineOffset = "-1px";
        el.style.transition = "outline-color .3s";
      });
      showToast("该区域覆盖 " + arr.length + " 个元素（绿色描边，2 秒后消失）", "ok");
      // remember to clear after a beat; if another showScope fires we just reset
      if (showScope._nodes) showScope._nodes.forEach(function (el) { try { el.style.outline = ""; el.style.outlineOffset = ""; } catch (e) {} });
      showScope._nodes = arr;
      clearTimeout(showScope._t);
      showScope._t = setTimeout(function () {
        (showScope._nodes || []).forEach(function (el) { try { el.style.outline = ""; el.style.outlineOffset = ""; } catch (e) {} });
        showScope._nodes = null;
      }, 2400);
    }

    // ── Region config management ──────────────────────────────────────────
    // Replace: drop every non-box-picked region (defaults go away), keep picked.
    function replaceWithPicked() {
      var picked = regions.filter(function (x) { return x.group === "框选"; });
      if (!picked.length) { showToast("当前没有框选区域，先新增框选", "err"); return; }
      regions = picked;
      renderCards(); applyAll(regions); persist();
      showToast("已用「" + picked.length + " 个框选区域」取代默认区域", "ok");
    }
    // Restore: remove box-picked regions and reload the built-in defaults.
    function restoreDefault() {
      regions = DEFAULT_REGIONS();
      renderCards(); applyAll(regions); persist();
      showToast("已恢复默认区域（移除框选区域）", "ok");
    }
    // Save the whole current region set as a named preset ("配置方案").
    // Save the whole current region set as a named preset ("保存配置方案").
    // Reuses the theme-recipe shape so the saved plan can be applied back via
    // the theme "应用" button too.
    function saveConfig() {
      var themes = getThemes();
      var base = "配置方案";
      var name = base + "1";
      var n = 1;
      while (themes.some(function (t) { return t.name === name; })) { n++; name = base + n; }
      var recipe = {};
      regions.forEach(function (r) {
        recipe[r.name] = {
          en: r.en, zh: r.zh, size: r.size, lh: r.lh,
          weight: r.weight, italic: r.italic === true,
          color: r.color, useColor: r.useColor === true
        };
      });
      themes.push({ name: name, recipe: recipe, ts: Date.now() });
      state.themes = themes;
      renderThemeSel();
      persist();
      var sel = root.querySelector("#dsh-fe-theme-sel");
      if (sel) sel.value = name;
      showToast("已保存方案「" + name + "」（含全部区域字体/颜色）", "ok");
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
    // A color drawn from the FULL hue wheel with random saturation/lightness,
    // so every random pick can be green/blue/purple/yellow/red — not just a
    // handful of near-red hues. `#ignore` kept for call-site compatibility.
    function randVivid(i) {
      var h = Math.floor(Math.random() * 360);
      var s = 70 + Math.floor(Math.random() * 25);   // 70–95%
      var l = 42 + Math.floor(Math.random() * 28);   // 42–70%
      return "hsl(" + h + ", " + s + "%, " + l + "%)";
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
        '<button type="button" data-rid="' + r.id + '" data-act="pickAdd" title="框选更多元素追加到这个区域">➕加元素</button>' +
        '<button type="button" data-rid="' + r.id + '" data-act="showScope" title="高亮显示该区域覆盖的元素范围">👁范围</button>' +
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
      // DIAG: prove this client really runs in the browser by pinging host's
      // client-alive route (host logs "CLIENT-ALIVE ping received from browser").
      try { fetch("/dsh-font-enhancer/client-alive").catch(function(){}); } catch (e) {}

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
        '<button type="button" data-act="pickMode" title="在界面框选文字元素，合并成一个区域并命名">🖱 框选区域</button>' +
        '<button type="button" data-act="recordToggle" title="开启后框选/加元素会记录元素稳定定位到文件，用于排查定位区域是否跨重启失效">🔴 采集区域</button>' +
        '<button type="button" data-act="randomAllFonts" title="给所有启用区域随机分配英/中文字体">🎲 随机字体</button>' +
        '<button type="button" class="dsh-fe-btn-accent" data-act="randomAllColors" title="给所有启用区域随机分配颜色">🎨 随机颜色</button>' +
        "</div>" +
        '<div class="dsh-fe-toolbar dsh-fe-toolbar2">' +
        '<button type="button" data-act="replacePicked" title="删除全部默认区域，只保留你框选的区域">⟳ 框选取代默认</button>' +
        '<button type="button" data-act="restoreDefault" title="删除新增的框选区域，恢复内置默认区域">↺ 恢复默认区域</button>' +
        '<button type="button" class="dsh-fe-btn-accent" data-act="saveConfig" title="保存当前框选区域配置方案">💾 保存方案</button>' +
        "</div>" +
        '<div id="dsh-fe-cards"></div>' +
        '<div id="dsh-fe-hint">勾选区域前的复选框展开该区域设置。🎲字体只随机英/中文字体，🎨颜色随机颜色。调好的配置可保存为主题随时切换。<br><br>💡 插件卡顿/卡住时：① 点击 DSH 左下角"重载"按钮；② 或点一下右下角 Aa 悬浮球把它折叠，即可刷新插件样式。</div>' +
        '<div id="dsh-fe-toast"></div>' +
        "</div>";
      // Mount to the outermost <html> element, NOT document.body — DSH gives
      // the body/app containers `transform`/`filter`/`overflow` which make
      // position:fixed children (the orb + panel) position against a transformed
      // ancestor instead of the viewport, hiding them off screen. Appending to
      // <html> sidesteps that so the floating orb is always visible.
      var mount = document.documentElement || document.body;
      mount.appendChild(root);
      try { fetch("/dsh-font-enhancer/client-alive").catch(function(){}); } catch (e) {} // DIAG-2 root appended

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

      // initial button position (saved, else default bottom-right).
      // Clamp inside the viewport so a stale/off-screen saved position can
      // never hide the orb (it "disappears" when bx/by put it outside the window).
      var btn = root.querySelector("#dsh-fe-toggle");
      var bw = btn.offsetWidth || 54, bh = btn.offsetHeight || 54;
      if (typeof state.bx === "number" && typeof state.by === "number" &&
          state.bx >= 0 && state.by >= 0 &&
          state.bx <= Math.max(0, window.innerWidth - bw) &&
          state.by <= Math.max(0, window.innerHeight - bh)) {
        btn.style.left = state.bx + "px";
        btn.style.top = state.by + "px";
        btn.style.right = "auto";
        btn.style.bottom = "auto";
      } else {
        // default / invalid position → bottom-right (CSS default covers it)
        btn.style.left = "auto"; btn.style.top = "auto";
        btn.style.right = "18px"; btn.style.bottom = "18px";
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
          r.useColor = true; // picking a color should always apply it
          var dot = root.querySelector('[data-dot="' + rid + '"]');
          if (dot) dot.style.background = r.color;
          var cb = root.querySelector('[data-rid="' + rid + '"][data-fld="useColor"]');
          if (cb) cb.checked = true;
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
        if (act === "pickMode") { pickRegion(); return; }
        if (act === "recordToggle") { recToggle(!RECORDING); return; }
        if (act === "replacePicked") { replaceWithPicked(); return; }
        if (act === "restoreDefault") { restoreDefault(); return; }
        if (act === "saveConfig") { saveConfig(); return; }
        if (act === "randomAllFonts") { randomizeAllFonts(); return; }
        if (act === "randomAllColors") { randomizeAllColors(); return; }
        if (act === "themeSave") { saveTheme(); return; }
        if (act === "themeRename") { themeRename(); return; }
        if (act === "themeApply") { applyTheme(); return; }
        if (act === "themeDel") { deleteTheme(); return; }

        var r = rid ? findRegion(rid) : null;
        if (!r) return;
        if (act === "pickAdd") { pickRegion(rid); return; }
        if (act === "showScope") { showScope(rid); return; }
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
      try { fetch("/dsh-font-enhancer/client-alive").catch(function(){}); } catch (e) {} // DIAG-3 buildUI complete
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
