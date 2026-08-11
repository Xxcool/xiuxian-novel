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
  gap: 8px;
  margin: 18px auto 8px;
  padding: 6px;
  width: fit-content;
  max-width: 92vw;
  border-radius: 999px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  box-shadow: 0 4px 14px var(--shadow);
  backdrop-filter: blur(6px);
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 20px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color var(--dur-fast) ease,
    color var(--dur-fast) ease, transform var(--dur-fast) ease,
    box-shadow var(--dur-fast) ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn.side:hover:not(.disabled) {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  color: var(--accent);
}

.nav-btn.side:active:not(.disabled) {
  transform: translateY(1px);
}

.nav-btn.disabled {
  opacity: 0.4;
  cursor: default;
}

.nav-btn.center {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent);
}

.nav-btn.center:hover {
  background: var(--accent-soft);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 36%, transparent);
}

.nav-btn.center:active {
  transform: translateY(1px);
}

.nav-icon {
  font-size: 1.15rem;
  line-height: 1;
  opacity: 0.9;
}

.nav-text {
  line-height: 1;
}

@media (max-width: 768px) {
  .chapter-nav {
    gap: 6px;
    padding: 5px;
    margin-top: 14px;
  }
  .nav-btn {
    min-height: 46px;
    padding: 0 18px;
    font-size: 0.92rem;
  }
  .nav-icon {
    font-size: 1.1rem;
  }
}
</style>
