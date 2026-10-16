import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import './styles/novel.css'

// 不全局注册 naive-ui，按需在组件内 import，保证 tree-shaking 与更小的包体
createApp(App).use(router).mount('#app')
