<script setup>
import { ref, computed } from 'vue'
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
const isChapter = computed(() => route.name === 'chapter')

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
    <button v-if="isChapter" class="mobile-back" type="button" aria-label="返回目录" @click="goHome">‹</button>
    <a class="brand" href="/" @click.prevent="goHome">
      签到修仙
      <span class="mark" aria-hidden="true">签</span>
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
        <span class="nav-glyph">☰</span><span class="nav-word">目录</span>
      </button>
      <!-- 阅读设置（主题/字号/行距）点击触发底部面板 -->
      <button
        class="nav-icon-btn"
        type="button"
        @click="settingsOpen = true"
        aria-label="阅读设置"
      >
        <span class="nav-glyph">Aa</span><span class="nav-word">阅读设置</span>
      </button>
      <button v-if="isChapter" class="mobile-toc" type="button" aria-label="章节列表" @click="drawerOpen = true">☷</button>
    </div>

    <n-drawer v-model:show="drawerOpen" placement="right" :width="'min(420px, 92vw)'">
      <n-drawer-content title="章节列表" :native-scrollbar="false">
        <!-- 抽屉用紧凑形态：首页的大标题/两列网格/面板底色在窄抽屉里会挤压断行 -->
        <chapter-list variant="drawer" @pick="drawerOpen = false" />
      </n-drawer-content>
    </n-drawer>

    <reader-settings v-model:show="settingsOpen" />
  </nav>
</template>
