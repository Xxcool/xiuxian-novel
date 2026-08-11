import { ref, watch } from 'vue'

const STORAGE_KEY = 'xx-theme'

// 模块级单例：所有组件共享同一主题状态
const isDark = ref(
  typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'
)

watch(isDark, (v) => {
  const theme = v ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch (e) {
    /* 忽略隐私模式等写入失败 */
  }
})

export function useTheme() {
  return {
    isDark,
    toggle: () => {
      isDark.value = !isDark.value
    },
  }
}
