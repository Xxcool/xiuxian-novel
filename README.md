<div align="center">

# 签到修仙：从废柴到万古一帝

<p align="center">
  <strong>一部「废柴少年获得系统后逆袭」的现代极简国风修仙小说在线阅读站</strong>
</p>

<p align="center">
  <a href="https://xiuxian-novel.pages.dev"><img src="https://img.shields.io/badge/Live_Demo-xiuxian--novel.pages.dev-2ea44f?style=flat-square&logo=cloudflarepages" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vuedotjs" alt="Vue 3">
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite" alt="Vite 5">
  <img src="https://img.shields.io/badge/PWA-Ready-orange?style=flat-square&logo=pwa" alt="PWA">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License">
</p>

<p align="center">
  <a href="https://xiuxian-novel.pages.dev"><strong>🌐 立即线上体验 »</strong></a>
</p>

</div>

---

## 📸 界面与交互预览

<div align="center">
  <img src="docs/screenshots/overview.png" width="100%" alt="签到修仙全场景界面预览（Web 首页 · Web 正文 · H5 移动阅读）" />
  <br/><br/>
  <sub>🌟 一张图全览：Web 桌面端水墨大景首页 + Web 典雅正文排版 + H5 移动端随身畅读</sub>
</div>

---

## ✨ 核心特性

### 1. 📖 商业级真实物理仿真翻书引擎
- **真实双面卷纸与受力弯曲**：正文文字真实印在被掀起的纸张表面，随着手指从角边拖拽产生高保真物理拱形卷曲；
- **背光透字与立体光影**：翻折翻出的纸张背面自然显现正文的微弱镜像透光字迹，卷折处带有圆柱高光与深邃漫反射软阴影；
- **真实透底下一页**：被卷起的纸页下方，真真切切露出的就是下一页排版的正文文字，带来如同抚摸实体书页的极致手感；
- **物理惯性与放平回弹**：松手后根据拖拽距离和划动瞬时速度，自动平滑加速翻过，或弹性回弹放平纸张；
- **全屏边缘点击**：桌面端/移动端轻触正文左/右边缘区（各 28%）自动从对应角落触发逼真掀页翻折。

### 2. 🎛️ 四种翻页模式与现代排版系统
- **四种翻页效果随心热切**：
  - **仿真**：StPageFlip 物理纸张双面卷折，实体书手感拉满；
  - **覆盖**：平滑滑入覆盖层叠翻页，轻巧敏捷；
  - **平移**：横向整屏平滑滑动位移，舒适现代；
  - **无动画**：瞬时极速切页，极致省电流畅；
- **胶囊字号步进器**：`[ A- ]  24  [ A+ ]` 步进调节正文字号，并支持一键字体循环切换；
- **可视化排版行距图标**：参考微信读书/掌阅主流交互，3 档可视化排版线条图标直观呈现紧凑（1.65）、标准（1.90）、宽松（2.20）；
- **纯净阅读无噪排版**：过滤正文冗余标记，彻底消除生硬突兀的 `<hr>` 灰色细横线。

### 3. 🌙 三套国风护眼沉浸主题
统一全站单一数据源（外壳、正文与背景景图严密契合），切换零残留，支持系统暗色自动跟随：

| 主题 Key | 名称 | 背景色 | 正文字色 | 强调色 | 视觉意境 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `night` | **月下** | `#1e2630` | `#d5dbe1` | 金 `#c9ad75` | 深黛墨夜 · 柔和护眼（杜绝死黑压抑与夜读眩光） |
| `warm` | **暖白** | `#f8f7f2` | `#24352f` | 墨绿 `#27533f` | 清爽书房 · 舒朗雅致 |
| `paper` | **宣纸** | `#f7f1e7` | `#302c27` | 朱砂 `#a44334` | 温和古卷 · 温润如玉 |

### 4. ⚡ 原生 DOM 流式分页架构（Smart DOM Paginator）
- **告别沙盒 iframe**：基于原生 DOM 毫秒级字符高度与段落流式测算，性能远超传统沙盒架构；
- **零文字截断**：长段落智能断句、标点避头尾与段落自然承接，彻底根治视口溢出截字问题；
- **黑盒隔离与响应式弹性**：页面容器采用原生黑盒挂载，完美解决 Web 桌面端 ↔ 移动端 H5 视口拉伸切换时的 DOM 渲染崩溃问题。

### 5. 📱 多端全场景交互与 PWA
- **沉浸阅读模式**：轻触正文中央区域（中间 44%）隐藏顶栏与底栏，按 `Esc` 或再次轻触恢复；
- **独立 App 沉浸体验**：集成 `vite-plugin-pwa`，支持「添加到主屏幕」全屏独立运行，无浏览器地址栏干扰；
- **后台闲时全本离线**：利用 `requestIdleCallback` 在后台平滑预存整本 110 章 chunk，首屏零阻塞，断网/飞行模式秒开畅读；
- **阅读记忆与目录分组**：毫秒级记忆阅读进度与已读章节，首页一键续读；目录支持每 20 章折叠、章名/章号即时搜索高亮。

---

## 🧱 技术栈

