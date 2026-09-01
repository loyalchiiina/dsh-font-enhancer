# dsh-font-enhancer

> 按区域分别设置 DSH 界面字体、字号、颜色，支持统一控制、主题保存/切换、随机配色/字体。

![npm](https://img.shields.io/npm/v/dsh-font-enhancer)
![license](https://img.shields.io/github/license/loyalchiiina/dsh-font-enhancer)
![dsh](https://img.shields.io/badge/DSH-Plugin-8A2BE2)

A DSH (DeepSeek Harness) plugin that lets you style the UI **per-region** — each
region (sidebar, message area, input box, code block, etc.) gets its own
Chinese/English font, font-size, line-height, weight, italic, and text color.
Features **unified** global font/color overrides, **theme** save/switch, **框选
(pick-region)** element selection, and **random** font/color generators.

> ✅ **v1.2.0 同时支持 DSH **网页端**（浏览器访问 Web GUI，默认 `http://127.0.0.1:43120`）
> 和 **桌面端**（Electron 内置窗口）。** 两端均可正常使用框选区域、字体/颜色设置
> 等全部功能。
>
> ✅ v1.2.0 supports both the DSH **Web GUI** (browser access, default
> `http://127.0.0.1:43120`) and the **Desktop Electron window**. All features
> work in both environments.

---

## 功能 Features

### 区域样式 Per-region Styling
- Pre-calibrated regions covering the DSH **Web GUI** UI:
  Left sidebar, Logo, New Session, Taskboard entry, Workspace name, Settings,
  Conversation messages, Session title, Composer/input, Tabs, Turn indicator,
  Agent/model name, Right extension panel, Code blocks, Bottom expand bar.
- **Per-region controls**: Chinese font, English font, font-size, line-height,
  font-weight (100–900 slider), italic toggle, text color with color picker.
- Each region has a **checkbox** — tick it to expand the settings panel for that region.

### 全局统一 Unified Controls
- **Unified Color** checkbox: one color picker applies to **all** enabled regions.
- **Unified Font** checkbox: one font family + size applies to **all** enabled regions.
- When unified is ON, the randomizer randomizes the unified value (not per-region).

### 主题系统 Theme System
- **Save** the current full configuration (all regions' fonts + colors) as a named theme.
- **Apply** any saved theme to restore its settings.
- **Rename** themes via the inline input + ✏ button.
- **Delete** unwanted themes.
- Themes survive DSH restarts and plugin version bumps.

### 随机生成 Random Generation
- **🎲 Random Font** — randomize Chinese + English font for all (or one) enabled regions.
- **🎨 Random Color** — randomize vivid, high-distinction colors (golden-angle stepping).
- Per-region 🎲/🎨 buttons on each card head for single-region random.

### 面板 UI Panel UI
- Floating **Aa** button (bottom-right, draggable like a pet).
- **Left-right layout** in card head: checkbox + color dot + name on the left,
  🎲font/🎨color/⟳reset/✕delete buttons on the right.
- **Card body** splits into two columns: fonts on the left, size/weight/italic/color
  on the right.
- **Toast** notifications (no window.alert) for all save/apply/delete operations.
- **Reload** the plugin by collapsing the floating button (hide → rebuild).

### 其他
- Font lists mirror Microsoft Word (Times New Roman, Arial, Calibri, 楷体, 宋体, 微软雅黑…).
- Default: English = Times New Roman, Chinese = 楷体 (KaiTi).
- All settings persist in `localStorage`; survive page refresh and DSH restart.
- Panel font is fixed to KaiTi (楷体) so it never changes with the plugin's own rules.

---

## 安装 Install

```bash
# From the DSH profile directory:
dsh plugin --profile desktop add ./dsh-font-enhancer
```

Or copy the folder into `node_modules/` and add the package name to the profile
`bundles` list, then restart DSH.

### Requirements
- DSH Desktop 2.0+ (tested on `0.1.0-rc.6`).
- **本版本仅验证 DSH 网页端（浏览器访问 Web GUI）**；桌面端窗口适配见顶部 ⚠️ 说明。

### 版本 Versions
| 版本 | 说明 |
|------|------|
| `v1.2.0` | **网页端+桌面端双端可用**。修复桌面端 Electron 窗口浮球不可见问题。 |
| `v1.1.0` | 增强版：新增框选区域（pick-region）+ 采集调试 + 随机配色。**仅网页端可用**。 |
| `v1.0.0` | 旧版：内置区域样式 + 统一控制 + 主题。相对简单，兼容性更好。 |

---

## 用法 Usage

1. Click the floating **Aa** button (bottom-right).
2. **Tick** a region's checkbox → the settings panel expands below.
3. Adjust Chinese/English font, size, line-height, weight, italic, and color.
4. Use **统一颜色** / **统一字体** to apply a single setting to all regions.
5. Save your configuration as a **theme** (type a name, click 💾存).
6. Switch themes anytime via the dropdown + **应用** button.
7. Use **🎲 随机字体** / **🎨 随机颜色** for quick experimentation.

### 插件卡顿 Plugin stuck?
- Click the DSH "重载" (Reload) button, or
- Click the **Aa** floating button to collapse it — this triggers a full plugin rebuild.

---

## 快速上手 Quick start

**想给所有消息区域换一种字体/颜色？**
1. 点右下角 **Aa** 按钮打开面板。
2. 在 **全局统一** 区勾选 **统一字体** → 选中文/英文字体 → 所有区域立即统一。
3. 勾选 **统一颜色** → 点色块选色 → 所有区域统一变色。

**想单独设置 输入框 的字号？**
1. 打开面板 → 找到「输入区」卡片 → 勾选它的复选框（展开设置）。
2. 右侧列改 **字号** / **字重**，左侧列改中/英文字体。

**想存一套配色以后换着用？**
1. 调好各区域字体、颜色。
2. 在顶部输入框填名字 → 点 **💾存**。
3. 之后随时在下拉框选中 → 点 **应用** 切换。

---

## 原理 How it works

Pure **client-side** plugin. `lib/client.js` is a `__ModuleLoader__` bundle that:
1. Injects a `<style>` tag with CSS rules per enabled region.
2. Renders a floating control panel (vanilla JS, no framework).
3. Uses `localStorage` for persistence with a `SCHEMA_VERSION` sentinel.
4. `lib/index.js` is a minimal Cordis module so the bundle loads at all.

No host services, no external dependencies, no build step.

---

## 常见问题 FAQ

### 插件卡住了 / 样式不生效？
- 点击 DSH 左下角 **重载** 按钮。
- 或点击右下角 **Aa** 悬浮球使其折叠——折叠时会自动重建插件（删除旧注入样式并重新初始化）。

### 区域颜色互相串色 / 某区域颜色不对？
- 检查该区域是否被更靠前的区域（如 `body` 兜底区域）覆盖。
- 15 个预校准区域的顺序已按层叠优先级排列，但如果你自定义了区域，注意后列出的规则会覆盖前面的（同特异性）。
- 各区域的具体 CSS 选择器可在卡片中查看和编辑。

### 统一颜色/字体勾选了，但随机后没变化？
- 统一开关 **开启** 时，随机按钮直接改变统一值（统一颜色/字体本身），而不是改变各区域。这是正常行为——关掉统一开关后随机才会分别改各区域。

### 主题保存后找不到？
- 保存成功会有 toast 提示"已保存：xxx"。主题在下拉框中，选中后点击 **应用** 即可切换。
- 主题保存在 `localStorage`，升级插件版本也不会丢失。

### 面板字体怎么是楷体，和界面字体不一样？
- 面板字体固定为楷体（KaiTi），这是有意为之——防止插件自身的 CSS 规则覆盖面板 UI，确保面板始终可读。

---

## 文件结构 File structure

```
dsh-font-enhancer/
├── package.json        # Plugin manifest with dsh.bundle + dsh.client
├── cordis.patch.yml    # Cordis patch: registers the bundle
├── lib/
│   ├── index.js        # Host half (minimal Cordis module)
│   └── client.js       # Client bundle (all UI + logic, ~1000 lines)
├── README.md           # This file
├── LICENSE             # MIT
└── .gitignore
```

---

## 支持 Support

发现 bug 或有功能建议？欢迎在
[GitHub Issues](https://github.com/loyalchiiina/dsh-font-enhancer/issues) 提 issue。

Found a bug or have an idea? Open an issue at
[GitHub Issues](https://github.com/loyalchiiina/dsh-font-enhancer/issues).

---

## License

MIT