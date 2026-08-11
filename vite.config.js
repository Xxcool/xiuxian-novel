import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 用 '/'，配合 public/_redirects 的 SPA 兜底（/* /index.html 200）
// 部署到 Cloudflare Pages 根域时深链接（/chapter/xxx）可正确回退到 index.html
export default defineConfig({
  base: '/',
  plugins: [vue()],
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
