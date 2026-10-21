# 签到修仙：从废柴到万古一帝

一部「废柴少年获得系统后逆袭」的修仙爽文在线阅读站。

**Vue 3 + Vite + Naive UI + `@likecoin/epub-ts`** 单页应用。章节 Markdown 在浏览器内被打包成标准 EPUB2，交由专业阅读库渲染成带翻页、进度、多主题的仿真书页面。

- 线上阅读：<https://xiuxian-novel.pages.dev>
- 源码仓库：<https://github.com/Xxcool/xiuxian-novel（站点右上角> GitHub 图标可直接跳转）

---

## ✨ 功能特性

### 阅读体验

- **专业分页阅读器**：分页、翻页、进度定位全部由阅读库接管，零手写分页逻辑。
- **三套主题**，各自配一套完整的「底色 + 正文色 + 强调色 + 首页景图」，切换后记忆：

  | key     | 名称 | 背景        | 文字        | 强调色          | 首页景图                 | 说明                 |
  | ------- | -- | --------- | --------- | ------------ | ------------------------ | ---------- |
  | `night` | 月下 | `#1e2630` | `#d5dbe1` | 金 `#c9ad75`  | `moonlit-mountains.webp` | 深夜护眼（深色默认） |
  | `warm`  | 暖白 | `#f8f7f2` | `#24352f` | 墨绿 `#27533f` | `warm-mountains.webp`    | 清爽书房（浅色默认） |
  | `paper` | 宣纸 | `#f7f1e7` | `#302c27` | 朱砂 `#a44334` | `paper-mountains.webp`   | 温和护眼             |

  主题唯一来源是 `src/data/theme.js`：`THEME_LIST` 定义底色/正文/强调，`SHELL` 定义该主题下的浮层、描边、阴影与目录底板色，全部以 CSS 变量注入 `documentElement`。

  - **首屏防闪**：`index.html` 内联脚本在 CSS 加载前就把底色写到 `<html>` 上。
  - **切换零残留**：切换主题时同步改写 `<html>` 的内联 `backgroundColor`（内联样式优先级最高、不会随 CSS 变量自动更新），否则正文之外的区域会残留首次加载的主题色。
  - **正文同步**：EPUB 内容在 `srcdoc` iframe 里，追加式主题规则可能被旧规则覆盖；切换时用 `rendition.themes.override(..., true)` 把正文背景与文字色**强制写入**，保证外壳与正文永远同色。
- **字号 / 行距**：四档字号（小·中·大·特大）+ 三档行距（紧凑·标准·宽松），实时生效并持久化。
- **StPageFlip 真实物理仿真翻书引擎（番茄/七猫/Apple Books 同款）**：
  - **真实双面卷纸与受力弯曲**：正文文字真实印在被掀起的纸张表面，随着手指从右下角拉动产生高保真物理拱起卷曲；
  - **背光透字与立体光影**：翻折过去的纸张背面自然显现正文的微弱镜像透光字迹，折卷处带有圆柱高光与落到底层的深邃漫反射软阴影；
  - **真实透底下一页**：被卷起的纸页下方，真真切切露出的就是下一页排版的正文文字，带来如同抚摸实体书页的极致手感；
  - **物理惯性与回弹决断**：松手后根据拖拽距离和划动瞬时速度，自动平滑加速翻过，或弹性回弹放平纸张；
  - **全屏边缘点击卷页**：桌面端/移动端轻触右边缘自动从右下角掀起翻页；轻触左边缘从左下角翻回上一页；
  - **高精度流式 DOM 分页器**：基于原生 DOM 毫秒级分页测算，告别沙盒 iframe，彻底根除文字被截断与排版错位问题。
- **多端翻页**：
  - 桌面端：点正文左/右**边缘区**（各 28%）翻页，`←` `→` 与空格翻页。
  - 移动端：左右滑动拖拽卷页、轻触左右边缘翻页。
  - **边界跳章**：本章翻到末页继续向右 → 进入下一章；首页向左同理。
- **PWA 渐进离线与安装**：
  - 集成 `vite-plugin-pwa`，支持「添加到主屏幕」作为独立沉浸 App 运行（无浏览器地址栏）。
  - **闲时平滑全本离线**：首屏零阻塞，延后利用 `requestIdleCallback` 在后台分批预存全书章节 chunk，不抢占前台网络，断网与飞行模式下整本 110 章畅读秒开。
- **沉浸阅读**：点击正文**中央区**隐藏顶栏、底部导航与翻页箭头，只留正文；再点一次或按 `Esc` 恢复，顶栏在沉浸态下提供退出按钮。
- **失败兜底**：EPUB 渲染异常时自动回退为普通滚动阅读，保证永远有可读内容。

### 进度与目录

