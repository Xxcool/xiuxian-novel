# 签到修仙：从废柴到万古一帝

一部「废柴少年获得系统后逆袭」的修仙爽文在线阅读站。

本仓库为 **Vue 3 + Vite + Naive UI + @likecoin/epub-ts** 单页应用（SPA）。章节源文件位于 `../output/*.md`，构建时被打包进前端产物并渲染为 EPUB 阅读器。

## 站点结构

```
novel_site/
├── index.html              # Vite 入口
├── src/
│   ├── main.js             # Vue 应用入口
│   ├── App.vue             # 根组件
│   ├── router/             # vue-router
│   ├── views/              # 页面（Home / Chapter）
│   ├── components/         # Naive UI 外壳组件 + EpubReader
│   ├── composables/        # 主题/字号状态
│   ├── data/               # 章节清单、主题令牌
│   ├── styles/             # 全局 CSS 变量
│   └── content/            # 章节 Markdown 源
├── public/_redirects       # SPA 兜底规则
├── package.json
├── vite.config.js
└── pnpm-lock.yaml
```

## 本地开发

```bash
pnpm install
pnpm dev
# 浏览器打开 http://localhost:5173
```

## 构建与本地预览

```bash
pnpm build      # 产物输出到 dist/
pnpm preview    # http://localhost:4173
```

## 更新章节

1. 在 `../output/` 下新增/修改 `.md` 章节
2. 同步到 `src/content/`（可手动复制或后续接入脚本）
3. 如新增章节，在 `src/data/chapters.js` 中追加条目
4. 提交并推送：

   ```bash
   git add . && git commit -m "更新章节" && git push
   ```

   Cloudflare Pages 连接仓库后会自动重新部署。

## Cloudflare Pages 部署配置（关键）

**必须修改**，否则浏览器会报 `Failed to resolve module specifier "vue"`。

进入 Cloudflare Dashboard → Pages → `xiuxian-novel` → Settings → Build & deployment → Edit：

| 配置项 | 旧值 | 新值 |
|--------|------|------|
| Framework preset | `None` | `None` |
| Build command | 留空 | `pnpm build` |
| Build output directory | `/` | `dist` |

保存后重新部署即可。

> 因为仓库现在是 Vite 单页应用，Cloudflare 必须在服务器端执行构建，把 `/src/main.js` 里的裸导入（`import ... from 'vue'`）打包成浏览器可识别的相对路径。直接部署源码根目录会让浏览器无法理解裸模块名。

## 技术说明

- Vue 3 + Vite + vue-router + Naive UI
- 章节 Markdown 由 `marked` 转成 HTML，再通过 `jszip` 在浏览器内包成 EPUB2 Blob
- 阅读器使用 `@likecoin/epub-ts`（epubjs TS 分支）：分页、翻页、点按区、字号、主题均由库接管
- 响应式布局，支持日间/夜间模式与字号切换
