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
  nextSlug: { type: String, default: '' },
  prevSlug: { type: String, default: '' },
  immersive: { type: Boolean, default: false },
})
const emit = defineEmits(['progress', 'page', 'ready', 'error', 'navigate', 'toggle-ui'])

const EDGE_RATIO = 0.25

const containerRef = ref(null)
const bookRef = ref(null)
const loading = ref(true)
const pages = ref([])
const currentPageIndex = ref(0)
const atEnd = ref(false)
const atStart = ref(true)
const isTouch = ref(false)

let pageFlipInstance = null
let ro = null
let initToken = 0

// 检测是否为触控移动端（手机/平板）
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

// 往后翻（移动端调用物理翻页，Web 桌面端直接平滑切页）
function goNext() {
  if (atEnd.value && props.nextSlug) {
    emit('navigate', props.nextSlug)
    return
  }
  if (isTouch.value && pageFlipInstance) {
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

// 往前翻（移动端调用物理翻页，Web 桌面端直接平滑切页）
function goPrev() {
  if (atStart.value && props.prevSlug) {
    emit('navigate', props.prevSlug)
    return
  }
  if (isTouch.value && pageFlipInstance) {
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

// 点击区域响应：左侧 25% 上一页，右侧 25% 下一页，中间 50% 切换沉浸菜单
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

function cleanup() {
  window.removeEventListener('keydown', onKey)
  ro?.disconnect()
  ro = null
  if (pageFlipInstance) {
    try {
      pageFlipInstance.destroy()
    } catch (e) {
      /* noop */
    }
    pageFlipInstance = null
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
  const containerH = containerRef.value.clientHeight || 620

  // 1. 采用高精度流式 DOM 分页算法将章节切为标准纸页（无内页重复标题与标签）
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
  currentPageIndex.value = 0
  atStart.value = true
  atEnd.value = pageList.length <= 1

  await nextTick()
  if (my !== initToken) return

  try {
    if (isTouch.value && bookRef.value) {
      // 2. 移动端/触屏：挂载 StPageFlip 物理仿真翻页引擎（禁用鼠标事件，仅响应触摸拖拽）
      pageFlipInstance = new PageFlip(bookRef.value, {
        width: containerW,
        height: containerH,
        size: 'fixed',
        minWidth: 240,
        maxWidth: 1600,
        minHeight: 320,
        maxHeight: 2400,
        drawShadow: true,
        maxShadowOpacity: 0.5,
        showCover: false,
        usePortrait: true, // 竖屏单页模式
        flippingTime: 480, // 柔和纸张手感
        swipeDistance: 25,
        useMouseEvents: false, // 彻底禁用鼠标物理卷页，避免鼠标移动引起翘角误触
        mobileScrollSupport: false,
        showPageCorners: true,
        disableFlipByClick: false,
      })

      const pageElements = bookRef.value.querySelectorAll('.flip-page')
      pageFlipInstance.loadFromHTML(pageElements)

      // 翻页事件回调
      pageFlipInstance.on('flip', (e) => {
        const idx = e.data
        currentPageIndex.value = idx
        atStart.value = idx === 0
        atEnd.value = idx >= pages.value.length - 1

        emit('page', { page: idx + 1, total: pages.value.length })
        emit('progress', Math.round(((idx + 1) / pages.value.length) * 100))
      })
    }

    // 首次进度上报
    emit('page', { page: 1, total: pages.value.length })
    emit('progress', Math.round((1 / pages.value.length) * 100))
    emit('ready')

    window.addEventListener('keydown', onKey)

    // 视口大小变化监听
    ro = new ResizeObserver(() => {
      if (containerRef.value) {
        const nw = containerRef.value.clientWidth
        const nh = containerRef.value.clientHeight
        if (nw > 0 && nh > 0 && (Math.abs(nw - containerW) > 10 || Math.abs(nh - containerH) > 10)) {
          renderBook()
        }
      }
    })
    ro.observe(containerRef.value)

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
})

onBeforeUnmount(cleanup)

// 章节切换、字号调整、行距调整 → 重新测算并装载
watch(
  () => [props.title, props.html, props.fontScale, props.lineHeight],
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
  >
    <!-- 1. 移动端/触屏：StPageFlip 物理仿真翻页（手指拖拽整屏卷起露底） -->
    <div v-if="isTouch" class="flip-book" ref="bookRef">
      <div
        v-for="(pageHtml, idx) in pages"
        :key="idx"
        class="flip-page"
        data-density="soft"
      >
        <div class="page-inner">
          <div
            class="page-body"
            v-html="pageHtml"
            :style="{
              fontSize: `calc(18px * ${fontScale})`,
              lineHeight: String(lineHeight),
            }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 2. Web 桌面端：纯净平滑切页（鼠标在正文上移动完全无任何翘角与翻折干扰） -->
    <div v-else class="desktop-reader-view">
      <transition name="page-fade" mode="out-in">
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

    <!-- 加载中排版指示器 -->
    <div v-if="loading" class="flip-loading">
      <span>正在排版…</span>
    </div>

    <!-- 悬浮翻页按钮（桌面端可见） -->
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
.flip-book {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0 auto;
}
/* 移动端物理翻页容器：每一页都是真实的实体纸张，纯粹底色 */
.flip-page {
  background-color: var(--bg);
  color: var(--text);
  overflow: hidden;
}

/* Web 桌面端视图：居中通高，鼠标自由移动不触发卷折 */
.desktop-reader-view {
  width: 100%;
  height: 100%;
  max-width: 960px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
}
.desktop-inner {
  height: 100%;
  cursor: default;
}
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateX(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
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
.page-body :deep(blockquote) {
  border-left: 3px solid rgba(128, 128, 128, 0.35);
  padding: 4px 0 4px 14px;
  margin: 1em 0;
  opacity: 0.82;
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
