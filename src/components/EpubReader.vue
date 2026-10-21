<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { PageFlip } from 'page-flip'
import { paginateHtml } from '../utils/dom-paginator'

const props = defineProps({
  title: { type: String, required: true },
  author: { type: String, default: '佚名' },
  html: { type: String, required: true },
  themeKey: { type: String, default: 'night' }, // night | warm | paper
  fontScale: { type: Number, default: 1 }, // 0.875 ~ 1.25
  lineHeight: { type: Number, default: 1.9 }, // 1.6 ~ 2.3
  flipMode: { type: String, default: 'flip' }, // flip | cover | slide | none
  nextSlug: { type: String, default: '' },
  prevSlug: { type: String, default: '' },
  immersive: { type: Boolean, default: false },
})
const emit = defineEmits(['progress', 'page', 'ready', 'error', 'navigate', 'toggle-ui'])

const EDGE_RATIO = 0.25

const containerRef = ref(null)
const flipMountRef = ref(null)
const loading = ref(true)
const pages = ref([])
const currentPageIndex = ref(0)
const atEnd = ref(false)
const atStart = ref(true)
const isTouch = ref(false)
const direction = ref('next') // next | prev

let pageFlipInstance = null
let ro = null
let initToken = 0
let touchStartX = 0
let touchStartY = 0

// 检测是否为移动触控端
function checkIsTouch() {
  if (typeof window === 'undefined') return false
  return (
    ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)) &&
    window.innerWidth <= 1024
  )
}

// 翻页箭头状态与提示
const nextLabel = computed(() => (atEnd.value && props.nextSlug ? '»' : '›'))
const prevLabel = computed(() => (atStart.value && props.prevSlug ? '«' : '‹'))
const nextDisabled = computed(() => atEnd.value && !props.nextSlug)
const prevDisabled = computed(() => atStart.value && !props.prevSlug)

// 动态过渡动画名称
const transitionName = computed(() => {
  if (props.flipMode === 'none') return ''
  if (props.flipMode === 'slide') return `slide-${direction.value}`
  if (props.flipMode === 'cover') return `cover-${direction.value}`
  return 'fade'
})

// 往后翻
function goNext() {
  if (atEnd.value && props.nextSlug) {
    emit('navigate', props.nextSlug)
    return
  }
  direction.value = 'next'
  if (isTouch.value && props.flipMode === 'flip' && pageFlipInstance) {
    try {
      pageFlipInstance.flipNext('bottom')
    } catch (e) {
      /* noop */
    }
  } else {
    if (currentPageIndex.value < pages.value.length - 1) {
      currentPageIndex.value++
      atStart.value = false
      atEnd.value = currentPageIndex.value >= pages.value.length - 1
      emit('page', { page: currentPageIndex.value + 1, total: pages.value.length })
      emit('progress', Math.round(((currentPageIndex.value + 1) / pages.value.length) * 100))
    }
  }
}

// 往前翻
function goPrev() {
  if (atStart.value && props.prevSlug) {
    emit('navigate', props.prevSlug)
    return
  }
  direction.value = 'prev'
  if (isTouch.value && props.flipMode === 'flip' && pageFlipInstance) {
    try {
      pageFlipInstance.flipPrev('bottom')
    } catch (e) {
      /* noop */
    }
  } else {
    if (currentPageIndex.value > 0) {
      currentPageIndex.value--
      atStart.value = currentPageIndex.value === 0
      atEnd.value = false
      emit('page', { page: currentPageIndex.value + 1, total: pages.value.length })
      emit('progress', Math.round(((currentPageIndex.value + 1) / pages.value.length) * 100))
    }
  }
}

function onKey(e) {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault()
    goNext()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goPrev()
  }
}

// 点击响应：左 25% 上一页，右 25% 下一页，中 50% 唤起控制层
function handleContainerClick(e) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const w = rect.width
  if (x < w * EDGE_RATIO) {
    goPrev()
  } else if (x > w * (1 - EDGE_RATIO)) {
    goNext()
  } else {
    emit('toggle-ui')
  }
}

