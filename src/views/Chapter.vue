<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { getChapterRaw } from '../data/loader'
import { getNeighbor } from '../data/chapters'
import ReadingProgress from '../components/ReadingProgress.vue'
import ChapterNav from '../components/ChapterNav.vue'

const route = useRoute()
const slug = decodeURIComponent(route.params.slug)
const raw = getChapterRaw(slug)

// 安全配置：禁用原始 HTML 渲染，避免注入
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false,
})

const html = computed(() => (raw ? md.render(raw) : ''))
const neighbor = computed(() => getNeighbor(slug))
const found = computed(() => !!raw)
</script>

<template>
  <article v-if="found" class="chapter">
    <reading-progress />
    <div class="reader-inner" v-html="html"></div>
    <chapter-nav :prev="neighbor.prev" :next="neighbor.next" />
  </article>

  <div v-else class="not-found">
    <h1>章节不存在</h1>
    <p>没有找到「{{ slug }}」这一章。</p>
    <router-link class="back-link" to="/">← 返回目录</router-link>
  </div>
</template>
