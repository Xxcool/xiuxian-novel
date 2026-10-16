<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineProps({
  prev: { type: Object, default: null },
  next: { type: Object, default: null },
})

// 从阅读页回目录时携带当前章节 slug，使首页目录高亮该章
const route = useRoute()
const homeLink = computed(() =>
  route.params.slug
    ? { path: '/', query: { chapter: route.params.slug } }
    : '/'
)
</script>

<template>
  <nav class="chapter-nav" aria-label="章节导航">
    <router-link
      v-if="prev"
      class="nav-btn side"
      :to="`/chapter/${encodeURIComponent(prev.slug)}`"
      :title="`上一章：${prev.title}`"
    >
      <span class="nav-icon">‹</span>
      <span class="nav-text">上一章</span>
    </router-link>
    <span v-else class="nav-btn side disabled">
      <span class="nav-icon">‹</span>
      <span class="nav-text">上一章</span>
    </span>

    <router-link class="nav-btn center" :to="homeLink">
      <span class="nav-icon">☰</span>
      <span class="nav-text">目录</span>
    </router-link>

    <router-link
      v-if="next"
      class="nav-btn side"
      :to="`/chapter/${encodeURIComponent(next.slug)}`"
      :title="`下一章：${next.title}`"
    >
      <span class="nav-text">下一章</span>
      <span class="nav-icon">›</span>
    </router-link>
    <span v-else class="nav-btn side disabled">
      <span class="nav-text">下一章</span>
      <span class="nav-icon">›</span>
    </span>
  </nav>
</template>

<style scoped>
.chapter-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px;
  width: fit-content;
  max-width: 92vw;
  margin: 0 auto;
  border-radius: 999px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  box-shadow: 0 2px 10px var(--shadow);
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-soft);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn.side:hover:not(.disabled) {
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  color: var(--accent);
}

.nav-btn.side:active:not(.disabled) {
  transform: translateY(1px);
}

.nav-btn.disabled {
  opacity: 0.35;
  cursor: default;
}

/* 中间「目录」改为轻量描边而非实心填充，弱化重心 */
.nav-btn.center {
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 26%, transparent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.nav-btn.center:hover {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: var(--accent);
}

.nav-btn.center:active {
  transform: translateY(1px);
}

.nav-icon {
  font-size: 1.1rem;
  line-height: 1;
  opacity: 0.85;
}

.nav-text {
  line-height: 1;
}

@media (max-width: 768px) {
  .nav-btn {
    min-height: 44px;
    padding: 0 16px;
    font-size: 0.88rem;
  }
}
</style>
