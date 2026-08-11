<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { getChapterRaw } from '../data/loader'
import { getNeighbor } from '../data/chapters'
import { useTheme } from '../composables/useTheme'
import { useReaderSettings } from '../composables/useReaderSettings'
import ReadingProgress from '../components/ReadingProgress.vue'
import ChapterNav from '../components/ChapterNav.vue'
import EpubReader from '../components/EpubReader.vue'

const route = useRoute()
const { isDark } = useTheme()
const { scale } = useReaderSettings()

const slug = decodeURIComponent(route.params.slug)
const raw = getChapterRaw(slug)
const neighbor = computed(() => getNeighbor(slug))
const found = computed(() => !!raw)

// 阅读进度由 EpubReader 的 relocated 事件驱动（库级定位），受控传给顶栏进度条
const progress = ref(0)

// MD → HTML（marked），HTML 送入 EpubReader 包成 EPUB 由库渲染
const html = computed(() => (raw ? marked.parse(raw) : ''))
const chapterTitle = computed(() => {
  const m = raw && raw.match(/^#\s+(.+)$/m)
  return m ? m[1] : slug
})

function onProgress(p) {
  progress.value = p
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
      @progress="onProgress"
    />
    <chapter-nav :prev="neighbor.prev" :next="neighbor.next" />
  </article>

  <div v-else class="not-found">
    <h1>章节不存在</h1>
    <p>没有找到「{{ slug }}」这一章。</p>
    <router-link class="back-link" to="/">← 返回目录</router-link>
  </div>
</template>
