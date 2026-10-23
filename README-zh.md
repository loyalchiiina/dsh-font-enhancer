# dsh-font-enhancer

> 按区域自定义 DSH 界面字体、字号、行距、字重、斜体与文字颜色；支持框选建区、全局统一、主题方案保存切换、随机配色、8 款字体一键安装（1 款随包内置 + 7 款联网下载），并与另外两个悬浮球共享 128 款皮肤。

> 本页是中文速查。完整文档（含英文对照、原理、FAQ、文件结构）以 [README.md](./README.md) 为准。

---

## 它到底能做什么

一句话：**给 DSH 界面上的每一块文字单独决定长什么样，并且活过重启。**

| 能力 | 说明 |
|---|---|
| 按区域设置 | **10 个**内置预校准区域，每个区域独立设置中文字体 / 英文字体 / 字号 / 行距 / 字重（100–900）/ 斜体 / 文字颜色 |
| 框选建区 | 在实时页面上直接点选元素，合并成一个自命名区域，**无需写 CSS 选择器** |
| 全局统一 | 「统一颜色」「统一字体」「统一斜体」三个开关，一次设置套用到所有启用区域 |
| 主题方案 | 整套配置存成命名方案，随时应用 / 重命名 / 删除 / 清空 |
| 随机生成 | 🎲 随机字体、🎨 随机配色（黄金角高区分度取色） |
| 字体安装 | **8 款**字体一键安装（带实时进度）：**Comic Neue 随包内置**，其余 7 款首次安装时联网下载；也可上传自己的 .ttf/.otf |
| 皮肤 | 与 dsh-todo-float-ball / dsh-skill-browser 共享 **128 款**悬浮球皮肤，三球实时同步 |
| 持久化 | localStorage 为主、宿主 `settings.json` 为备份，双写回读；跨刷新 / 跨重启 / 跨版本升级保留 |
| 双端 | DSH 网页端（浏览器）与桌面端（Electron）均可用 |

---

## 10 个内置区域

全部用 **`data-slot` 稳定属性**定位，不受 DSH 前端 CSS-Modules 哈希类名变化影响：

| # | 区域 | 选择器 |
|---|---|---|
| 1 | 左侧栏 | `[data-slot="sidebar"]` |
| 2 | 对话区 | `[data-slot="markdown"], [data-slot="conversation.chat.node"] > div` |
| 3 | 对话栏上方 | `[data-slot="conversation.session.header"]` |
| 4 | 输入区 | `[data-slot="conversation.composer"]` |
| 5 | todo进度 | `[data-slot="conversation.input.dock"]` |
| 6 | 工作区 | `[data-slot="sidebar.workspaces"]` |
| 7 | 对话信息显示 | `[data-slot="conversation.session.header.utilities"], [data-slot="conversation.session.header.actions"]` |
| 8 | 品牌标识 | `[data-slot="sidebar.brand.mark"], [data-slot="sidebar.brand.name"]` |
| 9 | 底部左侧边栏 | `[data-slot="sidebar.footer.action"]` |
| 10 | 底部对话信息栏 | `[data-slot="conversation.composer.dock"], ...` （v1.5.2 新增） |

---

## 字体清单

- **中文 18 款**：楷体、微软雅黑、微软雅黑 Light、宋体、黑体、新宋体、仿宋、等线、等线 Light、华文细黑、华文宋体、华文中宋、华文楷体、华文行楷、隶书、幼圆、方正舒体、方正姚体
- **英文 18 款**：Times New Roman、Arial、Calibri、Cambria、Georgia、Verdana、Tahoma、Segoe UI、Garamond、Book Antiqua、Palatino Linotype、Trebuchet MS、Lucida Sans Unicode、Comic Sans MS、Consolas (mono)、Courier New (mono)、Impact、Bahnschrift
- **一键安装 8 款**：Comic Neue（**随包内置，离线可用**）、霞鹜文楷、得意黑、站酷快乐体、Baloo 2、Fredoka、Nunito、Caveat（后 7 款首次安装时联网下载）
- **默认**：英文 Times New Roman、中文楷体

---

## 皮肤清单（128 款，三球共享）

| 分类 | 数量 |
|---|---|
| 招牌特效 | 28 |
| 浓郁深底 | 38 |
| 尘埃灰调 | 20 |
| 柔光深底 | 15 |
| 中性点缀 | 10 |
| 浅色纸面 | 17 |

