# Changelog

## 1.5.3 — 2026-10-23

### 🔴 修复：一键安装的字体从来没生效过（用户实测「装完选了一点变化都没有」）

这是本插件最严重的一个 bug，从第一版就在，且**只靠读代码看不出来**——
因为每一步都"看起来成功了"：进度条走完、文件确实躺在字体目录里、
下拉列表里也确实多了一个名字。

**根因：只复制文件，从不注册。** 旧版 installFont 的全部工作就是
`copyFileSync` / `downloadTo` 把 .ttf 写进
`%LOCALAPPDATA%\Microsoft\Windows\Fonts`，然后 resolve `{ok:true}`。
全插件 grep `AddFontResource|reg add|RegSetValue|CurrentVersion\Fonts`
零命中 —— 既没写 `HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts`，
也没调 `AddFontResourceW`。那个目录只是「用户字体存放处」，
**不写注册表就等于没有安装**：系统不认、Chromium 也不枚举。

实测铁证（修前）：目录里 `LXGWWenKai-Regular.ttf`（19073964 B）与
`ZCOOLKuaiLe-Regular.ttf`（1514968 B）早已存在，但
`System.Drawing.Text.InstalledFontCollection` 共 285 个字体族、
注册表 HKLM+HKCU Fonts 共 362 项里，`WenKai|Kuai|Baloo|Fredoka|Nunito|Caveat|文楷|得意`
**全部零命中**。

**修法（两条腿，缺一不可）**

1. **系统侧**：新增 `registerFontWin(filePath, family)` ——
   先 `reg.exe add HKCU\...\Fonts /v "<Family> (TrueType)" /d <绝对路径>`（免管理员），
   再经 PowerShell（`-ExecutionPolicy Bypass`，本机禁 .ps1）`Add-Type` 调
   `AddFontResourceW` 并 `SendMessageTimeoutW(HWND_BROADCAST, WM_FONTCHANGE)`，
   立即生效、无需重启。安装、重装（already 分支）、上传三条路径全部接上。
   > 重装分支也要注册，这点很关键：老版本已经把文件下好了，
   > 若只在「新下载」时注册，那些用户永远修不好。
2. **页面侧**：新增 `GET /installed-fonts`（返回本机已装字体 + 全部别名）与
   `GET /user-font?file=xxx.ttf`（直接吐 .ttf 字节）。客户端
   `feSyncInstalledFonts()` 拉清单后为每个别名生成 `@font-face`
   注入 `#dsh-fe-fontfaces`。这样即使系统枚举因会话缓存/权限不刷新，
   CSS 也一定命中真实文件。

顺带把「已装」状态做进 UI：面板里已安装的推荐字体直接显示
**✅ 已安装** 并禁用按钮，不再让用户对着已装字体反复点「一键安装」。

### 🔴 修复：5 个字体下载地址已 404

| 字体 | 旧地址 | 现状 |
|---|---|---|
| Baloo 2 | `.../ofl/baloo2/Baloo2-Regular.ttf` | 404 —— Google Fonts 已改为可变字体 `Baloo2[wght].ttf` |
| Fredoka | `.../ofl/fredoka/Fredoka-Regular.ttf` | 404 —— 实为 `Fredoka[wdth,wght].ttf` |
| Nunito | `.../ofl/nunito/Nunito-Regular.ttf` | 404 —— 实为 `Nunito[wght].ttf` |
| Caveat | `.../ofl/caveat/Caveat-Regular.ttf` | 404 —— 实为 `Caveat[wght].ttf` |
| Smiley Sans | `.../smiley-sans/releases/download/v2.0.1/SmileySans-Oblique.ttf` | 404 —— 该 release 只发 zip，无散装 ttf |

