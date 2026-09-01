# Changelog

All notable changes to **dsh-font-enhancer** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-09-01

### ✨ 新增（New）
- **桌面端 + 网页端双端可用**：修复桌面 Electron 窗口默认区域不变色的问题
  （改用稳定的 `data-slot` 属性定位，不再依赖会随 DSH 升级变化的 CSS-Modules 哈希类名）。
- **一键下载安装可爱字体**：内置推荐字体列表（霞鹜文楷、得意黑、站酷快乐体、Comic Neue、
  Baloo 2、Fredoka、Nunito、Caveat），点「⬇ 一键安装」自动下载并安装到系统，带**实时下载进度百分比**，
  安装后**自动加入字体下拉**，并显示安装路径。
- **添加自提供安装包**：点「📁 添加自提供安装包」→ 选电脑上的 .ttf/.otf 字体文件 → 安装并加入字体列表，
  完全 DIY。
- **🔄 刷新按钮**：新装字体后点「刷新」，强制 Chromium 加载新字体并刷新下拉列表，无需关闭面板。
- **保存方案记住统一状态**：保存方案时记住「统一颜色/统一字体/字重/斜体」的勾选状态，应用方案时完整复原。
- **全局统一区新增字重 + 斜体**控制。

### 🎨 界面优化（UI）
- 删除「采集区域」调试按钮。
- 合并「保存方案」为单一按钮。
- 新增「🗑 清空全部」主题按钮。
- 面板底部加「📖 快速上手（30 秒学会）」说明书 + 网页端刷新提示。

### 🔧 其他
- `lib/index.js` 升级为带 `webServer` 的双面插件，新增 `/install-font`、`/upload-font`、`/font-progress` 路由。
- 内置 `ComicNeue.ttf`（57KB，OFL 授权）。
- package.json 增加「字体」「DIY」等中英文搜索关键词，插件市场搜「字体」即可找到。

[1.3.0]: https://github.com/loyalchiiina/dsh-font-enhancer/releases/tag/v1.3.0

## [1.0.0] - 2026-08-27

### Added
- **Per-region styling**: 15 pre-calibrated regions covering the whole DSH UI
  (left sidebar, logo, workspace name, conversation messages, session title,
  input/composer, tabs, turn indicator, agent/model name, right extension,
  code blocks, bottom bar, …). Each region gets its own Chinese font, English
  font, font-size, line-height, weight, italic and text color.
- **Unified overrides**: a single *Unified Color* and *Unified Font* switch that
  applies one setting to all enabled regions at once.
- **Theme system**: save the full configuration (all regions' fonts + colors)
  as a named theme; apply, rename and delete themes from the panel. Themes
  persist across DSH restarts and version bumps.
- **Random generators**: *Random Font* and *Random Color*, both global (all
  enabled regions) and per-region. When a unified override is active, the
  randomizer randomizes that unified value instead.
- **Floating panel**: a draggable `Aa` button that opens a left-right layout
  panel; collapsing the button rebuilds the plugin (self-healing).
- **Toast notifications**: all save/apply/delete actions confirm via an inline
  toast instead of `window.alert`.
- Fixed the panel font to KaiTi so it never changes with the plugin's own rules.

[1.0.0]: https://github.com/loyalchiiina/dsh-font-enhancer/releases/tag/v1.0.0