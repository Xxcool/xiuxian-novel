<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { chapters } from '../data/chapters'
import { useReadingProgress } from '../composables/useReadingProgress'

const route = useRoute()
const { isRead, readCount } = useReadingProgress()

defineEmits(['pick'])

// 每组的章节数。110 章按 20 章一组 → 6 组，避免单列过长。
const GROUP_SIZE = 20

const groups = computed(() => {
  const out = []
  for (let i = 0; i < chapters.length; i += GROUP_SIZE) {
    const slice = chapters.slice(i, i + GROUP_SIZE)
    out.push({
      key: `g${i / GROUP_SIZE}`,
      title: `第 ${i + 1} – ${i + slice.length} 章`,
      items: slice,
      readCount: slice.filter((c) => isRead(c.slug)).length,
    })
  }
  return out
})

// ---------- 搜索 ----------
const query = ref('')
const q = computed(() => query.value.trim().toLowerCase())

const results = computed(() => {
  if (!q.value) return []
  return chapters.filter((c) => {
    const num = c.num.replace(/[^\d]/g, '')
    return (
      c.title.toLowerCase().includes(q.value) ||
      c.num.toLowerCase().includes(q.value) ||
      (num && num === q.value)
    )
  })
})

// 搜索时命中关键词高亮
function highlight(text) {
  if (!q.value) return [{ t: text, hit: false }]
  const lower = text.toLowerCase()
  const parts = []
  let i = 0
  let j = lower.indexOf(q.value)
  if (j === -1) return [{ t: text, hit: false }]
  while (j !== -1) {
    if (j > i) parts.push({ t: text.slice(i, j), hit: false })
    parts.push({ t: text.slice(j, j + q.value.length), hit: true })
    i = j + q.value.length
    j = lower.indexOf(q.value, i)
  }
  if (i < text.length) parts.push({ t: text.slice(i), hit: false })
  return parts
}

// ---------- 折叠展开 ----------
// 默认展开「当前阅读章所在组」与包含最新进度的一章所在组，其余折叠
function initOpen() {
  const active = activeSlug.value
  const idx = active ? chapters.findIndex((c) => c.slug === active) : -1
  const gi = idx >= 0 ? Math.floor(idx / GROUP_SIZE) : 0
  return new Set([`g${gi}`])
}
const activeSlug = computed(() => route.params.slug || route.query.chapter || '')
const openKeys = ref(initOpen())

function toggle(key) {
  const s = new Set(openKeys.value)
  s.has(key) ? s.delete(key) : s.add(key)
  openKeys.value = s
}

// 搜索命中时全部自动展开（此时直接展示平铺结果，忽略折叠）
const isSearching = computed(() => q.value.length > 0)

// ---------- 滚动定位 ----------
function scrollToActive() {
  if (!activeSlug.value) return
  nextTick(() => {
    const el = document.querySelector('.chapter-card.active')
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}
onMounted(() => {
  // 初次挂载若有当前章，确保其所在组是展开的
  const idx = chapters.findIndex((c) => c.slug === activeSlug.value)
  if (idx >= 0) {
    const gi = Math.floor(idx / GROUP_SIZE)
    const s = new Set(openKeys.value)
    s.add(`g${gi}`)
    openKeys.value = s
  }
  scrollToActive()
})
watch(activeSlug, scrollToActive)
</script>

<template>
  <div class="chapter-list-wrap">
    <!-- 工具条：搜索 + 已读统计 -->
    <div class="list-toolbar">
      <div class="search-box">
        <span class="search-icon">⌕</span>
        <input
          v-model="query"
          type="search"
          placeholder="搜索章名或章号"
          aria-label="搜索章节"
        />
        <button
          v-if="query"
          class="clear-btn"
          type="button"
          aria-label="清除搜索"
          @click="query = ''"
        >
          ✕
        </button>
      </div>
      <span v-if="readCount" class="progress-chip">
        已读 {{ readCount }}/{{ chapters.length }}
      </span>
    </div>

    <!-- 搜索结果：平铺 -->
    <template v-if="isSearching">
      <p class="list-toolbar" style="justify-content: space-between">
        <span style="font-size: 13px; color: var(--text-soft)">
          找到 {{ results.length }} 章
        </span>
      </p>
      <ul v-if="results.length" class="chapter-list">
        <li v-for="c in results" :key="c.slug">
          <router-link
            class="chapter-card"
            :class="{ active: c.slug === activeSlug, 'is-read': isRead(c.slug) }"
            :to="`/chapter/${encodeURIComponent(c.slug)}`"
            @click="$emit('pick')"
          >
            <span class="read-dot"></span>
            <span class="card-num">{{ c.num }}</span>
            <span class="card-title">
              <span v-for="(p, i) in highlight(c.title)" :key="i">
                <mark v-if="p.hit">{{ p.t }}</mark>
                <template v-else>{{ p.t }}</template>
              </span>
            </span>
            <span class="card-arrow">›</span>
          </router-link>
        </li>
      </ul>
      <p v-else class="list-empty">没有匹配的章节</p>
    </template>

    <!-- 常态：分组 -->
    <div v-else class="chapter-groups">
      <div v-for="g in groups" :key="g.key">
        <button
          class="group-head"
          :class="{ 'is-open': openKeys.has(g.key) }"
          type="button"
          @click="toggle(g.key)"
        >
          <span class="group-caret">›</span>
          <span class="group-title">{{ g.title }}</span>
          <span v-if="g.readCount" class="group-count">{{ g.readCount }} 已读</span>
          <span class="group-range">{{ g.items.length }} 章</span>
        </button>

        <ul v-if="openKeys.has(g.key)" class="chapter-list">
          <li v-for="c in g.items" :key="c.slug">
            <router-link
              class="chapter-card"
              :class="{ active: c.slug === activeSlug, 'is-read': isRead(c.slug) }"
              :to="`/chapter/${encodeURIComponent(c.slug)}`"
              @click="$emit('pick')"
            >
              <span class="read-dot"></span>
              <span class="card-num">{{ c.num }}</span>
              <span class="card-title">{{ c.title }}</span>
              <span class="card-arrow">›</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-arrow {
  color: var(--text-soft);
  font-size: 1.1rem;
  opacity: 0.5;
  flex: none;
  transition: transform var(--dur-fast) var(--ease), opacity var(--dur-fast) var(--ease);
}
.chapter-card:hover .card-arrow {
  transform: translateX(3px);
  opacity: 1;
  color: var(--accent);
}
</style>
