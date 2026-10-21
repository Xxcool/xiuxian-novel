<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ePub from '@likecoin/epub-ts'
import { buildEpub } from '../utils/epub-builder'
import { getReaderTheme, getTheme, THEME_LIST } from '../data/theme'
import { PageCurlEngine } from '../utils/page-curl'

const props = defineProps({
  title: { type: String, required: true },
  author: { type: String, default: '佚名' },
  html: { type: String, required: true },
  themeKey: { type: String, default: 'night' }, // night | warm | paper
  fontScale: { type: Number, default: 1 }, // 0.875 ~ 1.25
  lineHeight: { type: Number, default: 1.9 }, // 1.6 ~ 2.3
  // 相邻章节 slug：到达本章末尾/开头时，翻页箭头与边界滑动会跳转到对应章节
  nextSlug: { type: String, default: '' },
  prevSlug: { type: String, default: '' },
  // 沉浸模式下隐藏悬浮翻页箭头等 chrome
  immersive: { type: Boolean, default: false },
})
const emit = defineEmits(['progress', 'page', 'ready', 'error', 'navigate', 'toggle-ui'])

// 点击热区划分（占阅读区宽度比例）：
//   左侧 EDGE_RATIO → 上一页（从左下角卷起翻页）
//   右侧 EDGE_RATIO → 下一页（从右下角卷起翻页）
//   中间区域        → 切换沉浸模式（隐藏/显示界面）
const EDGE_RATIO = 0.28

const viewer = ref(null)
const curlCanvasRef = ref(null)
const loading = ref(true)
const error = ref(null)
const atEnd = ref(false) // 当前是否已到本章最后一页
const atStart = ref(true) // 当前是否已到本章第一页

let book = null
let rendition = null
let ro = null
let initToken = 0
let swipeCleanup = null
let curlEngine = null

// EPUB 主题样式会按切换顺序追加，显式覆盖正文颜色可避免旧主题抢占优先级。
function applyReaderColors(key) {
  if (!rendition) return
  const { bg, text } = getTheme(key)
  rendition.themes.override('background', bg, true)
  rendition.themes.override('color', text, true)
}

// 翻页箭头图标随边界变化：在末页且有下一章时显示「»」提示将跳下一章
const nextLabel = computed(() => (atEnd.value && props.nextSlug ? '»' : '›'))
const prevLabel = computed(() => (atStart.value && props.prevSlug ? '«' : '‹'))
const nextDisabled = computed(() => error.value || (atEnd.value && !props.nextSlug))
const prevDisabled = computed(() => error.value || (atStart.value && !props.prevSlug))

// 以库当前的真实定位为准判断边界
function boundaryState() {
  if (rendition && typeof rendition.currentLocation === 'function') {
    const loc = rendition.currentLocation()
    if (loc) return { atStart: !!loc.atStart, atEnd: !!loc.atEnd }
  }
  return { atStart: atStart.value, atEnd: atEnd.value }
}

// 直接切页底层调度
function stepNext() {
  if (!rendition || error.value) return
  const { atEnd: ae } = boundaryState()
  if (ae && props.nextSlug) {
    emit('navigate', props.nextSlug)
    return
  }
  rendition.next()
}

function stepPrev() {
  if (!rendition || error.value) return
  const { atStart: as } = boundaryState()
  if (as && props.prevSlug) {
    emit('navigate', props.prevSlug)
    return
  }
  rendition.prev()
}

// 播放番茄/七猫小说风格的完整仿真卷页动画（点击或按键触发）
function goNext() {
  if (error.value || !rendition) return
  const { atEnd: ae } = boundaryState()
  if (ae && props.nextSlug) {
    emit('navigate', props.nextSlug)
    return
  }
  if (curlEngine) {
    curlEngine.autoFlip('next', props.themeKey, {
      onMidway: () => stepNext(),
    })
  } else {
    stepNext()
  }
}

