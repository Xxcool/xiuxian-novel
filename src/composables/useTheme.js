import { ref, computed, watch } from 'vue'
import {
  getTheme,
  getShellVars,
  isDarkKey,
  DEFAULT_DAY,
  DEFAULT_NIGHT,
} from '../data/theme'

const STORAGE_KEY = 'xx-theme'

function initialKey() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && getTheme(stored)) return stored
  } catch (e) {
    /* 忽略隐私模式等读取失败 */
  }
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? DEFAULT_NIGHT : DEFAULT_DAY
}

// 模块级单例：所有组件共享同一主题状态
const themeKey = ref(initialKey())

// 把主题的外壳 CSS 变量 + data-theme 写到 documentElement，并持久化
function applyDom(key) {
  const el = document.documentElement
  const vars = getShellVars(key)
  Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v))
  el.setAttribute('data-theme', isDarkKey(key) ? 'dark' : 'light')
  try {
    localStorage.setItem(STORAGE_KEY, key)
  } catch (e) {
    /* 忽略写入失败 */
  }
}

applyDom(themeKey.value)

watch(themeKey, applyDom)

export function useTheme() {
  return {
    themeKey,
    isDark: computed(() => isDarkKey(themeKey.value)),
    setTheme: (k) => {
      if (getTheme(k)) themeKey.value = k
    },
    cycleTheme: () => {
      const order = ['light', 'sepia', 'paper', 'green', 'night']
      const i = order.indexOf(themeKey.value)
      themeKey.value = order[(i + 1) % order.length]
    },
  }
}
