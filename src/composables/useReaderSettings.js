import { ref, computed, watch } from 'vue'

const SCALE_KEY = 'xx-reader-scale'
const LINE_KEY = 'xx-reader-line'
const FONT_SIZE_KEY = 'xx-reader-font-size'
const FLIP_MODE_KEY = 'xx-reader-flip-mode'
const FONT_FAMILY_KEY = 'xx-reader-font-family'

// 翻页模式选项
export const FLIP_MODES = [
  { key: 'flip', label: '仿真' },
  { key: 'cover', label: '覆盖' },
  { key: 'slide', label: '平移' },
  { key: 'none', label: '无动画' },
]

// 字体选项
export const FONT_FAMILIES = [
  { key: 'system', label: '系统字体' },
  { key: 'serif', label: '典雅宋体' },
  { key: 'kaiti', label: '传统楷体' },
]

// 字号档位（保持向下兼容）
export const SCALE_LABELS = { 小: 0.875, 中: 1, 大: 1.125, 特大: 1.25 }

// 字号数值初始化（默认 18px，范围 14 ~ 30）
const storedFontSize = Number(localStorage.getItem(FONT_SIZE_KEY)) || 18
const fontSize = ref(storedFontSize)
const scale = computed(() => fontSize.value / 18)

const label = computed(() => {
  if (fontSize.value <= 15) return '小'
  if (fontSize.value <= 19) return '中'
  if (fontSize.value <= 23) return '大'
  return '特大'
})

function applyScale(v) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--reader-scale', String(v))
    document.documentElement.style.setProperty('--reader-font-size', `${fontSize.value}px`)
  }
}
applyScale(scale.value)

// 行距
const storedLine = Number(localStorage.getItem(LINE_KEY)) || 1.9
const lineHeight = ref(storedLine)

function applyLine(v) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--reader-line', String(v))
  }
}
applyLine(lineHeight.value)

// 翻页模式（默认 'flip' 仿真）
const storedFlipMode = localStorage.getItem(FLIP_MODE_KEY) || 'flip'
const flipMode = ref(storedFlipMode)

// 字体选择
const storedFontFamily = localStorage.getItem(FONT_FAMILY_KEY) || 'serif'
const fontFamily = ref(storedFontFamily)

watch(fontSize, (v) => {
  applyScale(scale.value)
  try {
    localStorage.setItem(FONT_SIZE_KEY, String(v))
    localStorage.setItem(SCALE_KEY, String(scale.value))
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

watch(flipMode, (v) => {
  try {
    localStorage.setItem(FLIP_MODE_KEY, String(v))
  } catch (e) {
    /* 忽略写入失败 */
  }
})

watch(fontFamily, (v) => {
  try {
    localStorage.setItem(FONT_FAMILY_KEY, String(v))
  } catch (e) {
    /* 忽略写入失败 */
  }
})

export function useReaderSettings() {
  return {
    fontSize,
    scale,
    label,
    lineHeight,
    flipMode,
    fontFamily,
    canDecrease: computed(() => fontSize.value > 14),
    canIncrease: computed(() => fontSize.value < 30),
    decreaseFontSize: () => {
      if (fontSize.value > 14) {
        fontSize.value -= 2
      }
    },
    increaseFontSize: () => {
      if (fontSize.value < 30) {
        fontSize.value += 2
      }
    },
    setFontSize: (size) => {
      fontSize.value = Math.max(14, Math.min(30, Number(size)))
    },
    setScale: (k) => {
      if (SCALE_LABELS[k]) {
        fontSize.value = Math.round(18 * SCALE_LABELS[k])
      }
    },
    setLineHeight: (v) => {
      lineHeight.value = Number(v)
    },
    setFlipMode: (mode) => {
      flipMode.value = mode
    },
    setFontFamily: (f) => {
      fontFamily.value = f
    },
  }
}
