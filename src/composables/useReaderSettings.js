import { ref, watch } from 'vue'

const SCALE_KEY = 'xx-reader-scale'
const LINE_KEY = 'xx-reader-line'

// 字号档位 → 缩放系数（作用到 global.css 的 --reader-scale）
export const SCALE_LABELS = { 小: 0.875, 中: 1, 大: 1.125, 特大: 1.25 }

const stored = Number(localStorage.getItem(SCALE_KEY)) || 1
const scale = ref(stored)
const label = ref(
  Object.keys(SCALE_LABELS).find((k) => SCALE_LABELS[k] === stored) || '中'
)

function applyScale(v) {
  document.documentElement.style.setProperty('--reader-scale', String(v))
}
applyScale(scale.value)

// 行距（作用到 global.css 的 --reader-line，并被 EpubReader 通过 epub-ts override 应用到内文）
const storedLine = Number(localStorage.getItem(LINE_KEY)) || 1.9
const lineHeight = ref(storedLine)

function applyLine(v) {
  document.documentElement.style.setProperty('--reader-line', String(v))
}
applyLine(lineHeight.value)

watch(scale, (v) => {
  applyScale(v)
  try {
    localStorage.setItem(SCALE_KEY, String(v))
  } catch (e) {
    /* 忽略写入失败 */
  }
})

watch(lineHeight, (v) => {
  applyLine(v)
  try {
    localStorage.setItem(LINE_KEY, String(v))
  } catch (e) {
    /* 忽略写入失败 */
  }
})

export function useReaderSettings() {
  return {
    scale,
    label,
    lineHeight,
    setScale: (k) => {
      scale.value = SCALE_LABELS[k]
      label.value = k
    },
    setLineHeight: (v) => {
      lineHeight.value = Number(v)
    },
  }
}
