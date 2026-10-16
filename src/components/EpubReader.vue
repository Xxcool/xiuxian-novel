<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ePub from '@likecoin/epub-ts'
import { buildEpub } from '../utils/epub-builder'
import { getReaderTheme, getTheme, THEME_LIST } from '../data/theme'

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
//   左侧 EDGE_RATIO → 上一页
//   右侧 EDGE_RATIO → 下一页
//   中间区域        → 切换沉浸模式（隐藏/显示界面）
// 中间区留宽是为了让读者能顺手唤出界面，同时两侧仍保有足够翻页面积，
// 滑动翻页也始终可用，不会因为热区划分而失效。
const EDGE_RATIO = 0.28

const viewer = ref(null)
const loading = ref(true)
const error = ref(null)
const atEnd = ref(false) // 当前是否已到本章最后一页
const atStart = ref(true) // 当前是否已到本章第一页
let book = null
let rendition = null
let ro = null
let initToken = 0
let swipeCleanup = null

// EPUB 主题样式会按切换顺序追加，显式覆盖正文颜色可避免旧主题抢占优先级。
function applyReaderColors(key) {
  const { bg, text } = getTheme(key)
  rendition.themes.override('background', bg, true)
  rendition.themes.override('color', text, true)
}

// 翻页箭头图标随边界变化：在末页且有下一章时显示「»」提示将跳下一章
const nextLabel = computed(() => (atEnd.value && props.nextSlug ? '»' : '›'))
const prevLabel = computed(() => (atStart.value && props.prevSlug ? '«' : '‹'))
const nextDisabled = computed(() => error.value || (atEnd.value && !props.nextSlug))
const prevDisabled = computed(() => error.value || (atStart.value && !props.prevSlug))

// 以库当前的真实定位为准判断边界，避免 relocated 异步更新与章节切换竞态
// 导致的 atEnd/atStart 滞后（单章为独立 EPUB，atEnd=本章末页、atStart=本章首页）
function boundaryState() {
  if (rendition && typeof rendition.currentLocation === 'function') {
    const loc = rendition.currentLocation()
    if (loc) return { atStart: !!loc.atStart, atEnd: !!loc.atEnd }
  }
  return { atStart: atStart.value, atEnd: atEnd.value }
}

