# Changelog

All notable changes to **dsh-font-enhancer** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [1.1.0] - 2026-09-01

### Added
- **框选区域（Pick Region）**: 在界面上点选元素，自动生成稳定选择器（`data-fe-reg` 属性），
  合并成一个区域进行样式设置，无需手动编辑 CSS 选择器。
- **➕添加元素**: 为已有框选区域追加更多元素。
- **采集调试模式（Record）**: 开启后框选/添加元素能记录元素定位路径到日志文件，
  用于排查选择器跨重启是否失效。
- **框选取代默认**: 一键删除所有内置区域，只保留框选的区域。
- **恢复默认**: 删除框选区域，恢复预校准的内置区域。
- **保存方案**（Save Config）: 把当前框选区域配置方案保存到宿主，重启后自动恢复。

### Changed
- `lib/index.js` 从无依赖的空壳（`inject: []`）升级为带 `webServer` 的双面插件，
  注册 `/dsh-font-enhancer/{health,get,set,client-alive,log}` 5 个路由，实现
  客户端状态持久化、心跳监测和操作日志。
- `lib/client.js` 大幅扩展，新增框选/采集/保存方案等功能模块。
- Built-in regions 从 15 个精简为基础等价类别，由用户通过框选自行定制。

### ⚠️ 重要说明
- **当前版本仅保证 DSH 网页端（浏览器访问 Web GUI）正常变色**。
- 桌面端 Electron 窗口的样式适配仍在开发中。框选标记 `data-fe-reg` 只打在网页渲染的
  DOM 上，桌面窗口暂时无法匹配。
- 桌面端用户请先用 `dsh plugin add dsh-font-enhancer@1.0.0` 回退到旧版，或等待后续更新。

[1.1.0]: https://github.com/loyalchiiina/dsh-font-enhancer/releases/tag/v1.1.0
[1.0.0]: https://github.com/loyalchiiina/dsh-font-enhancer/releases/tag/v1.0.0