<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ePub from '@likecoin/epub-ts'
import { buildEpub } from '../utils/epub-builder'

const props = defineProps({
  title: { type: String, required: true },
  author: { type: String, default: '佚名' },
  html: { type: String, required: true },
  theme: { type: String, default: 'light' }, // 'light' | 'dark'
  fontScale: { type: Number, default: 1 }, // 0.875 ~ 1.25
  // 相邻章节 slug：到达本章末尾/开头时，翻页箭头与边界滑动会跳转到对应章节
  nextSlug: { type: String, default: '' },
  prevSlug: { type: String, default: '' },
})
const emit = defineEmits(['progress', 'ready', 'error', 'navigate'])

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

// 昼夜主题经由 epub-ts themes 注入 iframe 内文，与外壳 Naive UI 配色一致
const THEMES = {
  light: {
    body: { background: '#f4ece0', color: '#2b2620' },
    h1: { color: '#9e3d26' },
    h2: { color: '#9e3d26' },
    a: { color: '#9e3d26' },
  },
  dark: {
    body: { background: '#15120e', color: '#ddd2c2' },
    h1: { color: '#d97757' },
    h2: { color: '#d97757' },
    a: { color: '#d97757' },
  },
}

// 翻页箭头图标随边界变化：在末页且有下一章时显示「»」提示将跳下一章
const nextLabel = computed(() => (atEnd.value && props.nextSlug ? '»' : '›'))
const prevLabel = computed(() => (atStart.value && props.prevSlug ? '«' : '‹'))
const nextDisabled = computed(() => error.value || (atEnd.value && !props.nextSlug))
const prevDisabled = computed(() => error.value || (atStart.value && !props.prevSlug))

// 统一的"往后翻"：未到末页→库内翻页；到末页且有下一章→跳下一章
function goNext() {
  if (error.value || !rendition) return
  if (atEnd.value) {
    if (props.nextSlug) emit('navigate', props.nextSlug)
    return
  }
  rendition.next()
}
// 统一的"往前翻"：未到首页→库内翻页；到首页且有上一章→跳上一章
function goPrev() {
  if (error.value || !rendition) return
  if (atStart.value) {
    if (props.prevSlug) emit('navigate', props.prevSlug)
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

// 在 iframe 内文文档上监听横向滑动：仅在处于本章边界时触发跳章，
// 章节内的滑动仍交给 epub-ts 自带的 Touch 管理器做仿真书吸附动画（不冲突）
function setupSwipe() {
  const iframe = viewer.value?.querySelector('iframe')
  const doc = iframe?.contentDocument
  if (!doc) return // 极少数情况下文档尚未就绪，由调用处的 rAF 重试
  let x0 = 0
  let y0 = 0
  let t0 = 0
  const onStart = (e) => {
    const t = e.touches ? e.touches[0] : e
    x0 = t.clientX
    y0 = t.clientY
    t0 = Date.now()
  }
  const onEnd = (e) => {
    const t = e.changedTouches ? e.changedTouches[0] : e
    const dx = t.clientX - x0
    const dy = t.clientY - y0
    const dt = Date.now() - t0
    if (dt > 800) return
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0 && atEnd.value && props.nextSlug) emit('navigate', props.nextSlug)
    else if (dx > 0 && atStart.value && props.prevSlug) emit('navigate', props.prevSlug)
  }
  doc.addEventListener('touchstart', onStart, { passive: true })
  doc.addEventListener('touchend', onEnd, { passive: true })
  swipeCleanup = () => {
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
      // 开启 allow-scripts：epub-ts 会把内容渲染进 sandbox 的 srcdoc iframe，
      // 其内部渲染/主题注入脚本需要 allow-scripts，否则浏览器拦截并报
      // "Blocked script execution in 'about:srcdoc'"，翻页与主题也会失效
      allowScriptedContent: true,
    })

    rendition.themes.register('light', THEMES.light)
    rendition.themes.register('dark', THEMES.dark)
    rendition.themes.select(props.theme)
    if (props.fontScale) rendition.themes.fontSize(`${props.fontScale}rem`)

    await rendition.display()
    if (my !== initToken) return
    loading.value = false
    emit('ready')

    // 阅读进度 + 边界状态来自库自身的 relocated 事件（CFI 定位）
    rendition.on('relocated', (loc) => {
      const pct = loc?.start?.percentage
      if (typeof pct === 'number') emit('progress', Math.round(pct * 100))
      // atEnd / atStart 由库直接给出；个别版本缺失时用整本百分比兜底
      // （每章均为独立 EPUB，100% 即本章末页，0% 即首页）
      atEnd.value = loc?.atEnd ?? (typeof pct === 'number' && pct >= 0.999)
      atStart.value = loc?.atStart ?? (typeof pct === 'number' && pct <= 0.001)
    })

    // 点击正文区域翻页：到末页则跳下一章（由 goNext 内部判断）
    rendition.on('click', () => goNext())

    window.addEventListener('keydown', onKey)
    ro = new ResizeObserver(() => {
      if (rendition && viewer.value) {
        rendition.resize(viewer.value.clientWidth, viewer.value.clientHeight)
      }
    })
    ro.observe(viewer.value)

    // iframe 文档就绪后挂载边界滑动监听（次帧重试一次以应对竞态）
    requestAnimationFrame(() => {
      if (my !== initToken) return
      setupSwipe()
      if (!swipeCleanup) requestAnimationFrame(setupSwipe)
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
  () => props.theme,
  (t) => {
    if (!rendition || error.value) return
    rendition.themes.select(t)
  }
)
watch(
  () => props.fontScale,
  (s) => {
    if (!rendition || error.value) return
    rendition.themes.fontSize(`${s}rem`)
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
      :style="{ fontSize: `calc(17px * ${fontScale})` }"
    ></div>

    <div v-if="loading && !error" class="epub-loading">
      <span>正在排版…</span>
    </div>

    <div v-if="error" class="epub-error-tip">
      EPUB 阅读器加载失败，已切换为普通阅读模式
    </div>

    <!-- 上一页 / 下一页：在边界时跳转到相邻章节（图标随状态变化） -->
    <div class="epub-page-nav" :class="{ disabled: error }">
      <button
        class="epub-page-btn"
        :disabled="prevDisabled"
        @click="goPrev"
        :aria-label="prevLabel === '«' ? '上一章' : '上一页'"
      >
        {{ prevLabel }}
      </button>
      <button
        class="epub-page-btn"
        :disabled="nextDisabled"
        @click="goNext"
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
.epub-page-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--text);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 10px var(--shadow);
  transition: all 0.2s ease;
}
.epub-page-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.epub-page-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