function goPrev() {
  if (error.value || !rendition) return
  const { atStart: as } = boundaryState()
  if (as && props.prevSlug) {
    emit('navigate', props.prevSlug)
    return
  }
  if (curlEngine) {
    curlEngine.autoFlip('prev', props.themeKey, {
      onMidway: () => stepPrev(),
    })
  } else {
    stepPrev()
  }
}

function onKey(e) {
  if (!rendition || error.value) return
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault()
    goNext()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goPrev()
  }
}

// 在 iframe 内文文档上统一接管手势（支持手指拖拽逐渐卷起、松手惯性翻页或回弹、点击边缘卷页）
function setupInteractions() {
  const iframe = viewer.value?.querySelector('iframe')
  const doc = iframe?.contentDocument
  if (!doc) return

  const pageWidth = () => iframe.clientWidth || doc.documentElement.clientWidth
  let x0 = 0
  let y0 = 0
  let t0 = 0
  let isDragging = false
  let dragDir = 'next'
  let lastTouchAction = 0

  // 左右边缘轻触 → 播放完整右下角/左下角仿真卷页动画
  const handleTap = (x) => {
    const w = pageWidth()
    if (x < w * EDGE_RATIO) goPrev()
    else if (x > w * (1 - EDGE_RATIO)) goNext()
    else emit('toggle-ui')
  }

  // 桌面端鼠标点击（过滤触摸合成 click）
  const onClick = (e) => {
    if (error.value || !rendition) return
    if (Date.now() - lastTouchAction < 500) return
    handleTap(e.clientX)
  }

  const onStart = (e) => {
    if (!e.touches || error.value || !rendition) return
    const t = e.touches[0]
    x0 = t.clientX
    y0 = t.clientY
    t0 = Date.now()
    isDragging = false
    dragDir = x0 > pageWidth() * 0.5 ? 'next' : 'prev'
  }

  const onMove = (e) => {
    if (!e.touches || error.value || !rendition) return
    const t = e.touches[0]
    const dx = t.clientX - x0
    const dy = t.clientY - y0
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)

    // 判定为横向滑动拖拽
    if (adx > 12 && adx > ady * 1.15) {
      if (!isDragging && curlEngine) {
        isDragging = true
        dragDir = dx < 0 ? 'next' : 'prev'
        curlEngine.startDrag(t.clientX, t.clientY, dragDir, props.themeKey)
      }
      if (isDragging && curlEngine) {
        curlEngine.dragTo(t.clientX, t.clientY)
      }
    }
  }

  const onEnd = (e) => {
    if (error.value || !rendition) return
    const t = e.changedTouches ? e.changedTouches[0] : e
    const dx = t.clientX - x0
    const dy = t.clientY - y0
    const dt = Date.now() - t0

    if (isDragging && curlEngine) {
      isDragging = false
      lastTouchAction = Date.now()
      curlEngine.releaseDrag({
        onMidway: () => {
          if (dragDir === 'next') stepNext()
          else stepPrev()
        },
      })
      return
    }

    if (dt > 1000) return // 超过 1s 视为长按，不翻页
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)

    if (adx >= 28 && adx > ady * 1.3) {
      // 快速划动
      lastTouchAction = Date.now()
      if (dx < 0) goNext()
      else goPrev()
    } else if (dt < 500 && adx < 12 && ady < 12) {
      // 轻触 tap
      lastTouchAction = Date.now()
      handleTap(x0)
    }
  }

  doc.addEventListener('click', onClick, { passive: true })
  doc.addEventListener('touchstart', onStart, { passive: true, capture: true })
  doc.addEventListener('touchmove', onMove, { passive: true })
  doc.addEventListener('touchend', onEnd, { passive: true })

  swipeCleanup = () => {
    doc.removeEventListener('click', onClick)
    doc.removeEventListener('touchstart', onStart)
    doc.removeEventListener('touchmove', onMove)
    doc.removeEventListener('touchend', onEnd)
  }
}

