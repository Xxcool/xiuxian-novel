<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import ePub from '@likecoin/epub-ts'
import { buildEpub } from '../utils/epub-builder'

const props = defineProps({
  title: { type: String, required: true },
  author: { type: String, default: '佚名' },
  html: { type: String, required: true },
  theme: { type: String, default: 'light' }, // 'light' | 'dark'
  fontScale: { type: Number, default: 1 }, // 0.875 ~ 1.25
})
const emit = defineEmits(['progress', 'ready'])

const viewer = ref(null)
const loading = ref(true)
let book = null
let rendition = null
let ro = null

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

function onKey(e) {
  if (!rendition) return
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault()
    rendition.next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    rendition.prev()
  }
}

async function init() {
  const blob = await buildEpub({
    title: props.title,
    author: props.author,
    html: props.html,
  })
  const buf = await blob.arrayBuffer()
  book = ePub(buf)

  rendition = book.renderTo(viewer.value, {
    width: viewer.value.clientWidth || '100%',
    height: viewer.value.clientHeight || '100%',
    spread: 'none',
    flow: 'paginated',
    allowScriptedContent: false,
  })

  rendition.themes.register('light', THEMES.light)
  rendition.themes.register('dark', THEMES.dark)
  rendition.themes.select(props.theme)
  if (props.fontScale) rendition.themes.fontSize(`${props.fontScale}rem`)

  await rendition.display()
  loading.value = false
  emit('ready')

  // 阅读进度来自库自身的 relocated 事件（CFI 定位），非手写滚动计算
  rendition.on('relocated', (loc) => {
    const pct = loc?.start?.percentage
    if (typeof pct === 'number') emit('progress', Math.round(pct * 100))
  })

  // 点击正文区域翻页：仅触发库的 next()，分页布局由库完成
  rendition.on('click', () => rendition.next())

  window.addEventListener('keydown', onKey)
  ro = new ResizeObserver(() => {
    if (rendition && viewer.value) {
      rendition.resize(viewer.value.clientWidth, viewer.value.clientHeight)
    }
  })
  ro.observe(viewer.value)
}

function next() {
  rendition?.next()
}
function prev() {
  rendition?.prev()
}

onMounted(init)
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  ro?.disconnect()
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
})

watch(
  () => props.theme,
  (t) => rendition?.themes.select(t)
)
watch(
  () => props.fontScale,
  (s) => rendition?.themes.fontSize(`${s}rem`)
)

defineExpose({ next, prev })
</script>

<template>
  <div class="epub-reader">
    <div ref="viewer" class="epub-viewer"></div>

    <div v-if="loading" class="epub-loading">正在排版…</div>

    <!-- 上一页 / 下一页：调用库的 prev()/next()，不手写翻页动画 -->
    <div class="epub-page-nav">
      <button class="epub-page-btn" @click="prev" aria-label="上一页">‹</button>
      <button class="epub-page-btn" @click="next" aria-label="下一页">›</button>
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
.epub-viewer :deep(iframe) {
  border: none;
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
}
.epub-page-nav {
  position: absolute;
  bottom: 14px;
  right: 14px;
  display: flex;
  gap: 8px;
  z-index: 5;
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
.epub-page-btn:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
</style>