// 触摸手势响应（在平移、覆盖、无动画模式下支持左右滑动翻页）
function handleTouchStart(e) {
  if (props.flipMode === 'flip' && isTouch.value) return
  if (e.touches && e.touches.length > 0) {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }
}

function handleTouchEnd(e) {
  if (props.flipMode === 'flip' && isTouch.value) return
  if (e.changedTouches && e.changedTouches.length > 0) {
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    // 明显的横向手势触发翻页（避免干扰纵向正文滚动）
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) {
        goNext()
      } else {
        goPrev()
      }
    }
  }
}

// 安全销毁原生 PageFlip 与清空挂载点
function cleanup() {
  window.removeEventListener('keydown', onKey)
  if (pageFlipInstance) {
    try {
      pageFlipInstance.destroy()
    } catch (e) {
      /* noop */
    }
    pageFlipInstance = null
  }
  if (flipMountRef.value) {
    flipMountRef.value.innerHTML = ''
  }
}

// 移动端安全挂载原生 PageFlip（原生 DOM 隔离）
function mountPageFlipDOM(pageList, width, height) {
  if (!flipMountRef.value) return

  flipMountRef.value.innerHTML = ''
  const bookEl = document.createElement('div')
  bookEl.className = 'flip-book'

  pageList.forEach((pageHtml) => {
    const pageEl = document.createElement('div')
    pageEl.className = 'flip-page'
    pageEl.setAttribute('data-density', 'soft')
    pageEl.innerHTML = `
      <div class="page-inner">
        <div class="page-body" style="font-size: calc(18px * ${props.fontScale}); line-height: ${props.lineHeight};">
          ${pageHtml}
        </div>
      </div>
    `.trim()
    bookEl.appendChild(pageEl)
  })

  flipMountRef.value.appendChild(bookEl)

  pageFlipInstance = new PageFlip(bookEl, {
    width,
    height,
    size: 'fixed',
    minWidth: 240,
    maxWidth: 1600,
    minHeight: 320,
    maxHeight: 2400,
    drawShadow: true,
    maxShadowOpacity: 0.5,
    showCover: false,
    usePortrait: true,
    flippingTime: 480,
    swipeDistance: 25,
    useMouseEvents: false,
    mobileScrollSupport: false,
    showPageCorners: true,
    disableFlipByClick: false,
  })

  const pageElements = bookEl.querySelectorAll('.flip-page')
  pageFlipInstance.loadFromHTML(pageElements)

  pageFlipInstance.on('flip', (e) => {
    const idx = e.data
    currentPageIndex.value = idx
    atStart.value = idx === 0
    atEnd.value = idx >= pages.value.length - 1

    emit('page', { page: idx + 1, total: pages.value.length })
    emit('progress', Math.round(((idx + 1) / pages.value.length) * 100))
  })

  if (currentPageIndex.value > 0) {
    try {
      pageFlipInstance.flip(currentPageIndex.value)
    } catch (e) {
      /* noop */
    }
  }
}

