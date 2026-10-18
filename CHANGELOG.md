# Changelog

## 1.5.2 — 2026-10-19

### 修复：三条社区 issue（#1 / #2），全部经实机回归验证

**① 桌面端重启后配置全丢（issue #1 问题一，最高优先级）**

DSH 桌面端页面跑在自定义协议 `dsh-app://app`，每次完全重启后 origin 变化，
而 `localStorage` 按 origin 隔离 → `regions` / `themes` / `unified` 全部归零。
宿主半其实早已提供 `/dsh-font-enhancer/get` 与 `/set`（写
`~/.dsh/data/dsh-font-enhancer/settings.json`），但客户端从未调用过。

现在：`saveSettings` 双写（localStorage + 400ms 去抖 POST `/set`）；
`apply()` 启动时先异步 GET `/get`（上限 1.5s，超时照常启动不卡），
拿到快照后按 `__savedAt` 比较新旧并合并——主题与自定义字体取并集防丢，
区域以更晚保存的那份为准。跨重启、跨端口、跨 origin 都不再丢配置。

**② 「👁 范围」对多数区域不可见（issue #1 问题二）**

DSH 的 slot 锚点元素（`[data-slot=...]`）是 `display: contents`，没有盒模型，
`outline` 画在上面完全不可见，用户误以为描边功能坏了。
`showScope()` 现在检测 `getComputedStyle(el).display === "contents"`，
改为描其有盒模型的直接子元素（子元素也全是 contents 时再退一代）。

**③ 有「框选」区域时「自定义」组被静默丢弃（issue #1 问题三）**

`loadSettings()` 旧逻辑：只要存在任意「框选」区域，就
`filter(group === "框选")`，把用户手动新建的「自定义」组区域一并丢弃，
随后 `persist()` 将其永久覆盖（无法找回）。
现在保留「框选」+「自定义」两组，只淘汰内置预设组。

**④ 悬浮球刷新后消失、约 60 秒才出现（issue #2 第一点）**

旧代码只在 `apply()` 里调一次 `feApplyBallVisibility()`，而那时 `buildUI`
还在等 `DOMContentLoaded` / `document.body` 就绪，球尚未创建 → 该次调用落空，
只能靠 `feWatchBall()` 的 1s×120 轮询在最多 60 秒后才补上显隐。
另外 `buildUI()` 在 `document.body` 为空时直接 `return` 且无重试。
现在：`buildUI()` 加 250ms×40 的短间隔重试；`buildUI()` 挂载完成后立即
调用一次 `feApplyBallVisibility()`。轮询仅作热重载兜底保留。

**⑤ 对话区字号分级被宿主规则压掉（issue #2 第二点）**

宿主对对话区文字使用带 `!important` 的高特异度规则，本插件原有的
`sel, sel *, sel text` 特异度不足，同等 `!important` 下比不过 → 字号设置
在对话区不生效。现在额外生成一条 `:is(sel):is(sel):is(sel)` 三倍特异度规则
（匹配同一批元素、只带 font-size/line-height，仍全 `!important`），
稳定压过宿主规则。字体/颜色规则保持原权重不变（避免误伤）。

**⑥ 热重载后新代码完全不生效（本次实测发现，非 issue 报告）**

客户端 bundle 被重新求值（页面刷新 / HMR）时，上一次实例留在 DOM 里的
`#dsh-fe-root` 不会被自动移除，而 `buildUI()` 开头的「已存在就 return」
守卫会让新实例永远建不出 UI —— 表现为悬浮球停在旧状态、**新代码一行都不生效**，
且控制台无任何报错，极易被误判成「改动没写进去」。
现在 `apply()` 建 UI 前主动摘掉残留的旧 root 并清空模块级引用。

### 验证

- 真机浏览器探针（`console.error` 上报，实测后已全部清除）：
  - 悬浮球 `ball=true / display=flex / visibility=visible`
  - 宿主持久化回读 `9regs`（跨重启存活）
  - 范围描边逐区域落点 `1,526,2,1,1,1,6,2,1`（9 个区域全部真正描到，修复前 8 个为 0）
  - 字号叠权规则生成 36 处 `:is():is():is(`、18 条 `font-size !important`
  - `#dsh-fe-root` 数量 = 1（无热重载残留）
- 真实函数沙箱回归（抽取 `withText` / `boostScope` / `buildRegionCss` 实跑）：
  `body` 特殊处理保留；`:is()` 三倍叠权输出正确；字号/行高单独成规则。
- `mergeSnapshot` + `loadSettings` 三场景回归：宿主更新优先 / 本地更新优先 /
  **有框选时同时保留框选+自定义、淘汰预设**（issue #1 问题三的关键断言）。
