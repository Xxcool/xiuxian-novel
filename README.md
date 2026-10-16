# 签到修仙：从废柴到万古一帝

一部「废柴少年获得系统后逆袭」的修仙爽文在线阅读站。

**Vue 3 + Vite + Naive UI + `@likecoin/epub-ts`** 单页应用。章节 Markdown 在浏览器内被打包成标准 EPUB2，交由专业阅读库渲染成带翻页、进度、多主题的仿真书页面。

线上地址：https://xiuxian-novel.pages.dev

---

## ✨ 功能特性

### 阅读体验

- **专业分页阅读器**：分页、翻页、进度定位全部由阅读库接管，零手写分页逻辑。
- **5 套主题**（中性灰阶底色 + 单一墨青强调色，切换后记忆）：

  | key | 名称 | 背景 | 文字 | 说明 |
  |-----|------|------|------|------|
  | `light` | 极简白 | `#ffffff` | `#1c1c1e` | 白天首选（默认） |
  | `paper` | 暖纸白 | `#faf8f5` | `#2b2823` | 柔和护眼 |
  | `sepia` | 宣纸 | `#f5f1e8` | `#33302a` | 仿纸质书 |
  | `green` | 青瓷 | `#eef4f2` | `#22322e` | 淡雅护眼 |
  | `night` | 深夜 | `#15171a` | `#c9ccd1` | 夜间首选（深色默认） |

  跟随系统 `prefers-color-scheme` 选择初始主题，`index.html` 内联脚本提前注入底色以避免首屏闪白。
- **字号 / 行距**：四档字号（小·中·大·特大）+ 三档行距（紧凑·标准·宽松），实时生效并持久化。
- **多端翻页**：
  - 桌面端：点正文左/右**边缘区**（各 28%）翻页，`←` `→` 与空格翻页。
  - 移动端：左右滑动翻页、轻触左右边缘翻页。
  - **边界跳章**：本章翻到末页继续向右 → 进入下一章；首页向左同理。
- **沉浸阅读**：点击正文**中央区**隐藏顶栏、底部导航与翻页箭头，只留正文；再点一次或按 `Esc` 恢复，顶栏在沉浸态下提供退出按钮。
- **失败兜底**：EPUB 渲染异常时自动回退为普通滚动阅读，保证永远有可读内容。

### 进度与目录

- **进度记忆**：记录当前章、本章百分比与已读清单（localStorage）。首页顶部出现「继续阅读」卡片，含细进度条，可一键续读。
- **目录分组**：章节按每 20 章折叠分组，默认展开当前阅读所在组，每组显示已读数。
- **目录搜索**：按章名或章号过滤，命中片段高亮；搜索态自动展平分组。
- **当前章高亮**：列表自动高亮正在读的章节并滚动到视野中央。
- **设置收纳**：主题 / 字号 / 行距收进底部面板（顶栏 ⚙ 触发），移动端不因顶部控件过多误触翻页手势。

---

## 🧱 技术栈

| 能力 | 选型 |
|------|------|
| 框架 | Vue 3 + Vite 5 |
| 路由 | vue-router 4（History 模式，SPA 深链接） |
| UI 组件 | Naive UI 2（`n-config-provider` + `themeOverrides`） |
| Markdown → HTML | `marked` |
| EPUB 打包 | `jszip`（浏览器内生成 EPUB2 Blob） |
| 阅读渲染 | `@likecoin/epub-ts`（分页 / 翻页 / 主题注入 / CFI 进度） |
| 部署 | Cloudflare Pages（连接 GitHub `main`，push 即部署） |
| 包管理 | pnpm（Node ≥ 20，仓库含 `.nvmrc`） |

---

## 📁 目录结构

```
novel_site/
├── index.html                # Vite 入口（含首屏主题防闪脚本）
├── package.json
├── pnpm-lock.yaml
├── vite.config.js
├── public/_redirects         # SPA 深链接兜底：/* /index.html 200
└── src/
    ├── main.js                 # Vue 应用入口
    ├── App.vue                 # 根组件（n-config-provider 主题壳）
    ├── router/                 # / 首页目录、/chapter/:slug 阅读页
    ├── views/
    │   ├── Home.vue            # 首页：hero + 继续阅读卡片 + 目录
    │   └── Chapter.vue         # 阅读页：md → HTML → EPUB → 阅读器
    ├── components/
    │   ├── EpubReader.vue      # 封装 epub-ts：分页渲染 + 手势接管
    │   ├── AppNav.vue          # 顶栏（目录抽屉 + 设置 + 沉浸退出）
    │   ├── ChapterList.vue     # 目录：分组 / 搜索 / 已读标记
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

| 环节 | 约束 | 原因 |
|------|------|------|
| 章节加载 | `import.meta.glob` **不带** `eager: true` | 110 章约 23 万字（源 md 共 849 KB），全量内联会把正文全部塞进首屏 JS |
| `chapter.xhtml` | 必须经 `toXhtml()` 处理 | EPUB 以严格 XML 解析，`<hr>` 等 HTML5 void 元素未自闭合会报错 |
| `content.opf` | 必须声明 `xmlns:opf` | 否则 manifest 会被 epub-ts 的 XML 解析截断 |
| `mimetype` | 首个写入且 `compression: 'STORE'` | EPUB 规范要求，压缩或错位会导致解析失败 |
| 渲染容器 | `renderTo({ snap: false, allowScriptedContent: true })` | 关闭库内置滑动，避免与自接管手势抢事件；允许脚本否则 srcdoc iframe 内主题注入被拦截 |
| 手势监听 | 挂在 iframe 的 `contentDocument` 上 | 库内置 Touch 管理器监听 iframe 外层，收不到 iframe 内触摸事件 |
| 点击热区 | 左 28% / 中 / 右 28% 三分 | 两侧翻页、中央切换沉浸模式；滑动翻页互不影响 |

---

## 📝 版本

当前 `package.json` 版本：`4.0.0`（UI 改版：现代极简设计体系 + 进度记忆 / 沉浸阅读 / 目录分组搜索）。

## 📄 许可证

本仓库为小说演示项目，章节内容仅供学习交流。
