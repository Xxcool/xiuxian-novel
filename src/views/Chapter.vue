<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import { getChapterRaw } from '../data/loader'
import { getNeighbor } from '../data/chapters'
import { useTheme } from '../composables/useTheme'
import { useReaderSettings } from '../composables/useReaderSettings'
import ReadingProgress from '../components/ReadingProgress.vue'
import ChapterNav from '../components/ChapterNav.vue'
import EpubReader from '../components/EpubReader.vue'

const route = useRoute()
const router = useRouter()
const { isDark } = useTheme()
const { scale } = useReaderSettings()

// slug 必须做成响应式：同一 Chapter 组件在章节间跳转时会被 Vue Router 复用，
// 若用普通 const 捕获 route.params.slug，切换章节后内容/相邻章节不会更新（表现为“点了下一章没跳转”）
const slug = computed(() => decodeURIComponent(route.params.slug))
const raw = computed(() => getChapterRaw(slug.value))
const neighbor = computed(() => getNeighbor(slug.value))
const found = computed(() => !!raw.value)

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
      :theme="isDark ? 'dark' : 'light'"
      :font-scale="scale"
      :next-slug="neighbor.next?.slug || ''"
      :prev-slug="neighbor.prev?.slug || ''"
      @progress="onProgress"
      @navigate="onNavigate"
    />
    <chapter-nav :prev="neighbor.prev" :next="neighbor.next" />
  </article>

  <div v-else class="not-found">
    <h1>章节不存在</h1>
    <p>没有找到「{{ slug }}」这一章。</p>
    <router-link class="back-link" to="/">← 返回目录</router-link>
  </div>
</template>
