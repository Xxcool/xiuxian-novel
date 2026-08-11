# 签到修仙：从废柴到万古一帝

一部「废柴少年获得系统后逆袭」的修仙爽文在线阅读站。

本仓库是 **Vue 3 + Vite + Naive UI + @likecoin/epub-ts** 单页应用（SPA）。章节 Markdown 在构建期内联进前端产物，运行时由浏览器在内存中打包成标准 EPUB2，再交给专业阅读器库渲染为**带翻页、进度、多主题**的仿真书页面。

线上地址：https://xiuxian-novel.pages.dev
代码仓库：https://github.com/Xxcool/xiuxian-novel

## ✨ 功能特性

- **专业阅读器**：基于 `@likecoin/epub-ts`（epubjs 的 TS 重制版），分页、翻页、进度定位全部由库接管，零手写分页逻辑。
- **5 套阅读主题**（日间/夜间护眼向，可切换并记忆）：
  | key | 名称 | 背景 | 文字 | 说明 |
  |-----|------|------|------|------|
  | `light` | 纯白 | `#ffffff` | `#222222` | 强光白天 |
  | `sepia` | 棕黄护眼 | `#f4ecd8` | `#5c4b38` | 最通用护眼（白天默认） |
  | `paper` | 宣纸浅黄 | `#fff9e8` | `#333333` | 仿纸质书 |
  | `green` | 豆沙浅绿 | `#C7EDCC` | `#2c4230` | 经典电脑护眼色 |
  | `night` | 深灰夜间 | `#1a1a1a` | `#cccccc` | 夜间首选（深色默认） |
- **字号 + 行距**：小 / 中 / 大 / 特大四档字号，紧凑 / 标准 / 宽松三档行距，实时生效并持久化。
- **多端翻页**：
  - 桌面端：点正文左/右半区翻上/下页，方向键 ←/→、空格翻页，底部「上一章/目录/下一章」胶囊导航。
  - 移动端（H5）：左右滑动翻页（仿真书吸附动画）、轻触正文左右半区翻页，手势统一在 iframe 内文接管，不依赖合成 click。
  - **边界跳章**：本章到末页再左滑 / 点右半区 → 自动进入下一章；首页同理回上一章。
- **目录高亮**：章节列表自动高亮「当前正在读」的章节并滚动定位到视野中央（阅读页顶栏「目录」、底部「目录」回首页均生效）。
- **阅读进度**：顶栏进度条由阅读器 CFI 定位事件驱动，精确反映本章阅读百分比。
- **设置收纳**：主题 / 字号 / 行距统一收进底部弹出的「阅读设置」面板（右上角 ⚙ 触发），顶栏仅留「目录 + 设置」两个图标，移动端不再因顶部控件过多而误触翻页手势。
- **阅读失败兜底**：EPUB 渲染若异常，自动回退为普通滚动阅读（v-html），保证永远有可读内容，不白屏。

## 🧱 技术栈

| 能力 | 选型 |
|------|------|
| 框架 | Vue 3 + Vite 5 |
| 路由 | vue-router 4（History 模式，SPA 深链接） |
| UI 组件 | Naive UI 2（n-config-provider + themeOverrides 主题系统） |
| Markdown → HTML | `marked` |
| EPUB 打包 | `jszip`（浏览器内生成 EPUB2 Blob） |
| 阅读渲染 | `@likecoin/epub-ts`（分页 / 翻页 / 主题注入 / CFI 进度） |
| 部署 | Cloudflare Pages（连接 GitHub main，push 即部署） |
| 包管理 | pnpm（Node ≥ 20） |

## 📁 目录结构