| 模块 | 核心选型 | 作用与能力 |
| :--- | :--- | :--- |
| **核心框架** | Vue 3.5 + Vite 5.4 | 响应式驱动与极速 HMR 构建 |
| **路由驱动** | vue-router 4 | HTML5 History 模式，SPA 深链接与章节直达 |
| **UI 体系** | Naive UI 2 | 现代化主题注入与抽屉/进度条组件 |
| **流式分页器** | Smart DOM Paginator | 纯前端原生 DOM 高精度毫秒级字符测算分页 |
| **物理翻书引擎** | `page-flip` (StPageFlip) | 真实双面纸张物理受力拱起、背光透字、软阴影与惯性回弹 |
| **内容解析** | `marked` | 高性能 Markdown 正文解析与排版去噪 |
| **离线应用** | `vite-plugin-pwa` + Workbox | 闲时分级预缓存策略与 PWA 独立安装 |
| **托管部署** | Cloudflare Pages | 全球 CDN 边缘加速，GitHub main 自动触发构建部署 |

---

## 🔍 原生流式排版与渲染链路

```
① src/content/第NN章_标题.md       创作与构建资源（import.meta.glob 懒加载 chunk）
        │
        ▼
② getChapterRaw(slug)             loader.js（内存缓存 + 相邻章节智能预取）
        │
        ▼
③ marked.parse(cleanBody)         过滤孤立分割线，转换为纯净语义化 HTML
        │
        ▼
④ Smart DOM Paginator             根据容器可用高度与字号行距，毫秒级流式排版分页
        │
        ▼
⑤ 原生阅读器挂载调度
        ├── 仿真模式 (flip)        → StPageFlip 原生黑盒挂载（物理双面纸张、卷折阴影）
        ├── 覆盖模式 (cover)       → 抽屉式原生层叠滑入过渡
        ├── 平移模式 (slide)       → 横向整屏平滑位移过渡
        └── 无动画模式 (none)      → 极速直切，零延迟渲染
        │
        ▼
⑥ 多端事件接管与进度调度
        ├── 触控/手势与点击热区接管（左右 28% 翻页，中央 44% 沉浸切换）
        └── 边界检测（末页翻下一章，首页翻上一章）与本地进度同步
```

---

## 📁 目录结构

```
novel_site/
├── docs/
│   └── screenshots/              # README 展示高清实机效果图
├── index.html                    # Vite 入口（首屏主题注入防闪脚本）
├── vite.config.js                # Vite 配置与 PWA 离线工作策略
├── public/                       # 静态资源、国风山水景图与多规格印章 Favicon
└── src/
    ├── main.js                   # 应用入口
    ├── App.vue                   # 根组件（Naive UI 主题壳）
    ├── views/
    │   ├── Home.vue              # 首页（大景景图 + 继续阅读卡片 + 目录面板）
    │   └── Chapter.vue           # 章节阅读页（调度分页器与阅读视图）
    ├── components/
    │   ├── EpubReader.vue        # 核心阅读器容器（集成物理翻书黑盒与多种翻页模式）
    │   ├── AppNav.vue            # 顶部导航（目录抽屉、设置面板、GitHub 入口）
    │   ├── ChapterList.vue       # 章节目录（分组/搜索/已读高亮，panel/drawer 双形态）
    │   ├── ChapterNav.vue        # 底部导航（上一章 · 目录 · 下一章）
    │   ├── ReaderSettings.vue    # 底部阅读设置抽屉（字号步进器、翻页模式、主题卡、行距图标）
    │   └── ReadingProgress.vue   # 顶部阅读进度指示条
    ├── composables/
    │   ├── useTheme.js           # 主题响应式单例与 CSS 变量注入
    │   ├── useReaderSettings.js  # 字号、行距、翻页模式持久化配置
    │   ├── useReadingProgress.js # 阅读进度与已读章节记忆
    │   └── useImmersive.js       # 沉浸阅读模式控制
    ├── utils/
    │   ├── dom-paginator.js      # Smart DOM Paginator 原生流式分页算法
    │   └── epub-builder.js       # EPUB2 标准打包器（离线导出）
    ├── content/                  # 110 章小说 Markdown 原文
    └── styles/                   # 全局设计令牌与小说定制排版样式
```

---

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/Xxcool/xiuxian-novel.git
cd xiuxian-novel

# 安装依赖
pnpm install

# 启动本地开发服务 (http://localhost:5173)
pnpm dev

# 构建生产产物
pnpm build

# 本地预览生产构建 (http://localhost:4173)
pnpm preview
```

---

## 📝 版本历史

当前版本：`v4.3.0`

| 版本 | 核心更新说明 |
| :--- | :--- |
| `v4.3.0` | **物理翻书与排版交互大升级**：集成 StPageFlip 商业级物理仿真翻页；支持仿真/覆盖/平移/无动画四种模式；新增胶囊字号步进调节与微信读书同款可视化行距图标；优化「月下」深黛墨夜护眼色调并消除正文突兀横线；README 全面视觉化改版与实机配图。 |
| `v4.2.0` | **品牌印章与国风视觉**：顶栏朱文印 + 多形态印章 Favicon；内嵌毛笔楷书子集字体（马善政，woff2 约 4.6KB）；优化相邻章节预取缓存机制。 |
| `v4.1.0` | **三套国风主题体系**：月下、暖白、宣纸配备专属底色、正文字色与大幅首页景图；全幅通栏现代排版；主题切换零闪烁与零残留。 |
| `v4.0.0` | **极简现代架构重构**：单页 SPA 响应式重构；章节 Markdown 按需懒加载分包；加入沉浸阅读与 PWA 渐进离线支持。 |

---

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源，章节文本仅供个人学习与交流使用。
