import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import './styles/novel.css'
import { registerSW } from 'virtual:pwa-register'
import { chapters } from './data/chapters'
import { idleWarmupAllChapters } from './data/loader'

// 注册 PWA Service Worker（支持离线运行与后台自动更新）
registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('[PWA] 离线服务已就绪，支持无网环境沉浸阅读')
  },
})

// 启动闲时全书平滑预热（避免瞬间突发网络拥堵，在读者阅读间歇渐进完成整本离线）
idleWarmupAllChapters(chapters.map((c) => c.slug))

// 不全局注册 naive-ui，按需在组件内 import，保证 tree-shaking 与更小的包体
createApp(App).use(router).mount('#app')
