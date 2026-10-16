<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NDrawer, NDrawerContent } from 'naive-ui'
import ChapterList from './ChapterList.vue'
import ReaderSettings from './ReaderSettings.vue'
import { useImmersive } from '../composables/useImmersive'

const { immersive, exit: exitImmersive } = useImmersive()

// 右上角仓库入口；与 git remote origin 保持一致
const REPO_URL = 'https://github.com/Xxcool/xiuxian-novel'

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
      <!-- 朱文印章：竖排「修仙」，微旋转模拟手盖 -->
      <span class="mark" aria-hidden="true">修仙</span>
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
        aria-label="设置"
      >
        <span class="nav-glyph">⚙</span><span class="nav-word">设置</span>
      </button>
      <!-- 仓库入口：外链，新标签页打开 -->
      <a
        class="nav-icon-btn nav-github"
        :href="REPO_URL"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub 仓库"
        title="在 GitHub 上查看源码"
      >
        <svg class="nav-glyph github-mark" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-2.91-.88-2.91-2.49 0-.82.29-1.49.77-2.02-.08-.2-.34-1.01.07-2.1 0 0 .63-.2 2.06.77a7.1 7.1 0 0 1 1.87-.25c.63 0 1.27.08 1.87.25 1.43-.97 2.06-.77 2.06-.77.41 1.09.15 1.9.07 2.1.48.53.77 1.2.77 2.02 0 1.61-1.13 2.49-2.91 2.49.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg><span class="nav-word">GitHub</span>
      </a>
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