- **进度记忆**：记录当前章、本章百分比与已读清单（localStorage）。首页顶部出现「继续阅读」卡片，含细进度条，可一键续读。
- **目录分组**：章节按每 20 章折叠分组，默认展开当前阅读所在组，每组显示已读数。
- **目录搜索**：按章名或章号过滤，命中片段高亮；搜索态自动展平分组。
- **当前章高亮**：列表自动高亮正在读的章节并滚动到视野中央。
- **设置收纳**：主题 / 字号 / 行距收进底部面板（顶栏「设置」触发），移动端不因顶部控件过多误触翻页手势。
- **章节区间**：目录顶部按每 20 章一段的区间 tab，可横向滚动且隐藏滚动条（窄屏也不挤压断行）。
- **目录双形态**：首页用 `panel` 形态（两列网格 + 大标题），抽屉里用 `drawer` 形态（单列紧凑、无大标题），同一组件靠 `variant` 区分。
- **仓库入口**：右上角 GitHub 图标，新标签页打开源码仓库。

### 版面

- **全幅通栏**：导航与内容铺满整页，页面底色即主题底色（`body` 直接用 `var(--bg)`），不再做「浮在背景上的圆角面板」，因此不存在「面板外第二块颜色」。
- **同色契约**：`--panel-bg` / `--reader-bg` 一律指向 `var(--bg)`，短页面底部也不会露出内容色与页面色的细微色差。
- **首页**：大幅景图承托书名（景图随主题切换），目录作为独立底板接在其后。
- **正文**：章节标题、EPUB 书页、底部翻页区三段式；章节号两侧的渐变装饰线与目录标题下的 `heading-rule` 同款。

### 品牌视觉

- **印章**：顶栏书名旁是一枚朱文印——竖排「修仙」、朱砂描边、微旋转模拟手盖；印章色 `--seal-ink` 跟随主题（深色底自动提亮），与 favicon 同源。
- **标题字体**：书名 / 站名使用 `--font-display`：内嵌「马善政」毛笔楷书子集（只含站名/书名 10 个字，woff2 约 4.6KB，`unicode-range` 限定）优先，其余字回退系统楷 → 隶 → 宋字体栈，任何设备都是毛笔字效果且几乎零加载成本。
- **favicon**：同一枚印章的三种形态——`favicon.svg`（矢量优先）、`favicon.ico`（16px 单字防糊 + 32/48 双字）、`favicon.png`（180px apple-touch-icon）。

---

## 🧱 技术栈

| 能力              | 选型                                                 |
| --------------- | -------------------------------------------------- |
| 框架              | Vue 3 + Vite 5                                     |
| 路由              | vue-router 4（History 模式，SPA 深链接）                   |
| UI 组件           | Naive UI 2（`n-config-provider` + `themeOverrides`） |
| Markdown → HTML | `marked`                                           |
| 流式分页器       | Smart DOM Paginator（纯前端毫秒级流式测算）         |
| 仿真翻书物理引擎 | `page-flip` (StPageFlip 物理翻卷、背光透字、双面纸张) |
| 离线与 PWA        | `vite-plugin-pwa` + Workbox（闲时分级预缓存、独立 App 安装）   |
| 部署              | Cloudflare Pages（连接 GitHub `main`，push 即部署）        |
| 包管理             | pnpm（Node ≥ 20，仓库含 `.nvmrc`）                       |

---

## 📁 目录结构

```
novel_site/
├── index.html                # Vite 入口（含首屏主题防闪脚本）
├── package.json
├── pnpm-lock.yaml
├── vite.config.js
├── public/
│   ├── _redirects            # SPA 深链接兜底：/* /index.html 200
│   └── images/               # 三主题首页景图（WebP，三张共约 336 KB）
└── src/
    ├── main.js                 # Vue 应用入口
    ├── App.vue                 # 根组件（n-config-provider 主题壳）
    ├── router/                 # / 首页目录、/chapter/:slug 阅读页
    ├── views/
    │   ├── Home.vue            # 首页：hero + 继续阅读卡片 + 目录
    │   └── Chapter.vue         # 阅读页：md → HTML → EPUB → 阅读器
    ├── components/
    │   ├── EpubReader.vue      # 封装 epub-ts：分页渲染 + 手势接管 + 正文配色强制写入
    │   ├── AppNav.vue          # 顶栏（目录抽屉 + 设置 + GitHub 入口 + 沉浸退出）
    │   ├── ChapterList.vue     # 目录：分组 / 搜索 / 已读标记（panel / drawer 双形态）
    │   ├── ChapterNav.vue      # 底部 上一章 · 目录 · 下一章
    │   ├── ReaderSettings.vue  # 底部设置面板（主题 / 字号 / 行距）
    │   └── ReadingProgress.vue # 顶部细进度条
    ├── composables/
    │   ├── useTheme.js           # 主题 key + 持久化 + CSS 变量注入
    │   ├── useReaderSettings.js  # 字号 / 行距 + 持久化
    │   ├── useReadingProgress.js # 阅读位置与已读清单（localStorage）
    │   └── useImmersive.js       # 沉浸模式开关（跨组件单例状态）
    ├── data/
    │   ├── chapters.js         # 章节清单（脚本生成，勿手工编辑）
    │   ├── theme.js            # 主题注册表（单一来源）
    │   └── loader.js           # 章节 md 按需加载 + 缓存 + 相邻预取
    ├── styles/global.css       # 全局设计令牌（CSS 变量，随主题变化）
    ├── styles/novel.css        # 站点版面：全幅通栏 + 三主题首页 / 正文 / 抽屉
    ├── content/                # 章节 Markdown 源（每章一个独立 chunk）
    └── utils/epub-builder.js   # marked HTML → 合规 EPUB2 Blob
```