- 回归中发现并修掉一个自引入 bug：`mergeSnapshot` 漏带 `ver` 字段会导致
  下游版本迁移分支误判，用 `DEFAULT_REGIONS()` 覆盖掉刚恢复的区域。
- 另修掉一个自引入事故：清理探针时整行匹配误删了 `feLoadHostSettings` 内的
  `finish()` 定义，导致 `ReferenceError: finish is not defined`、插件完全起不来。
  现已恢复，并在源码该处留下警示注释。


## 1.5.1 — 2026-10-14

### 合规性改进（无功能改动）

本次为**纯元数据与文档改动，未触碰任何运行代码**（`lib/*.js` 与上一版逐字节一致）：

- **包元数据**：`engines.node` 对齐 DSH 运行时（`^22.19.0 || >=24.0.0`）；补 `packageManager`；`files` 白名单补上裸目录 `lib`、`locale/*.json`、`icon.svg` 与多语言 README；`exports` 补 `./locale/*.json` 与 `./icon`。
- **交付元数据**（官方插件契约要求）：新增 `locale/en.json` 与 `locale/zh.json`（含 `meta.title` / `meta.description`），新增 `icon.svg`（插件管理器显示用图标，不再显示裸 id）。
- **多语言文档**：新增 `README-zh.md` 中文说明；`README-es/pt/hi.md` 标题与主 README 对齐。

以上改动使插件通过官方 `dsh-plugin-dev check` 全部检查项（`P=12 F=0 W=0`）。

### Compliance improvements (no functional changes)

This release is **metadata and documentation only — no runtime code was touched** (`lib/*.js` is byte-identical to the previous version):

- **Package metadata**: `engines.node` aligned with the DSH runtime (`^22.19.0 || >=24.0.0`); `packageManager` added; `files` allowlist now includes the bare `lib` directory, `locale/*.json`, `icon.svg` and the multi-language READMEs; `exports` gained `./locale/*.json` and `./icon`.
- **Display metadata** (required by the official plugin contract): added `locale/en.json` and `locale/zh.json` with `meta.title` / `meta.description`, plus `icon.svg` so the plugin manager shows a real name and icon instead of a bare id.
- **Multi-language docs**: added `README-zh.md`; `README-es/pt/hi.md` headings aligned with the main README.

With these changes the packages pass every official `dsh-plugin-dev check` item (`P=12 F=0 W=0`).

---

## 1.5.0 - 展开面板全面统一（标题改名 · 字号/方框归一 · 背景分层 · 隐藏重复皮肤栏）

针对用户反馈的四项界面问题做根治性重写，并把面板标题改为「字体DIY悬浮球」。

### 🔴 根因修复：CSS 选择器与 HTML 结构错配（"背景时有时无"的真凶）

HTML 里这些元素**只有 class、没有 id**，而 CSS 却全部写成了 ID 选择器：
`#dsh-fe-themeblock`、`#dsh-fe-card`、`#dsh-fe-card-body`、`#dsh-fe-card-head`、
`#dsh-fe-customfont`、`#dsh-fe-guide`、`#dsh-fe-body-col`、`#dsh-fe-italicrow`、`#dsh-fe-colorrow`。

结果：**基础样式从未命中**，只在换肤后被皮肤层"补"上一部分 —— 因此表现为
"有时候有背景、有时候没有"，且换肤前后差异极大。现已全部改为真实 class 选择器。

### 字号不再混乱

- 旧版用 `#dsh-fe-root *{font-size:13px!important}` 钉死全局面板字号，
  各处 HTML 又各自内联 `font-size:10.5/11/12/13px` 互相打架。
- 现在只有 **5 档**：`10.5 / 11.5 / 12.5 / 14 / 16`，全部走设计变量；
  **面板内联 `font-size` 已清零**（实测面板内字号集合恰好只剩这 5 个值）。

### 方框（按钮/输入框/色块）尺寸归一

- 卡片右侧动作按钮原是彩色 emoji（`➕👁🎲🎨⟳✕`），字形宽窄与配色随系统 emoji 字体变化
  → 改为**等宽等高的单色 SVG 图标**（24×24），中文说明移入悬停提示；
- 色块高度原先 24px、同行下拉框 28px → 统一为 `24 / 28 / 34` 三档；
- 面板内其它按钮（工具条、主题块、字体清单）字号与高度同档对齐。

### 背景分层，杜绝"文字后没背景"

新增三层背景 token：面板 `--fe-bg-1` / 区块 `--fe-bg-2` / 控件 `--fe-bg-3`，
**每一层都有显式底色**，不再依赖某一层恰好被皮肤补上。

### 换肤与尺寸解耦（换皮肤后布局不变）

- 皮肤层原先写了 60 余条 `padding/height/border-radius` 且全部带 `!important` 后置，
  与基础层互相覆盖 → 方框大小跟着皮肤乱变。
