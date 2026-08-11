<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NSwitch,
  NDropdown,
  NDrawer,
  NDrawerContent,
} from 'naive-ui'
import ChapterList from './ChapterList.vue'
import { useTheme } from '../composables/useTheme'
import { useReaderSettings, SCALE_LABELS } from '../composables/useReaderSettings'

const router = useRouter()
const { isDark, toggle } = useTheme()
const { label, setScale } = useReaderSettings()
const drawerOpen = ref(false)

// 字号档位菜单（n-dropdown）
const sizeOptions = Object.keys(SCALE_LABELS).map((k) => ({
  label: `字号：${k}`,
  key: k,
}))

function goHome() {
  router.push('/')
}
</script>

<template>
  <nav class="app-nav">
    <a class="brand" href="/" @click.prevent="goHome">签到修仙</a>

    <div class="nav-actions">
      <!-- 目录：Naive n-button -->
      <n-button quaternary size="small" @click="goHome">目录</n-button>

      <!-- 字号：Naive n-dropdown + 触发按钮 -->
      <n-dropdown :options="sizeOptions" @select="setScale">
        <n-button quaternary size="small">字 {{ label }}</n-button>
      </n-dropdown>

      <!-- 昼夜：Naive n-switch -->
      <n-switch :value="isDark" @update:value="toggle">
        <template #checked>夜</template>
        <template #unchecked>昼</template>
      </n-switch>

      <!-- 章节抽屉触发：Naive n-button -->
      <n-button quaternary size="small" @click="drawerOpen = true">≡</n-button>
    </div>

    <!-- 章节抽屉：Naive n-drawer + n-drawer-content -->
    <n-drawer v-model:show="drawerOpen" placement="right" :width="300">
      <n-drawer-content title="章节列表" :native-scrollbar="false">
        <chapter-list @pick="drawerOpen = false" />
      </n-drawer-content>
    </n-drawer>
  </nav>
</template>
