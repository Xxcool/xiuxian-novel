<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, NDropdown, NDrawer, NDrawerContent } from 'naive-ui'
import ChapterList from './ChapterList.vue'
import { useTheme } from '../composables/useTheme'
import { useReaderSettings, SCALE_LABELS } from '../composables/useReaderSettings'
import { THEME_LIST, LINE_HEIGHT_OPTIONS, getLineHeightLabel } from '../data/theme'

const router = useRouter()
const route = useRoute()
const { themeKey, setTheme } = useTheme()
const { label, setScale, lineHeight, setLineHeight } = useReaderSettings()
const drawerOpen = ref(false)

// 字号档位菜单
const sizeOptions = Object.keys(SCALE_LABELS).map((k) => ({
  label: `字号：${k}`,
  key: k,
}))

// 主题菜单（5 套）
const themeOptions = THEME_LIST.map((t) => ({
  label: `${t.name}（${t.desc}）`,
  key: t.key,
}))

// 行距菜单
const lineOptions = LINE_HEIGHT_OPTIONS.map((o) => ({
  label: `行距：${o.label}`,
  key: String(o.value),
}))

const currentThemeName = computed(
  () => (THEME_LIST.find((t) => t.key === themeKey.value) || THEME_LIST[1]).name
)
const currentLineLabel = computed(() => getLineHeightLabel(lineHeight.value))

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
  <nav class="app-nav">
    <a class="brand" href="/" @click.prevent="goHome">签到修仙</a>

    <div class="nav-actions">
      <!-- 目录 -->
      <n-button quaternary size="small" @click="goHome">目录</n-button>

      <!-- 主题：5 套护眼/夜间主题下拉 -->
      <n-dropdown :options="themeOptions" @select="setTheme">
        <n-button quaternary size="small">主题 {{ currentThemeName }}</n-button>
      </n-dropdown>

      <!-- 字号 -->
      <n-dropdown :options="sizeOptions" @select="setScale">
        <n-button quaternary size="small">字 {{ label }}</n-button>
      </n-dropdown>

      <!-- 行距 -->
      <n-dropdown :options="lineOptions" @select="setLineHeight">
        <n-button quaternary size="small">行 {{ currentLineLabel }}</n-button>
      </n-dropdown>

      <!-- 章节抽屉 -->
      <n-button quaternary size="small" @click="drawerOpen = true">≡</n-button>
    </div>

    <n-drawer v-model:show="drawerOpen" placement="right" :width="300">
      <n-drawer-content title="章节列表" :native-scrollbar="false">
        <chapter-list @pick="drawerOpen = false" />
      </n-drawer-content>
    </n-drawer>
  </nav>
</template>
