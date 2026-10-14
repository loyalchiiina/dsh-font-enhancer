# Changelog

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