```
novel_site/
├── index.html              # Vite 入口（含首屏主题防闪脚本）
├── src/
│   ├── main.js             # Vue 应用入口
│   ├── App.vue             # 根组件（n-config-provider 主题壳）
│   ├── router/             # 路由：/ 首页目录、/chapter/:slug 阅读页
│   ├── views/
│   │   ├── Home.vue        # 首页：章节目录列表
│   │   └── Chapter.vue     # 阅读页：md → EPUB → 阅读器
│   ├── components/
│   │   ├── AppNav.vue      # 顶栏（目录 + 设置图标）
│   │   ├── ReaderSettings.vue  # 底部阅读设置面板（主题/字号/行距）
│   │   ├── ChapterList.vue # 章节卡片列表（高亮当前章）
│   │   ├── ChapterNav.vue  # 阅读页底部上一章/目录/下一章胶囊
│   │   ├── EpubReader.vue  # 封装 @likecoin/epub-ts + 手势接管
│   │   └── ReadingProgress.vue # 顶部阅读进度条
│   ├── composables/
│   │   ├── useTheme.js     # 主题 key 管理 + 持久化 + DOM 变量注入
│   │   └── useReaderSettings.js # 字号/行距状态 + 持久化
│   ├── data/
│   │   ├── chapters.js     # 章节清单（slug / 标题）
│   │   ├── theme.js        # 主题注册表（单一来源，5 套）
│   │   └── loader.js       # 构建期内联 src/content/*.md
│   ├── styles/global.css   # 全局设计令牌（CSS 变量），随主题变化
│   ├── content/            # 章节 Markdown 源（构建期内联）
│   └── utils/epub-builder.js # marked HTML → 合规 EPUB2 Blob
├── public/_redirects       # SPA 深链接兜底：/* /index.html 200
├── package.json
├── vite.config.js
└── pnpm-lock.yaml
```

## 🛠 本地开发

```bash
pnpm install
pnpm dev
# 浏览器打开 http://localhost:5173
```

## 📦 构建与本地预览

```bash
pnpm build      # 产物输出到 dist/
pnpm preview    # http://localhost:4173
```

## 🔄 更新章节

1. 在 `src/content/` 下新增 / 修改 `.md` 章节（文件名即 slug，如 `第11章_xxx.md`）。
   > 原始创作稿位于工作区根 `../output/*.md`，需同步到 `src/content/`。
2. 在 `src/data/chapters.js` 的章节清单中追加对应条目。
3. 提交并推送：

   ```bash
   git add . && git commit -m "更新章节" && git push
   ```

   GitHub `main` 分支收到推送后，Cloudflare Pages 自动重新部署。

## ☁️ Cloudflare Pages 部署配置（关键）

**必须正确设置构建命令**，否则浏览器会报 `Failed to resolve module specifier "vue"`（直接部署源码根目录会让浏览器无法识别裸模块名 `import ... from 'vue'`）。

Cloudflare Dashboard → Pages → `xiuxian-novel` → Settings → Build & deployment → Edit：

| 配置项 | 值 |
|--------|------|
| Framework preset | `None` |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Node.js version | ≥ 20（仓库含 `.nvmrc`） |

保存后重新部署即可。

## 🔍 阅读器渲染链路（简述）

```
src/content/*.md（构建期内联）
        │  marked.parse
        ▼
   HTML 片段
        │  epub-builder.js（JSZip 包成合规 EPUB2 Blob）
        ▼
   EPUB2（mimetype / container.xml / content.opf / toc.ncx / chapter.xhtml）
        │  @likecoin/epub-ts：ePub() + renderTo()（srcdoc iframe 分页）
        ▼
   仿真书页面（翻页 / 主题注入 / 进度定位）
```

- `chapter.xhtml` 按严格 XML 解析，故 `epub-builder.js` 内 `toXhtml()` 会把 marked 产出的 HTML5 void 元素自闭合、转义游离 `&`，避免 XML 解析报错。
- `content.opf` 已声明 `xmlns:opf`，避免 epub-ts 严格 XML 解析截断 manifest。
- 移动端手势（滑动 / 轻触半区翻页 / 边界跳章）统一在 iframe 内文 `contentDocument` 上监听，规避库内置 Touch 管理器在 iframe 模式下收不到触摸事件的问题。

## 📝 版本

当前 `package.json` 版本：`3.0.0`。

## 📄 许可证

本仓库为小说演示项目，章节内容仅供学习交流。
