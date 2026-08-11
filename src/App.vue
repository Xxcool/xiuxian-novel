<script setup>
import { computed } from 'vue'
import { NConfigProvider, darkTheme } from 'naive-ui'
import { useTheme } from './composables/useTheme'
import { lightThemeOverrides, darkThemeOverrides } from './data/theme'
import AppNav from './components/AppNav.vue'

const { isDark } = useTheme()
const theme = computed(() => (isDark.value ? darkTheme : null))
const themeOverrides = computed(() =>
  isDark.value ? darkThemeOverrides : lightThemeOverrides
)
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
