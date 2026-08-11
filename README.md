# 签到修仙：从废柴到万古一帝

一部「废柴少年获得系统后逆袭」的修仙爽文在线阅读站。

本仓库是纯静态 HTML 网站，由 `../build_site.py` 从 `../output/*.md` 章节源文件生成。
支持目录页 + 每章前后跳转，可直接托管在任意静态平台（Cloudflare Pages / GitHub Pages / Vercel 等）。

## 站点结构

```
novel_site/
├── index.html              # 目录页
├── 第01章_废柴的最后一天.html
├── 第02章_混沌吞天诀.html
└── ...（每章一个 HTML）
```

## 本地预览

```bash
# 直接用任意静态服务器即可
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 更新章节

1. 在 `output/` 下新增/修改 `.md` 章节
2. 回到项目根目录运行构建脚本：

   ```bash
   python3 build_site.py
   ```

3. 提交并推送：

   ```bash
   git add . && git commit -m "更新章节" && git push
   ```

   Cloudflare Pages 连接仓库后会自动重新部署。

## Cloudflare Pages 部署配置

- **Framework preset**: None
- **Build command**: （留空）
- **Build output directory**: `/`（仓库根目录）

## 技术说明

- 全站单文件 HTML，无外部依赖、无 JS 框架，离线可读
- 字体使用系统苹方/微软雅黑回退
- 响应式，手机/电脑均适配