// 统一的"往后翻"：未到末页→库内翻页；到末页且有下一章→跳下一章
function goNext() {
  if (error.value || !rendition) return
  const { atEnd: ae } = boundaryState()
  if (ae && props.nextSlug) {
    emit('navigate', props.nextSlug)
    return
  }
  rendition.next()
}
// 统一的"往前翻"：未到首页→库内翻页；到首页且有上一章→跳上一章
function goPrev() {
  if (error.value || !rendition) return
  const { atStart: as } = boundaryState()
  if (as && props.prevSlug) {
    emit('navigate', props.prevSlug)
    return
  }
  rendition.prev()
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

// 在 iframe 内文文档上统一接管两种手势（移动端、桌面端都可用）：
// 1) 点击 / 轻触：按 x 坐标分左右半区翻页（仿真书交互：左半区上一页，右半区下一页）
// 2) 横向滑动：左滑→下一页（末页跳下一章）、右滑→上一页（首页跳上一章），方向即仿真书手势
// 说明：epub-ts 内置 Touch 管理器监听的是 iframe 外层容器，收不到 iframe 内 touch，
// 故章节内滑动必须自己在 contentDocument 上监听；点击翻页也直接在 touchend 判定，
// 不依赖移动端合成的 click 事件（在 srcdoc + sandbox 的 iframe 内某些浏览器不可靠）。
// 注意：已通过 renderTo({ snap: false }) 关闭库内置滑动翻页，这里即为手势的唯一来源。
function setupInteractions() {
  const iframe = viewer.value?.querySelector('iframe')
  const doc = iframe?.contentDocument
  if (!doc) return // 极少数情况下文档尚未就绪，由调用处的 rAF 重试
  const pageWidth = () => iframe.clientWidth || doc.documentElement.clientWidth
  let x0 = 0
  let y0 = 0
  let t0 = 0
  let lastTouchAction = 0 // 防触摸后合成 click 重复触发翻页

  // 左边缘上一页、右边缘下一页、中间区域切换沉浸模式
  const handleTap = (x) => {
    const w = pageWidth()
    if (x < w * EDGE_RATIO) goPrev()
    else if (x > w * (1 - EDGE_RATIO)) goNext()
    else emit('toggle-ui')
  }
  // 桌面端鼠标点击：按左右半区（触摸产生的动作后 500ms 内的合成 click 一律忽略）
  const onClick = (e) => {
    if (error.value || !rendition) return
    if (Date.now() - lastTouchAction < 500) return
    handleTap(e.clientX)
  }
  const onStart = (e) => {
    const t = e.touches ? e.touches[0] : e
    x0 = t.clientX
    y0 = t.clientY
    t0 = Date.now()
  }
  const onEnd = (e) => {
    if (error.value || !rendition) return
    const t = e.changedTouches ? e.changedTouches[0] : e
    const dx = t.clientX - x0
    const dy = t.clientY - y0
    const dt = Date.now() - t0
    if (dt > 1000) return // 超过 1s 视为长按/停顿，不翻页
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    if (adx >= 25 && adx > ady * 1.3) {
      // 明确横向滑动 → 翻页 / 边界跳章（方向即仿真书手势）
      lastTouchAction = Date.now()
      if (dx < 0) goNext()
      else goPrev()
    } else if (dt < 500 && adx < 12 && ady < 12) {
      // 位移很小且时间短 → 视为轻触（tap），按起始 x 分左右半区翻页
      lastTouchAction = Date.now()
      handleTap(x0)
    }
    // 纵向滚动或长按不处理，避免误翻页 / 干扰文本选择
  }
  doc.addEventListener('click', onClick, { passive: true })
  // touchstart 用 capture 阶段，确保即使其他监听调用了 stopPropagation 也能先抓到起点坐标
  doc.addEventListener('touchstart', onStart, { passive: true, capture: true })
  doc.addEventListener('touchend', onEnd, { passive: true })
  swipeCleanup = () => {
    doc.removeEventListener('click', onClick)
    doc.removeEventListener('touchstart', onStart)
    doc.removeEventListener('touchend', onEnd)
  }
}

// 彻底销毁旧实例，避免章节切换时多个 iframe / rendition 叠加
function cleanup() {
  window.removeEventListener('keydown', onKey)
  ro?.disconnect()
  ro = null
  swipeCleanup?.()
  swipeCleanup = null
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

    rendition = book.renderTo(viewer.value, {
      width: viewer.value.clientWidth || '100%',
      height: viewer.value.clientHeight || '100%',
      spread: 'none',
      flow: 'paginated',
      // 关闭库内置的滑动翻页（snap）：epub-ts 在 touch 设备上会自动启用一套
      // Touch 管理器自己处理滑动切页，会与下方自己在 contentDocument 上挂的
      // 手势抢事件，导致移动端滑动/点击翻页时灵时不灵甚至跳页。关掉后由我们
      // 的 setupInteractions 统一接管所有手势，行为单一、可预测。
      snap: false,
      // 开启 allow-scripts：epub-ts 会把内容渲染进 sandbox 的 srcdoc iframe，
      // 其内部渲染/主题注入脚本需要 allow-scripts，否则浏览器拦截并报
      // "Blocked script execution in 'about:srcdoc'"，翻页与主题也会失效
      allowScriptedContent: true,
    })

    // 注册全部 5 套阅读器主题，按当前 themeKey 选择；字号/行高通过 override 动态注入
    THEME_LIST.forEach((t) =>
      rendition.themes.register(t.key, getReaderTheme(t.key))
    )
    rendition.themes.select(props.themeKey)
    applyReaderColors(props.themeKey)
    if (props.fontScale)
      rendition.themes.override('font-size', `${1.125 * props.fontScale}rem`)
    if (props.lineHeight)
      // 优先级 true：覆盖 epub-builder 内置 READER_CSS 里 body 的 line-height: 1.9
      rendition.themes.override('line-height', String(props.lineHeight), true)

    // 阅读进度与页码来自库自身定位；先注册再 display，确保首屏也收到页码。
    const onRelocated = (loc) => {
      const pct = loc?.start?.percentage
      if (typeof pct === 'number') emit('progress', Math.round(pct * 100))
      const displayed = loc?.start?.displayed
      if (displayed?.page && displayed?.total) emit('page', displayed)
      // atEnd / atStart 由库直接给出；个别版本缺失时用整本百分比兜底
      // （每章均为独立 EPUB，100% 即本章末页，0% 即首页）
      atEnd.value = loc?.atEnd ?? (typeof pct === 'number' && pct >= 0.999)
      atStart.value = loc?.atStart ?? (typeof pct === 'number' && pct <= 0.001)
    }
    rendition.on('relocated', onRelocated)
    await rendition.display()
    if (my !== initToken) return
    onRelocated(rendition.currentLocation())
    loading.value = false
    emit('ready')

    // 正文内的点击翻页与横向滑动翻页，统一在 contentDocument 上接管，
    // 见 setupInteractions()（移动端轻触/滑动、桌面端点击均支持）

    window.addEventListener('keydown', onKey)
    ro = new ResizeObserver(() => {
      if (rendition && viewer.value) {
        rendition.resize(viewer.value.clientWidth, viewer.value.clientHeight)
      }
    })
    ro.observe(viewer.value)

    // iframe 文档就绪后挂载点击分屏翻页 + 边界滑动跳章（次帧重试一次以应对竞态）
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

// 章节切换：Chapter.vue 传入的 html 变化 → 销毁旧阅读器并重建
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
    <!-- 正常渲染容器 -->
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

    <!-- 上一页 / 下一页：在边界时跳转到相邻章节（图标随状态变化） -->
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
}
.epub-viewer {
  width: 100%;
  height: 100%;
  background: transparent;
}
.epub-viewer.hidden {
  display: none;
}
.epub-viewer :deep(iframe) {
  border: none;
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
  z-index: 10;
}
.epub-page-nav {
  position: absolute;
  bottom: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
  z-index: 5;
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
