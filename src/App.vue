<script setup>
import { computed } from 'vue'
import { NConfigProvider, darkTheme } from 'naive-ui'
import { useTheme } from './composables/useTheme'
import { getNavOverrides } from './data/theme'
import AppNav from './components/AppNav.vue'

const { themeKey } = useTheme()
// 夜间用暗色基线，白天两套使用亮色基线。
const theme = computed(() => (themeKey.value === 'night' ? darkTheme : null))
const themeOverrides = computed(() => getNavOverrides(themeKey.value))
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <app-nav />
    <main class="app-main">
      <router-view />
    </main>
    <footer class="app-footer">© 签到修仙 · 部署于 Cloudflare Pages</footer>
  </n-config-provider>
</template>
