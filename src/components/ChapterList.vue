<script setup>
import { computed, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { chapters } from '../data/chapters'

const route = useRoute()
// 当前正在阅读的章节：阅读页来自路由参数，从首页目录进入时来自 query
const activeSlug = computed(() => route.params.slug || route.query.chapter || '')

defineEmits(['pick'])

function scrollToActive() {
  if (!activeSlug.value) return
  nextTick(() => {
    const el = document.querySelector('.chapter-card.active')
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

onMounted(scrollToActive)
watch(activeSlug, scrollToActive)
</script>

<template>
  <ul class="chapter-list">
    <li v-for="c in chapters" :key="c.slug">
      <router-link
        class="chapter-card"
        :class="{ active: c.slug === activeSlug }"
        :to="`/chapter/${encodeURIComponent(c.slug)}`"
        @click="$emit('pick')"
      >
        <span class="card-num">{{ c.num }}</span>
        <span class="card-title">{{ c.title }}</span>
        <span class="card-arrow">›</span>
      </router-link>
    </li>
  </ul>
</template>