现在统一改走 jsDelivr 镜像（`cdn.jsdelivr.net/gh/google/fonts@main/...` 与
`cdn.jsdelivr.net/npm/@fontpkg/smiley-sans@2.0.4/...`），逐个 GET 校验过
TTF magic `00010000` 与字节数（Baloo2 683200 / Fredoka 159184 /
Nunito 276932 / Caveat 403648 / SmileySans 2629764）。
霞鹜文楷保持原 GitHub release 地址（实测 200、19073964 B）。

### ✨ 改进

- 字体目录新增 `family` 字段（真实家族名，从 TTF `name` 表核对），
  作为注册表值名与 CSS `font-family`；族名写错 = 装了个永远不会被命中的字体。
- 自备字体上传同样注册进系统，并把别名记入
  `~/.dsh/data/dsh-font-enhancer/user-fonts.json`，重启后仍可解析。
- 新增 `/installed-fonts`、`/user-font` 两条路由（共 11 条）。

### 📄 文档

更正「内置 8 款字体」的说法：**随包内置的只有 Comic Neue 一款**（57248 B），
其余 7 款首次安装时联网下载。README.md / README-zh.md / README-hi.md /
README-es.md / README-pt.md 与 `package.json`、`locale/*.json` 全部同步。
## 1.5.2 — 2026-10-19

### 🔴 修复：新增框选区域导致内置预设全丢 + 框选区域重启后失效

这两个是用户实机测试发现的真 bug，其中第一个是 1.5.2 修 issue #1 时**我自己引入的**。

**① 新增一个框选区域后，重启只剩它一个（内置预设全消失）**

修 issue #1 问题三时把加载逻辑写成「只要有框选区域，就只保留框选+自定义组」，
本意是防止内置组覆盖用户区域，但方向错了——`filter` 把 9 个内置预设直接丢掉，
用户看到的就是「加一个框选，其余全没了」。

现在：框选区域**追加**在预设之上，两者共存。唯一例外仍是同名——用户框选的
区域若与某个预设同名（例如自己框出一个「对话区」），以用户的为准替换掉预设；
同名框选之间只保留第一个。

用真实 `settings.json`（10 个区域：9 预设 + 1 框选）跑 `loadSettings`：
改前输出 9 个全是框选（预设归零），改后输出 10 个（9 预设 + 1 框选）。

**② 框选区域重启后选择器失效**

旧代码给框选元素打的标记是运行时属性 `data-fe-reg="uid"`，选择器就写成
`[data-fe-reg="uid"]`。这个属性只在当次会话的 DOM 上存在，**重启后界面重建、
属性消失，选择器匹配 0 元素**，整个区域失效。

现在框选时**同时**写入结构稳定路径，两条选择器逗号并联（CSS 里是 OR）：

- `[data-fe-reg="uid"]` —— 本次会话内精确命中
- `[data-slot="conversation.input.dock"] > div:nth-of-type(2) > span:nth-of-type(1)` —— 重启后照样有效

为此重写了稳定路径的推导规则：

- `stableSelFor` 优先级重排为 **data-slot > data-* > id > class > tag**。
  旧实现把 class 排在 data-* 之前，路径里塞满 CSS-Modules 哈希类名
  （形如 `.mMKm6W_dockInner`），这类名字随构建变化，重启/升级后基本必然失效。
- `stablePathFor` 一旦向上遇到 `data-slot` 锚点就停止收集并把它作为根，
  锚点**内部**各层改用 `tag:nth-of-type(n)`。既避开哈希类名，
  又不会像裸 tag 那样过度匹配（`div > span` 会命中整个区域的同类元素）。

**已失效的历史框选区域**：# 由于 `data-fe-reg` 属性早已随上次重启消失，
无法反推稳定路径，自愈逻辑只能标记 `_stale` 提示重框——这类区域需要**重新框选一次**，
之后就会带稳定路径、能跨重启存活。

### 变更：两个默认区域改名

| 旧名 | 新名 | 定位（`data-slot`） |
|---|---|---|
| 底部操作栏 | **底部左侧边栏** | `sidebar.footer.action` |
| 对话栏底部区域 | **todo进度** | `conversation.input.dock` |