// 销毁旧实例，避免内存泄漏与事件叠加
function cleanup() {
  window.removeEventListener('keydown', onKey)
  ro?.disconnect()
  ro = null
  swipeCleanup?.()
  swipeCleanup = null
  curlEngine?.destroy()
  curlEngine = null

  try {
    rendition?.destroy()
  } catch (e) {
    /* noop */
  }
  try {
    book?.destroy?.()
  } catch (e) {
    /* noop */
  }
  rendition = null
  book = null
}

async function init() {
  const my = ++initToken
  if (!props.html) {
    loading.value = false
    return
  }
  try {
    cleanup()
    error.value = null
    loading.value = true
    atEnd.value = false
    atStart.value = true

    const blob = await buildEpub({
      title: props.title,
      author: props.author,
      html: props.html,
    })
    if (my !== initToken) return
    const buf = await blob.arrayBuffer()
    if (my !== initToken) return

    book = ePub(buf)
    await book.ready
    if (my !== initToken) return

    // 纯净挂载，禁止任何会破坏 iframe 宽度的外部复合变换
    rendition = book.renderTo(viewer.value, {
      width: viewer.value.clientWidth || '100%',
      height: viewer.value.clientHeight || '100%',
      spread: 'none',
      flow: 'paginated',
      snap: false,
      allowScriptedContent: true,
    })

    // 初始化番茄/七猫仿真卷页物理引擎
    if (curlCanvasRef.value) {
      curlEngine = new PageCurlEngine(curlCanvasRef.value)
      curlEngine.resize(
        viewer.value.clientWidth || viewer.value.offsetWidth || 360,
        viewer.value.clientHeight || viewer.value.offsetHeight || 600
      )
    }

    THEME_LIST.forEach((t) =>
      rendition.themes.register(t.key, getReaderTheme(t.key))
    )
    rendition.themes.select(props.themeKey)
    applyReaderColors(props.themeKey)

    if (props.fontScale)
      rendition.themes.override('font-size', `${1.125 * props.fontScale}rem`)
    if (props.lineHeight)
      rendition.themes.override('line-height', String(props.lineHeight), true)

    const onRelocated = (loc) => {
      const pct = loc?.start?.percentage
      if (typeof pct === 'number') emit('progress', Math.round(pct * 100))
      const displayed = loc?.start?.displayed
      if (displayed?.page && displayed?.total) emit('page', displayed)
      atEnd.value = loc?.atEnd ?? (typeof pct === 'number' && pct >= 0.999)
      atStart.value = loc?.atStart ?? (typeof pct === 'number' && pct <= 0.001)
    }

    rendition.on('relocated', onRelocated)
    await rendition.display()
    if (my !== initToken) return
    onRelocated(rendition.currentLocation())
    loading.value = false
    emit('ready')

    window.addEventListener('keydown', onKey)
    ro = new ResizeObserver(() => {
      if (viewer.value) {
        const vw = viewer.value.clientWidth
        const vh = viewer.value.clientHeight
        if (rendition && vw > 0 && vh > 0) {
          rendition.resize(vw, vh)
        }
        curlEngine?.resize(vw, vh)
      }
    })
    ro.observe(viewer.value)

    requestAnimationFrame(() => {
      if (my !== initToken) return
      setupInteractions()
      if (!swipeCleanup) requestAnimationFrame(setupInteractions)
    })
  } catch (err) {
    if (my !== initToken) return
    console.error('[EpubReader] init failed:', err)
    error.value = err?.message || '阅读器加载失败'
    loading.value = false
    emit('error', err)
  }
}

onMounted(init)

watch(
  () => props.html,
  () => {
    init()
  }
)
onBeforeUnmount(cleanup)

