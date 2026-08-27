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

[1.0.0]: https://github.com/loyalchiiina/dsh-font-enhancer/releases/tag/v1.0.0