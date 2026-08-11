<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 自定义组件：监听整页滚动，计算阅读进度（框架无等价物）
const progress = ref(0)

function onScroll() {
  const el = document.documentElement
  const max = el.scrollHeight - el.clientHeight
  progress.value = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="reading-progress" aria-hidden="true">
    <div class="bar" :style="{ width: progress + '%' }"></div>
  </div>
</template>
