import { ref, watch } from 'vue'

const STORAGE_KEY = 'xx-reader-scale'

// 字号档位 → 缩放系数（作用到 global.css 的 --reader-scale）
export const SCALE_LABELS = { 小: 0.875, 中: 1, 大: 1.125, 特大: 1.25 }

const stored = Number(localStorage.getItem(STORAGE_KEY)) || 1
const scale = ref(stored)
const label = ref(
  Object.keys(SCALE_LABELS).find((k) => SCALE_LABELS[k] === stored) || '中'
)

function apply(v) {
  document.documentElement.style.setProperty('--reader-scale', String(v))
}
apply(scale.value)

watch(scale, (v) => {
  apply(v)
  try {
    localStorage.setItem(STORAGE_KEY, String(v))
  } catch (e) {
    /* 忽略写入失败 */
  }
})

export function useReaderSettings() {
  return {
    scale,
    label,
    setScale: (k) => {
      scale.value = SCALE_LABELS[k]
      label.value = k
    },
  }
}
