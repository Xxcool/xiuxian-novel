<script setup>
import { computed } from 'vue'
import ChapterList from '../components/ChapterList.vue'
import { chapters } from '../data/chapters'
import { useReadingProgress } from '../composables/useReadingProgress'

const { lastRead, readCount } = useReadingProgress()

// 继续阅读：优先展示记住的位置；percent<1 视为刚开始，文案用「开始阅读」
const resume = computed(() => {
  const lr = lastRead.value
  if (!lr?.slug) return null
  const c = chapters.find((x) => x.slug === lr.slug)
  if (!c) return null
  return {
    ...c,
    percent: typeof lr.percent === 'number' ? lr.percent : 0,
  }
})
const startChapter = computed(() => resume.value || chapters[0])
</script>

<template>
  <div class="home">
    <header class="home-hero">
      <div class="hero-copy">
      <h1 class="home-title">签到修仙</h1>
      <p class="home-sub">从废柴到万古一帝</p>
      <div class="home-meta">
        <span>连载中</span><span aria-hidden="true">·</span><span>已更新 {{ chapters.length }} 章</span>
      </div>
      <router-link class="hero-cta" :to="`/chapter/${encodeURIComponent(startChapter.slug)}`">
        {{ resume ? '继续阅读' : '开始阅读' }} <span aria-hidden="true">→</span>
      </router-link>
      <p class="hero-position">{{ startChapter.num }}　{{ startChapter.title }}</p>
      </div>
    </header>

    <chapter-list />
  </div>
</template>
