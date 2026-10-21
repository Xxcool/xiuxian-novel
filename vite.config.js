import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// base 用 '/'，配合 public/_redirects 的 SPA 兜底（/* /index.html 200）
// 部署到 Cloudflare Pages 根域时深链接（/chapter/xxx）可正确回退到 index.html
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon.png',
        'favicon.svg',
        'images/*.webp',
        'fonts/*.woff2',
      ],
      manifest: {
        name: '签到修仙：从废柴到万古一帝',
        short_name: '签到修仙',
        description: '一部「废柴少年获得系统后逆袭」的修仙爽文在线阅读站',
        theme_color: '#111D26',
        background_color: '#111D26',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: '/favicon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,woff2,svg,png,ico}'],
        // 单个 chunk 最大缓存阈值提高到 3MB，防止个别第三方库超过 2MB 默认警告
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router'],
          naive: ['naive-ui'],
        },
      },
    },
  },
})