async function renderBook() {
  const my = ++initToken
  if (!props.html || !containerRef.value) {
    loading.value = false
    return
  }

  cleanup()
  loading.value = true

  await nextTick()
  if (my !== initToken) return

  isTouch.value = checkIsTouch()
  const containerW = containerRef.value.clientWidth || 360
  const containerH = containerRef.value.clientHeight || 520

  // 1. 采用高精度流式 DOM 分页算法将章节切为标准纸页
  const pageList = paginateHtml({
    html: props.html,
    width: containerW,
    height: containerH,
    fontScale: props.fontScale,
    lineHeight: props.lineHeight,
  })

  // 若页数为奇数，补全偶数纸背面，印上典雅的「本章完」结语
  if (pageList.length % 2 !== 0) {
    pageList.push(
      `<div class="page-chapter-fin"><p>—— 本章完 ——</p></div>`
    )
  }

  if (my !== initToken) return
  pages.value = pageList

  const validIndex = Math.min(currentPageIndex.value, pageList.length - 1)
  currentPageIndex.value = Math.max(0, validIndex)
  atStart.value = currentPageIndex.value === 0
  atEnd.value = currentPageIndex.value >= pageList.length - 1

  await nextTick()
  if (my !== initToken) return

  try {
    if (isTouch.value && props.flipMode === 'flip') {
      // 仅在移动端 + 仿真模式下启用原生 PageFlip
      mountPageFlipDOM(pageList, containerW, containerH)
    }

    emit('page', { page: currentPageIndex.value + 1, total: pageList.length })
    emit('progress', Math.round(((currentPageIndex.value + 1) / pageList.length) * 100))
    emit('ready')

    window.addEventListener('keydown', onKey)
    loading.value = false
  } catch (err) {
    if (my !== initToken) return
    console.error('[FlipReader] init failed:', err)
    loading.value = false
    emit('error', err)
  }
}

onMounted(() => {
  renderBook()

  let lastW = 0
  let lastH = 0
  ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const cr = entry.contentRect
      if (cr.width > 0 && cr.height > 0) {
        if (Math.abs(cr.width - lastW) > 12 || Math.abs(cr.height - lastH) > 12) {
          lastW = cr.width
          lastH = cr.height
          renderBook()
        }
      }
    }
  })
  if (containerRef.value) {
    ro.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
  cleanup()
})

// 章节切换、字号、行距、翻页模式切换 → 重新自适应装载
watch(
  () => [props.title, props.html, props.fontScale, props.lineHeight, props.flipMode],
  () => {
    renderBook()
  }
)

defineExpose({ goNext, goPrev })
</script>

<template>
  <div
    class="flip-reader-container"
    ref="containerRef"
    @click="handleContainerClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- 1. 移动端【仿真】物理卷折挂载点（仅在移动端 + 仿真模式下呈现） -->
    <div
      v-show="isTouch && flipMode === 'flip'"
      class="flip-mount-stage"
      ref="flipMountRef"
    ></div>

    <!-- 2. 【平移/覆盖/无动画】及桌面端纯净视图 -->
    <div
      v-show="!isTouch || flipMode !== 'flip'"
      class="desktop-reader-view"
    >
      <transition :name="transitionName" mode="out-in">
        <div
          :key="currentPageIndex"
          class="page-inner desktop-inner"
        >
          <div
            class="page-body"
            v-html="pages[currentPageIndex] || ''"
            :style="{
              fontSize: `calc(18px * ${fontScale})`,
              lineHeight: String(lineHeight),
            }"
          ></div>
        </div>
      </transition>
    </div>

    <!-- 加载中指示器 -->
    <div v-if="loading" class="flip-loading">
      <span>正在排版…</span>
    </div>

    <!-- 悬浮翻页按钮 -->
    <div class="flip-page-nav" :class="{ 'is-hidden': immersive }">
      <button
        class="flip-nav-btn"
        :disabled="prevDisabled"
        @click.stop="goPrev"
        :aria-label="prevLabel === '«' ? '上一章' : '上一页'"
      >
        {{ prevLabel }}
      </button>
      <button
        class="flip-nav-btn"
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
.flip-reader-container {
  position: relative;
  width: 100%;
  flex: 1 1 0%;
  min-height: 0;
  height: 100%;
  background: var(--bg);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  display: flex;
  flex-direction: column;
}

