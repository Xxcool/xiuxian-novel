<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { getChapterRaw, prefetchChapters } from '../data/loader'
import { getNeighbor } from '../data/chapters'
import { useTheme } from '../composables/useTheme'
import { useReaderSettings } from '../composables/useReaderSettings'
import ReadingProgress from '../components/ReadingProgress.vue'
import ChapterNav from '../components/ChapterNav.vue'
import EpubReader from '../components/EpubReader.vue'

const route = useRoute()
const router = useRouter()
const { themeKey } = useTheme()
const { scale, lineHeight } = useReaderSettings()

// slug 必须做成响应式：同一 Chapter 组件在章节间跳转时会被 Vue Router 复用，
// 若用普通 const 捕获 route.params.slug，切换章节后内容/相邻章节不会更新（表现为“点了下一章没跳转”）
const slug = computed(() => decodeURIComponent(route.params.slug))
const neighbor = computed(() => getNeighbor(slug.value))

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
// 切换章节时进度归零，交由新阅读器重新上报
watch(slug, () => {
  progress.value = 0
})

// MD → HTML（marked），HTML 送入 EpubReader 包成 EPUB 由库渲染
const html = computed(() => (raw.value ? marked.parse(raw.value) : ''))
const chapterTitle = computed(() => {
  const m = raw.value && raw.value.match(/^#\s+(.+)$/m)
  return m ? m[1] : slug.value
})

function onProgress(p) {
  progress.value = p
}

// 阅读器在末页/首页边界请求跳转到相邻章节（由 EpubReader 的 goNext/goPrev 触发）
function onNavigate(slug) {
  if (!slug) return
  router.push(`/chapter/${encodeURIComponent(slug)}`)
}
</script>

<template>
  <article v-if="found" class="chapter">
    <reading-progress :progress="progress" />
    <epub-reader
      :title="chapterTitle"
      :html="html"
      :theme-key="themeKey"
      :font-scale="scale"
      :line-height="lineHeight"
      :next-slug="neighbor.next?.slug || ''"
      :prev-slug="neighbor.prev?.slug || ''"
      @progress="onProgress"
      @navigate="onNavigate"
    />
    <chapter-nav :prev="neighbor.prev" :next="neighbor.next" />
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
