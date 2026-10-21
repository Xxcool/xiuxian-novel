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
const flipMountRef = ref(null)
const loading = ref(true)
const pages = ref([])
const currentPageIndex = ref(0)
const atEnd = ref(false)
const atStart = ref(true)
const isTouch = ref(false)

let pageFlipInstance = null
let ro = null
let initToken = 0

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

// 往后翻
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

// 往前翻
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

// 安全销毁原生 PageFlip 与清空挂载点，避免与 Vue DOM diff 发生冲突
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

// 移动端安全挂载原生 PageFlip（原生 DOM 隔离，杜绝 Vue VNode 追踪异常）
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
    useMouseEvents: false, // 彻底禁用鼠标物理卷页，避免鼠标移动引起翘角误触
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

  // 如果原本处于某一页，恢复翻到该页
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

  // 保持当前阅读页码在安全区间
  const validIndex = Math.min(currentPageIndex.value, pageList.length - 1)
  currentPageIndex.value = Math.max(0, validIndex)
  atStart.value = currentPageIndex.value === 0
  atEnd.value = currentPageIndex.value >= pageList.length - 1

  await nextTick()
  if (my !== initToken) return

  try {
    if (isTouch.value) {
      // 2. 移动端/触屏：原生隔离挂载 StPageFlip
      mountPageFlipDOM(pageList, containerW, containerH)
    }

    // 进度上报
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

  // 视口大小变化监听
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
    <!-- 1. 移动端原生隔离挂载点（黑盒 DOM 隔离，彻底防止 Vue insertBefore/nextSibling 异常） -->
    <div
      v-show="isTouch"
      class="flip-mount-stage"
      ref="flipMountRef"
    ></div>

    <!-- 2. Web 桌面端纯 Vue 响应式视图（鼠标移动绝无翘角翻折干扰） -->
    <div v-show="!isTouch" class="desktop-reader-view">
      <div class="page-inner desktop-inner">
        <div
          class="page-body"
          v-html="pages[currentPageIndex] || ''"
          :style="{
            fontSize: `calc(18px * ${fontScale})`,
            lineHeight: String(lineHeight),
          }"
        ></div>
      </div>
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

/* 移动端原生挂载点 */
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

/* Web 桌面端视图 */
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
