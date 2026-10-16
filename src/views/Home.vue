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
</script>

<template>
  <div class="home">
    <header class="home-hero">
      <h1 class="home-title">签到修仙</h1>
      <p class="home-sub">从废柴到万古一帝</p>
      <p class="home-desc">
        废柴少年陈凡，先天五灵根、丹田被封、父母双亡、当众退婚……直到
        <strong>万界签到系统</strong>觉醒。一念签到，逆天改命。
      </p>
      <div class="home-meta">
        <span>已更新至 第 {{ chapters.length }} 章</span>
        <span v-if="readCount" class="dot"></span>
        <span v-if="readCount">已读 {{ readCount }} 章</span>
      </div>
    </header>

    <!-- 继续阅读：有进度才出现，是新访客之外的首要行动入口 -->
    <router-link
      v-if="resume"
      class="resume-card"
      :to="`/chapter/${encodeURIComponent(resume.slug)}`"
    >
      <span class="resume-icon">▸</span>
      <span class="resume-body">
        <span class="resume-label">继续阅读</span>
        <span class="resume-title">
          {{ resume.num }} {{ resume.title }}
        </span>
        <span class="resume-bar">
          <span :style="{ width: (resume.percent || 0) + '%' }"></span>
        </span>
      </span>
      <span class="resume-go">›</span>
    </router-link>

    <chapter-list />
  </div>
</template>
