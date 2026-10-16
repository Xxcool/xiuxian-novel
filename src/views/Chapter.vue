<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { getChapterRaw, prefetchChapters } from '../data/loader'
import { chapters, getNeighbor } from '../data/chapters'
import { useTheme } from '../composables/useTheme'
import { useReaderSettings } from '../composables/useReaderSettings'
import { useImmersive } from '../composables/useImmersive'
import { useReadingProgress } from '../composables/useReadingProgress'
import ReadingProgress from '../components/ReadingProgress.vue'
import ChapterNav from '../components/ChapterNav.vue'
import EpubReader from '../components/EpubReader.vue'
import ReaderSettings from '../components/ReaderSettings.vue'

const route = useRoute()
const router = useRouter()
const { themeKey } = useTheme()
const { scale, lineHeight } = useReaderSettings()
const { immersive, toggle: toggleImmersive, exit: exitImmersive } = useImmersive()
const { record, markRead } = useReadingProgress()

// slug 必须做成响应式：同一 Chapter 组件在章节间跳转时会被 Vue Router 复用，
// 若用普通 const 捕获 route.params.slug，切换章节后内容/相邻章节不会更新（表现为“点了下一章没跳转”）
const slug = computed(() => decodeURIComponent(route.params.slug))
const neighbor = computed(() => getNeighbor(slug.value))
const currentChapter = computed(() => chapters.find((c) => c.slug === slug.value))

// 章节正文按需加载（见 loader.js）：getChapterRaw 返回 Promise，
// 这里存到 ref 并在 slug 变化时重新拉取；null 表示未就绪，'' 表示章节不存在。
const raw = ref(null)
const loadedSlug = ref('')

watch(
  slug,
  (s) => {
    const p = getChapterRaw(s)
    // 同步快速切换时可能先发出旧请求，标记当前 slug 以丢弃过期结果
    loadedSlug.value = s
    raw.value = null
    p.then((text) => {
      if (loadedSlug.value !== s) return
      raw.value = text
    })
    markRead(s)
  },
  { immediate: true },
)

const found = computed(() => raw.value !== null && raw.value !== '')
// 正文未就绪与确实不存在要区分开：前者显示加载中，后者显示「章节不存在」
const loading = computed(() => raw.value === null)

// 读完本章往往直接点下一章，提前把相邻两章拉下来，翻页即可秒开
watch(
  neighbor,
  (nb) => {
    prefetchChapters([nb.prev?.slug, nb.next?.slug])
  },
  { immediate: true },
)

// 阅读进度由 EpubReader 的 relocated 事件驱动（库级定位），受控传给顶栏进度条
const progress = ref(0)
const pageLabel = ref('1 / 1')
const readerRef = ref(null)
const mobileSettingsOpen = ref(false)
// 切换章节时进度归零，交由新阅读器重新上报
watch(slug, () => {
  progress.value = 0
  pageLabel.value = '1 / 1'
})

// 所有章节顶部的概要、爽点、情绪曲线是创作提纲，不属于读者看到的正文。
const html = computed(() => {
  if (!raw.value) return ''
  const divider = raw.value.indexOf('\n---\n')
  const hasOutline = divider > 0 && raw.value.slice(0, divider).includes('**本章概要**')
  const body = hasOutline ? raw.value.slice(divider + 5).trimStart() : raw.value
  return marked.parse(body.replace(/^#\s+.+\n*/, '').trimStart())
})
const chapterTitle = computed(() => {
  const m = raw.value && raw.value.match(/^#\s+(.+)$/m)
  return m ? m[1] : slug.value
})

function onProgress(p) {
  progress.value = p
  // 记住本章读到哪，供首页「继续阅读」使用
  record(slug.value, p, chapterTitle.value)
}
function onPage({ page, total }) {
  pageLabel.value = `${page} / ${total}`
}

// 阅读器在末页/首页边界请求跳转到相邻章节（由 EpubReader 的 goNext/goPrev 触发）
function onNavigate(s) {
  if (!s) return
  router.push(`/chapter/${encodeURIComponent(s)}`)
}

// 章节内 switch：Esc 退出沉浸模式
function onKey(e) {
  if (e.key === 'Escape' && immersive.value) {
    e.preventDefault()
    exitImmersive()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  // 离开阅读页务必退出沉浸模式，否则回到首页顶栏是隐藏的
  exitImmersive()
})
</script>

<template>
  <article v-if="found" class="chapter">
    <reading-progress :progress="progress" />

    <header class="chapter-head" :class="{ 'is-hidden': immersive }">
      <span class="ch-num">{{ currentChapter?.num || '' }}</span>
      <h1 class="ch-title">{{ chapterTitle.replace(/^第\s*\d+\s*章\s*/, '') }}</h1>
    </header>

    <epub-reader
      ref="readerRef"
      :title="chapterTitle"
      :html="html"
      :theme-key="themeKey"
      :font-scale="scale"
      :line-height="lineHeight"
      :next-slug="neighbor.next?.slug || ''"
      :prev-slug="neighbor.prev?.slug || ''"
      :immersive="immersive"
      @progress="onProgress"
      @page="onPage"
      @navigate="onNavigate"
      @toggle-ui="toggleImmersive"
    />

    <div class="chapter-nav-wrap" :class="{ 'is-hidden': immersive }">
      <chapter-nav :prev="neighbor.prev" :next="neighbor.next" />
      <span class="desktop-reader-progress">{{ pageLabel }}<small>可使用键盘左右方向键翻页</small></span>
    </div>

    <nav class="mobile-reader-controls" :class="{ 'is-hidden': immersive }" aria-label="手机阅读控制">
      <router-link :to="{ path: '/', query: { chapter: slug } }" aria-label="目录">☰<small>目录</small></router-link>
      <button type="button" aria-label="上一页" @click="readerRef?.goPrev()">‹</button>
      <span class="mobile-reader-progress">{{ pageLabel }}</span>
      <button type="button" aria-label="下一页" @click="readerRef?.goNext()">›</button>
      <button type="button" aria-label="阅读设置" @click="mobileSettingsOpen = true">Aa<small>阅读设置</small></button>
    </nav>
    <reader-settings v-model:show="mobileSettingsOpen" />

    <p v-if="immersive" class="immersive-hint">再次轻触屏幕中央可唤出界面</p>
  </article>

  <div v-else-if="loading" class="not-found">
    <h1>载入中…</h1>
    <p>正在加载「{{ slug }}」。</p>
  </div>

  <div v-else class="not-found">
    <h1>章节不存在</h1>
    <p>没有找到「{{ slug }}」这一章。</p>
    <router-link class="back-link" to="/">← 返回目录</router-link>
  </div>
</template>

<style scoped>
.chapter-head {
  transition: opacity var(--dur-normal) var(--ease),
    transform var(--dur-normal) var(--ease);
}
.chapter-head.is-hidden {
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
}
</style>
