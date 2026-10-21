<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { PageFlip } from 'page-flip'
import { paginateHtml } from '../utils/dom-paginator'
import { getTheme } from '../data/theme'

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

let pageFlipInstance = null
let ro = null
let initToken = 0
let lastTapTime = 0

// 翻页箭头状态与提示
const nextLabel = computed(() => (atEnd.value && props.nextSlug ? '»' : '›'))
const prevLabel = computed(() => (atStart.value && props.prevSlug ? '«' : '‹'))
const nextDisabled = computed(() => atEnd.value && !props.nextSlug)
const prevDisabled = computed(() => atStart.value && !props.prevSlug)

// 往后翻（右下角仿真卷页，末页跳下一章）
function goNext() {
  if (atEnd.value && props.nextSlug) {
    emit('navigate', props.nextSlug)
    return
  }
  if (pageFlipInstance) {
    try {
      pageFlipInstance.flipNext('bottom')
    } catch (e) {
      /* noop */
    }
  }
}

// 往前翻（左下角仿真卷页，首页跳上一章）
function goPrev() {
  if (atStart.value && props.prevSlug) {
    emit('navigate', props.prevSlug)
    return
  }
  if (pageFlipInstance) {
    try {
      pageFlipInstance.flipPrev('bottom')
    } catch (e) {
      /* noop */
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

function handleCenterTap(e) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const w = rect.width
  if (x > w * EDGE_RATIO && x < w * (1 - EDGE_RATIO)) {
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

  const containerW = containerRef.value.clientWidth || 360
  const containerH = containerRef.value.clientHeight || 620

  // 1. 采用高精度流式 DOM 分页算法将章节切为标准纸页
  const pageList = paginateHtml({
    title: props.title,
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
    // 2. 挂载 StPageFlip 真实物理翻页引擎
    pageFlipInstance = new PageFlip(bookRef.value, {
      width: containerW,
      height: containerH,
      size: 'fixed',
      minWidth: 280,
      maxWidth: 1200,
      minHeight: 380,
      maxHeight: 1600,
      drawShadow: true,
      maxShadowOpacity: 0.55,
      showCover: false,
      usePortrait: true, // 竖屏单页模式
      flippingTime: 480, // 番茄/七猫同款柔和纸张翻折手感
      swipeDistance: 20,
      useMouseEvents: true,
      mobileScrollSupport: false, // 触控由物理引擎接管
      showPageCorners: true, // 角落微翘指引
      disableFlipByClick: false, // 允许边缘点击翻页
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

// 章节切换、字号调整、行距调整 → 重新流式测算并初始化物理翻页
watch(
  () => [props.html, props.fontScale, props.lineHeight],
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
    @click="handleCenterTap"
  >
    <!-- StPageFlip 原生物理翻页容器（文字印在纸上、双面透字、露底下一页） -->
    <div class="flip-book" ref="bookRef">
      <div
        v-for="(pageHtml, idx) in pages"
        :key="idx"
        class="flip-page"
        data-density="soft"
        :style="{
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
        }"
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
          <div class="page-footer">
            <span class="footer-chapter">{{ title }}</span>
            <span class="footer-number">{{ idx + 1 }} / {{ pages.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中排版指示器 -->
    <div v-if="loading" class="flip-loading">
      <span>正在排版…</span>
    </div>

    <!-- 底部悬浮上一页 / 下一页翻页按钮 -->
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
  height: 74vh;
  min-height: 480px;
  background: var(--bg);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}
.flip-book {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0 auto;
}
/* 物理翻页容器：每一页都是真实的实体纸张 */
.flip-page {
  background-color: var(--bg);
  color: var(--text);
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}
.page-inner {
  width: 100%;
  height: 100%;
  padding: 38px clamp(18px, 6vw, 42px) 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.page-body {
  flex: 1;
  font-family: 'Songti SC', 'STSong', 'Noto Serif CJK SC', 'Source Han Serif SC', serif;
  text-align: left;
  word-break: break-word;
  overflow: hidden;
}
.page-body :deep(.page-header) {
  margin-bottom: 24px;
  text-align: center;
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
.page-body :deep(.chapter-mark) {
  display: block;
  font-size: 0.85em;
  color: var(--accent);
  margin-bottom: 6px;
  letter-spacing: 2px;
}
.page-body :deep(h1.page-title) {
  font-size: 1.55em;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  letter-spacing: -0.01em;
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
.page-footer {
  height: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-soft);
  opacity: 0.75;
  border-top: 1px dashed color-mix(in srgb, var(--border) 60%, transparent);
  padding-top: 4px;
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