---

## 🚀 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 产物输出到 dist/
pnpm preview    # 本地预览构建产物 http://localhost:4173
```

---

## 🔍 阅读器渲染链路

### 为什么要绕这一圈

Markdown 可以直接 `v-html` 渲染，本站却在浏览器里先把它包成 **EPUB2** 再交给阅读库——目的是换取三项自己很难做好的能力：**真分页排版**、**CFI 定位的精确阅读进度**、**稳定的跨端翻页与边界检测**。代价是多一层打包环节。

### 完整链路

```
① output/*.md                    创作源（唯一事实源，在工作区根）
        │  同步复制
        ▼
② src/content/第NN章_标题.md      构建资源
        │  import.meta.glob(lazy) —— 每章编译为独立 chunk，
        │                            访问时才下载，首屏不含正文
        ▼
③ getChapterRaw(slug) → md 文本   loader.js（含内存缓存 + 相邻章节预取）
        │  marked.parse()
        ▼
④ HTML 片段
        │  epub-builder.js
        │    · toXhtml()  规整为严格 XML
        │    · JSZip 打包
        ▼
⑤ EPUB2 Blob
   ├── mimetype        （必须首个写入且不压缩）
   ├── META-INF/container.xml
   └── OEBPS/
       ├── content.opf
       ├── toc.ncx
       └── chapter.xhtml
        │  @likecoin/epub-ts：ePub() → book.ready → renderTo()
        ▼
⑥ srcdoc iframe 分页渲染
        │  rendition.display()
        ▼
⑦ 仿真书页面
   · 主题  → themes.register / select
   · 字号行距 → themes.override
   · 进度  → relocated 事件 → CFI 百分比
```

> 每一章都是**独立的 EPUB**。因此 `relocated` 上报的百分比天然对应「本章内位置」：100% 即本章末页、0% 即本章首页，边界检测与「末页跳下一章」都以此为唯一依据。

### 关键实现约束

| 环节              | 约束                                                      | 原因                                                |
| --------------- | ------------------------------------------------------- | ------------------------------------------------- |
| 章节加载            | `import.meta.glob` **不带** `eager: true`                 | 110 章约 23 万字（源 md 共 849 KB），全量内联会把正文全部塞进首屏 JS     |
| `chapter.xhtml` | 必须经 `toXhtml()` 处理                                      | EPUB 以严格 XML 解析，`<hr>` 等 HTML5 void 元素未自闭合会报错     |
| `content.opf`   | 必须声明 `xmlns:opf`                                        | 否则 manifest 会被 epub-ts 的 XML 解析截断                 |
| `mimetype`      | 首个写入且 `compression: 'STORE'`                            | EPUB 规范要求，压缩或错位会导致解析失败                            |
| 渲染容器            | `renderTo({ snap: false, allowScriptedContent: true })` | 关闭库内置滑动，避免与自接管手势抢事件；允许脚本否则 srcdoc iframe 内主题注入被拦截 |
| 手势监听            | 挂在 iframe 的 `contentDocument` 上                         | 库内置 Touch 管理器监听 iframe 外层，收不到 iframe 内触摸事件        |
| 点击热区            | 左 28% / 中 / 右 28% 三分                                    | 两侧翻页、中央切换沉浸模式；滑动翻页互不影响                            |

---

## 📝 版本

当前 `package.json` 版本：`4.2.0`。

| 版本      | 变更                                                                                                                            |
| ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `4.2.0` | 品牌印章视觉（顶栏朱文印 + 印章 favicon 三件套）；书名/站名内嵌毛笔楷书子集字体（马善政，OFL，woff2 约 4.6KB）；修复「下一章」预取缓存命中后返回字符串导致 `.then` 报错、正文卡「载入中」的 bug |
| `4.1.0` | 三套主题（月下 / 暖白 / 宣纸）各自配齐底色、正文色、强调色与首页景图；全幅通栏版面；主题切换零残留（`<html>` 内联底色同步 + iframe 正文配色强制写入）；顶栏图标化并新增 GitHub 入口；目录区间 tab 可滚动且隐藏滚动条 |
| `4.0.0` | UI 改版：现代极简设计体系 + 进度记忆 / 沉浸阅读 / 目录分组搜索；章节 md 改为按需加载                                                                            |

## 📄 许可证

本仓库为小说演示项目，章节内容仅供学习交流。