---

## 面板怎么用

1. 点右下角 **Aa** 悬浮球打开面板
2. 顶部：主题下拉 + 名称输入框 + **💾 保存配置方案** / **应用选中主题** / ✏ 重命名 / ✕ 删除
3. 中部：**全局统一** 三开关 + **🖱 框选区域** + **🎲 随机字体** + **🎨 随机颜色** + **🔄 刷新**
4. 下部：按区域排列的卡片，勾选展开设置（左列字体、右列字号/行距/字重/斜体/颜色）；卡片头部右侧 6 个图标按钮 = 追加框选 / 高亮范围 / 随机字体 / 随机颜色 / 重置 / 删除
5. 底部：可爱字体一键安装 + 「📁 添加自提供安装包」

### 三个典型场景

- **整个界面换字体**：勾「统一字体」→ 选字体 → 全站生效
- **只改输入框字号**：找到「输入区」卡片 → 勾选 → 右列改字号
- **内置区域没覆盖的地方**：点「🖱 框选区域」→ 页面上点选元素 → 起名 → 生成新卡片

---

## 框选区域的三个附加操作

| 操作 | 作用 |
|---|---|
| ➕ 框选更多 | 往已有区域追加元素 |
| 🖱 高亮 | 高亮显示该区域覆盖了哪些元素，提示「该区域覆盖 N 个元素」 |
| 框选取代默认 | 删除全部内置区域，只保留你框选的 |
| 恢复默认区域 | 删除自定义区域，回到 10 个内置区域 |

---

## 安装

```bash
dsh plugin --profile desktop add dsh-font-enhancer
```

或从插件市场搜「字体」安装。

**已知报错**：若报 `minimumReleaseAge` 或 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`，这不是插件坏了——是 DSH 对刚发布 npm 包的 24 小时安全观察期。等一天再装即可。

---

## 数据存在哪

| 存储 | 内容 |
|---|---|
| localStorage | 区域配置、主题方案、统一状态、皮肤选择 |
| 宿主 `settings.json` | 同一份配置的备份，路径 `~/.dsh/data/dsh-font-enhancer/settings.json` |
| 已安装字体 | 宿主字体目录，经 `/dsh-font-enhancer/fonts/*` 提供 |

桌面端每次重启 origin 会变，localStorage 可能为空 → 从 `settings.json` 回读恢复。

---

## 常见问题

**样式不生效？** 点面板 **🔄 刷新**，或点 DSH「重载」，或把悬浮球收起再展开。

**装了字体下拉里没有 / 选了没变化？** 先点面板 **🔄 刷新**（会重新注入 `@font-face`，一般立刻生效）；桌面端仍不行点 DSH「重载」；网页端装的是**那台机器**的字体，换机器需重装。若显示「✅ 已安装」但字形没变，多半是下载中断导致文件损坏，删掉 `%LOCALAPPDATA%\Microsoft\Windows\Fonts\<文件名>` 后重装。

**统一开关开了随机没反应？** 统一开关开启时随机改的是统一值本身，不是各区域——设计行为。

**框选区域重启后失效？** v1.5.2 已修。若仍失效，用「🖱 高亮」看匹配到几个元素，显示「未匹配到任何元素」说明 DSH 前端结构变了，需重新框选。

**面板字体为什么是楷体？** 有意为之，防止插件自身 CSS 污染面板 UI。

---

## 更新日志

### v1.5.3 — 2026-10-23
- **修复（严重）**：一键安装的字体从未真正生效 —— 旧版只复制文件，不写注册表、不调 `AddFontResourceW`，系统和 Chromium 都看不到。现已补上注册 + 客户端 `@font-face` 双保险
- **修复**：5 个失效下载地址（Google Fonts 改为可变字体、得意黑 release 无散装 ttf），统一改走 jsDelivr
- **文档**：更正「内置 8 款」→ 随包内置仅 **Comic Neue 一款**，其余 7 款联网下载

### v1.5.2 — 2026-10-19
- **新增**：默认区域扩为 10 项，新增「底部对话信息栏」
- **修复**：新增框选区域后内置区域全部丢失
- **修复**：框选区域跨重启失效

详见 [CHANGELOG.md](./CHANGELOG.md)。

---

## 支持

[GitHub Issues](https://github.com/loyalchiiina/dsh-font-enhancer/issues)

## License

MIT