- 现在皮肤层**只改颜色 token，零尺寸属性**；新增按皮肤底色亮度自动判定
  `data-fe-tone="light|dark"`，浅色皮肤下控件底色自动翻转为半透明白。
- 强调按钮（随机颜色）前景色按皮肤渐变亮度自动选深字/白字，浅色皮肤下不再糊成一片。

### 隐藏重复的「悬浮球皮肤 · 三球同步」栏

该栏的下拉与右上角 🎨 皮肤菜单**功能完全重复**（皮肤同步能力已在别处实现），
现整块隐藏（`display:none`）；`select` 元素仍保留在 DOM 中，皮肤系统同步逻辑不受影响。

### 顺带修复

- **框选工具条样式失效**：它挂在 `<html>` 下、并非面板后代，取不到面板上的 token，
  原先只写 `#dsh-fe-panel` 导致其背景/高度失效（浅色皮肤下会留一根深色浮条）。
  现将 token 同时声明到 `#dsh-fe-pickbar`，并在其挂载后补套皮肤基调。
- **卡片两列高度失衡**：实测左列内容底 102px、右列 174px（左列空出 72px），
  将「斜体」移至左列后留白降至 24px。
- **同一卡片内标签风格不一**：`字号/行距` 嵌在 `.dsh-fe-row>div` 中，
  不是 `.dsh-fe-body-col` 的直接子元素，微标签规则漏掉它们（10.5 vs 12.5 两种大小）；
  「斜体/文字颜色」则被微标签规则误命中（大写+粗体）。两处均已修正。
- **面板标题**：「字体区域设置」→「**字体DIY悬浮球**」，悬浮球悬停提示同步更新。

### 验证

- `node --check` 语法通过；DOM-stub 探针 **24/24** 全绿；
- 真实 Chromium 渲染：原版皮肤 + 皮肤 01/04/28（深/浅）；
- **换肤不变性**：原版 ↔ 01 ↔ 04 ↔ 28 互切后，图标按钮仍 24×24、工具条宽度仍一致，
  **只有颜色变化**，布局与字号集合完全不变。

## 1.4.13 - 官方 DSH 兼容声明与引擎版本口径修正

依照 DeepSeek Harness **官方规范**（`packages/boot/app-boot/README.md`）修正兼容性声明。

- **新增官方 DSH 兼容声明**：内核检查的是 `peerDependencies` 中的
  `@deepseek-ai/dsh` / `@deepseek-ai/dsh-*` 范围，**不读取 `engines.dsh`**。
  现已在 `peerDependencies` 与 `devDependencies` 同范围声明：
  `@deepseek-ai/cordis` `^4.0.2`、`@deepseek-ai/dsh` `>=0.1.7-rc.1`。
- **引擎口径修正为内核版本**：此前 `engines` 只写 `node`，未声明 DSH 内核要求；
  现补 `engines.dsh = >=0.1.7-rc.1`（内核版本口径，非客户端/外壳版本）。
- 说明：`^0.1.7` **不匹配**预发布内核 `0.1.7-rc.2`，故范围使用显式预发布下限。

无功能变更。



## v1.4.11 (2026-09-17) — 文档与描述双语化

- **package.json description 改为中英双语卖点式**：先说价值（DSH 界面字体全权 DIY），再列能力（按区域自定义 / 框选建区 / 全局统一 / 主题保存切换 / 随机生成 / 一键下载可爱字体 / 双端可用），npm 与插件市场列表页一眼看懂插件做什么。
- **README 顶部新增宣传区**：中英双钩子（「DSH 的界面长什么样，你说了算。」/ "You decide what DSH looks like."）+ 字体区域设置面板截图 + 图注 + 「为什么值得装」中英段落。原有全部技术文档（区域样式 / 全局统一 / 皮肤 / 主题 / 随机 / 面板 UI / 安装）原样保留。
## v1.4.10 (2026-09-14) — 三球皮肤统一修复
- **面板底色统一**：字体球 `#dsh-fe-panel` 此前从未被皮肤层覆盖自身背景（基础硬编码深灰），切浅色主题（04 全息幻彩 / 08 极地冰川 / 28 月白纸墨）时与 todo/技能球面板不一致；现改用与两球完全相同的 `linear-gradient(var(--pbgA),var(--pbgB))`，128 主题全对齐。
- **hintC 次要文本对比度修正**：08/09/11/17 四主题的 hintC 与面板底 WCAG 对比度不足 3:1，已加深/提亮到 ≥3.4。
- 配套：技能球补齐 50+ 漏网类的皮肤覆盖（详情正文/tab/开关/批量菜单等），三球共享的 128 皮肤在浅色主题下文字全部达标（正文 CR≥11）。