/* 移动端仿真挂载点 */
.flip-mount-stage {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  overflow: hidden;
}
.flip-mount-stage :deep(.flip-book) {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0 auto;
}
.flip-mount-stage :deep(.flip-page) {
  background-color: var(--bg);
  color: var(--text);
  overflow: hidden;
}
.flip-mount-stage :deep(.page-inner) {
  width: 100%;
  height: 100%;
  padding: 16px clamp(18px, 5.5vw, 44px) 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.flip-mount-stage :deep(.page-body) {
  flex: 1;
  font-family: 'Songti SC', 'STSong', 'Noto Serif CJK SC', 'Source Han Serif SC', serif;
  text-align: left;
  word-break: break-word;
}
.flip-mount-stage :deep(.page-chapter-fin) {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-soft);
  font-size: 1.1em;
  letter-spacing: 4px;
  opacity: 0.7;
}
.flip-mount-stage :deep(p) {
  margin: 0 0 1.25em;
  text-indent: 0;
}
.flip-mount-stage :deep(blockquote) {
  border-left: 3px solid rgba(128, 128, 128, 0.35);
  padding: 4px 0 4px 14px;
  margin: 1em 0;
  opacity: 0.82;
}

/* 核心阅读视图（平移/覆盖/无动画/桌面端） */
.desktop-reader-view {
  width: 100%;
  height: 100%;
  max-width: 960px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  flex: 1;
}
.desktop-inner {
  height: 100%;
  cursor: default;
}

.page-inner {
  width: 100%;
  height: 100%;
  padding: 16px clamp(18px, 5.5vw, 44px) 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--accent) 30%, transparent) transparent;
}
.page-body {
  flex: 1;
  font-family: 'Songti SC', 'STSong', 'Noto Serif CJK SC', 'Source Han Serif SC', serif;
  text-align: left;
  word-break: break-word;
}
.page-body :deep(.page-chapter-fin) {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-soft);
  font-size: 1.1em;
  letter-spacing: 4px;
  opacity: 0.7;
}
.page-body :deep(p) {
  margin: 0 0 1.25em;
  text-indent: 0;
}
.page-body :deep(hr) {
  display: none !important;
}
.page-body :deep(blockquote) {
  border-left: 3px solid rgba(128, 128, 128, 0.35);
  padding: 4px 0 4px 14px;
  margin: 1em 0;
  opacity: 0.82;
}

/* 1. 平移模式过渡动画 (Slide) */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.22s ease-out, opacity 0.22s ease-out;
}
.slide-next-enter-from {
  transform: translateX(100%);
  opacity: 0.7;
}
.slide-next-leave-to {
  transform: translateX(-100%);
  opacity: 0.7;
}
.slide-prev-enter-from {
  transform: translateX(-100%);
  opacity: 0.7;
}
.slide-prev-leave-to {
  transform: translateX(100%);
  opacity: 0.7;
}

/* 2. 覆盖模式过渡动画 (Cover) */
.cover-next-enter-active,
.cover-next-leave-active,
.cover-prev-enter-active,
.cover-prev-leave-active {
  transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.24s ease;
}
.cover-next-enter-from {
  transform: translateX(100%);
  box-shadow: -6px 0 20px rgba(0, 0, 0, 0.22);
  z-index: 2;
}
.cover-next-leave-to {
  transform: scale(0.96);
  opacity: 0.6;
}
.cover-prev-enter-from {
  transform: scale(0.96);
  opacity: 0.6;
}
.cover-prev-leave-to {
  transform: translateX(100%);
  box-shadow: -6px 0 20px rgba(0, 0, 0, 0.22);
  z-index: 2;
}

/* 3. 柔和平滑淡入过渡 (Fade) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.16s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.flip-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-soft);
  font-size: 0.95rem;
  letter-spacing: 2px;
  background: var(--bg);
  pointer-events: none;
  z-index: 50;
}
.flip-page-nav {
  position: absolute;
  bottom: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
  z-index: 30;
}
@media (max-width: 768px) {
  .flip-page-nav {
    display: none;
  }
}
.flip-page-nav.is-hidden {
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity var(--dur-normal) var(--ease),
    transform var(--dur-normal) var(--ease);
}
.flip-nav-btn {
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
.flip-nav-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.flip-nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