选择器与颜色均未变动，只改显示名。老用户设置里存的旧名会被
`REGION_NAME_MIGRATIONS` 自动迁移到新名（`normRegion` 内统一改写，
localStorage 与宿主快照两条加载路径都覆盖），不会出现新旧两名并存。

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

### 新增：默认区域扩为 10 项 —「底部对话信息栏」

用户实机框选了一个「底部对话信息栏」并确认跨重启可用后，要求把它固化为内置默认项
（原来只能靠手框，`data-fe-reg` 机制在重装/换包名后仍可能失效）。

**定位依据（真实 DOM 逐层 dump 取证，2026-10-18）**：

```
conversation.composer.bar
└─ div:nth-of-type(1)
   └─ div:nth-of-type(2)
      ├─ div[data-slot="conversation.composer.dock"]   ← 「28 轮 1650 步·227 tok/s」「293M tok·缓存命中 98%」
      └─ span                                          ← 右侧百分比「23%」
```

采用**两个并列选择器**（CSS 里逗号 = OR）：

```js
'[data-slot="conversation.composer.dock"],
 [data-slot="conversation.composer.bar"] > div:nth-of-type(1) > div:nth-of-type(2)'
```

- 第一个是稳定的 `data-slot` 锚点，不受 CSS-Modules re-hash 影响 —— 主锚点。
- 第二个是外层父节点，把右侧百分比一并纳入 —— 单用 `data-slot` 时它不在范围内
  （实测 `textContent` 对比：前者尾部是「98%」，后者多一个「23」）。
- 颜色取深粉 `#FF1493`，分组归「对话区」。

**`SCHEMA_VERSION` 22 → 23**：已装过插件的用户，`regions` 存在于 localStorage 与
宿主快照里，`loadSettings()` 根本不会读 `DEFAULT_REGIONS()`，不升版本号就永远
拿不到第 10 项。

### 🔴 修复：版本升级会清空用户的「框选」区域

改上面那次版本号时发现的连带隐患 —— 升级分支原来是：

```js
var fresh = { regions: DEFAULT_REGIONS(), themes, unified, customFonts, ver };
//              ^^^^^^^^^^^^^^^^ 用户框选区域在这里全部丢失
```

注释写的是「keep themes & unified & customFonts」，但 `regions` 直接整份替换，
意味着**schema 每升一次版本，用户就要重新框选一遍**，属数据丢失级 bug。

现在的口径：

1. 默认项以 `DEFAULT_REGIONS()` 为准；
2. 用户的「框选」/「自定义」区域**追加**回来；
3. **同名**（例如用户手框过「底部对话信息栏」，而它现在已是默认项）→ 用
   **默认项的选择器**（纯 `data-slot`，永不受 re-hash / `data-fe-reg` 重建影响）
   ＋ **用户的样式设置**（字体/字号/行高/颜色…）。既拿到稳定锚点，又不丢外观；
4. 其余框选原样保留，不重复 push。

隔离实跑（抽取 `DEFAULT_REGIONS` / `normRegion` 真跑，模拟「ver 22 + 10 区域 +
一个同名框选 + 一个自框区域」）：

| 断言 | 结果 |
|---|---|
| 区域数 = 10 默认 + 1 自框 = 11 | ✅ |
| 含 `data-fe-reg` 的脏选择器被替换成 `data-slot` | ✅ |
| 用户颜色 `hsl(254, 90%, 50%)` 保留 | ✅ |
| 用户自框的其它区域保留 | ✅ |
| 原 9 个默认项一个不少 | ✅ |

真机探针复核（`SCHEMA_VERSION=23`，10 项）：两个选择器均 `HIT`，
`font-family=Garamond, "Microsoft YaHei", sans-serif`、`color=rgb(66, 13, 242)`
（= 用户设的 `hsl(254,90%,50%)`）确实落到元素上，不是只存在于列表里不生效。

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