watch(
  () => props.themeKey,
  (k) => {
    if (!rendition || error.value) return
    rendition.themes.select(k)
    applyReaderColors(k)
  }
)
watch(
  () => props.fontScale,
  (s) => {
    if (!rendition || error.value) return
    rendition.themes.override('font-size', `${1.125 * s}rem`)
  }
)
watch(
  () => props.lineHeight,
  (l) => {
    if (!rendition || error.value) return
    rendition.themes.override('line-height', String(l), true)
  }
)

defineExpose({ goNext, goPrev })
</script>

<template>
  <div class="epub-reader">
    <!-- 番茄/七猫风格 仿真纸张卷页物理渲染画布（覆盖在正文上方，松手或点击自动卷折展开） -->
    <canvas ref="curlCanvasRef" class="page-curl-canvas" aria-hidden="true"></canvas>

    <!-- 真实正文渲染容器（纯净 100% 布局，无任何硬件加速位移污染，消除左侧字截断） -->
    <div ref="viewer" class="epub-viewer" :class="{ hidden: error }"></div>

    <!-- 阅读器加载失败时回退到普通 HTML 滚动阅读，避免一直卡在“正在排版” -->
    <div
      v-if="error"
      class="reader-fallback reader-inner"
      v-html="html"
      :style="{
        fontSize: `calc(18px * ${fontScale})`,
        lineHeight: String(lineHeight),
      }"
    ></div>

    <div v-if="loading && !error" class="epub-loading">
      <span>正在排版…</span>
    </div>

    <div v-if="error" class="epub-error-tip">
      EPUB 阅读器加载失败，已切换为普通阅读模式
    </div>

    <!-- 上一页 / 下一页：在边界时跳转到相邻章节 -->
    <div
      class="epub-page-nav"
      :class="{ disabled: error, 'is-hidden': immersive }"
    >
      <button
        class="epub-page-btn"
        :disabled="prevDisabled"
        @click.stop="goPrev"
        :aria-label="prevLabel === '«' ? '上一章' : '上一页'"
      >
        {{ prevLabel }}
      </button>
      <button
        class="epub-page-btn"
        :disabled="nextDisabled"
        @click.stop="goNext"
        :aria-label="nextLabel === '»' ? '下一章' : '下一页'"
      >
        {{ nextLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.epub-reader {
  position: relative;
  width: 100%;
  height: 74vh;
  min-height: 480px;
  background: transparent;
  overflow: hidden;
}
/* 物理仿真卷页层：覆盖在正文上方，事件穿透至下方 iframe 接管 */
.page-curl-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 15;
}
/* 正文容器：纯净标准布局，绝不添加 transform/scale 以免破坏 iframe 列宽造成文字截断 */
.epub-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 1;
}
.epub-viewer.hidden {
  display: none;
}
.epub-viewer :deep(iframe) {
  border: none;
  display: block;
}
.reader-fallback {
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
}
.epub-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-soft);
  font-size: 0.95rem;
  letter-spacing: 2px;
  pointer-events: none;
}
.epub-error-tip {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  border-radius: 20px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  color: var(--text-soft);
  font-size: 12px;
  box-shadow: 0 2px 10px var(--shadow);
  z-index: 20;
}
.epub-page-nav {
  position: absolute;
  bottom: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
  z-index: 25;
}
/* 移动端已有滑动翻页 + 边界跳章，悬浮箭头会遮挡正文，故隐藏 */
@media (max-width: 768px) {
  .epub-page-nav {
    display: none;
  }
}
.epub-page-nav.disabled {
  opacity: 0.4;
  pointer-events: none;
}
/* 沉浸模式：箭头淡出下沉，避免干扰阅读 */
.epub-page-nav.is-hidden {
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity var(--dur-normal) var(--ease),
    transform var(--dur-normal) var(--ease);
}
.epub-page-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg-elev) 92%, transparent);
  backdrop-filter: blur(8px);
  color: var(--text-soft);
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 10px var(--shadow);
  transition: background 0.18s var(--ease), color 0.18s var(--ease),
    border-color 0.18s var(--ease);
}
.epub-page-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.epub-page-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
