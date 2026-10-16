<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NDrawer, NDrawerContent } from 'naive-ui'
import ChapterList from './ChapterList.vue'
import ReaderSettings from './ReaderSettings.vue'
import { useImmersive } from '../composables/useImmersive'

const { immersive, exit: exitImmersive } = useImmersive()

const router = useRouter()
const route = useRoute()
const drawerOpen = ref(false)
const settingsOpen = ref(false)

function goHome() {
  // 从阅读页回目录时携带当前章节 slug，使首页目录高亮该章
  router.push(
    route.params.slug
      ? { path: '/', query: { chapter: route.params.slug } }
      : '/'
  )
}
</script>

<template>
  <nav class="app-nav" :class="{ 'is-hidden': immersive }">
    <a class="brand" href="/" @click.prevent="goHome">
      <span class="mark"></span>
      签到修仙
    </a>

    <div class="nav-actions">
      <!-- 退出沉浸模式：隐藏顶栏后，桌面端需要一个可点击的出口 -->
      <button
        v-if="immersive"
        class="nav-icon-btn"
        type="button"
        @click="exitImmersive"
        aria-label="退出沉浸阅读"
        title="退出沉浸阅读 (Esc)"
      >
        ⤢
      </button>
      <!-- 章节列表（点击触发右侧抽屉，不与翻页手势冲突） -->
      <button
        class="nav-icon-btn"
        type="button"
        @click="drawerOpen = true"
        aria-label="章节列表"
      >
        ≡
      </button>
      <!-- 阅读设置（主题/字号/行距）点击触发底部面板 -->
      <button
        class="nav-icon-btn"
        type="button"
        @click="settingsOpen = true"
        aria-label="阅读设置"
      >
        ⚙
      </button>
    </div>

    <n-drawer v-model:show="drawerOpen" placement="right" :width="300">
      <n-drawer-content title="章节列表" :native-scrollbar="false">
        <chapter-list @pick="drawerOpen = false" />
      </n-drawer-content>
    </n-drawer>

    <reader-settings v-model:show="settingsOpen" />
  </nav>
</template>
