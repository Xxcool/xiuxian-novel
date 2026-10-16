<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { chapters } from '../data/chapters'
import { useReadingProgress } from '../composables/useReadingProgress'

defineEmits(['pick'])

// panel：首页大目录（大标题 + 两列网格 + 景图面板）；
// drawer：顶栏抽屉紧凑版（单列、无大标题——抽屉自带「章节列表」标题，
// 也不带面板底色，避免与抽屉背景形成两块颜色）。
const props = defineProps({
  variant: { type: String, default: 'panel' },
})

const route = useRoute()
const { isRead, readCount, lastRead } = useReadingProgress()
const GROUP_SIZE = 20
const activeSlug = computed(() => route.params.slug || route.query.chapter || lastRead.value?.slug || '')
const groups = computed(() => {
  const out = []
  for (let i = 0; i < chapters.length; i += GROUP_SIZE) {
    const items = chapters.slice(i, i + GROUP_SIZE)
    out.push({ key: i / GROUP_SIZE, title: `第 ${i + 1}—${i + items.length} 章`, items })
  }
  return out
})
const activeGroup = computed(() => {
  const i = chapters.findIndex((c) => c.slug === activeSlug.value)
  return i < 0 ? 0 : Math.floor(i / GROUP_SIZE)
})
const selectedGroup = ref(activeGroup.value)
watch(activeGroup, (value) => { selectedGroup.value = value })
const selected = computed(() => groups.value[selectedGroup.value])
</script>

<template>
  <section
    class="chapter-list-wrap"
    :class="{ 'is-drawer': props.variant === 'drawer' }"
    aria-label="章节目录"
  >
    <div v-if="props.variant === 'panel'" class="directory-heading">
      <div>
        <h2>章节目录 <span class="heading-rule"></span></h2>
      </div>
      <span class="directory-total">已读 {{ readCount }} / {{ chapters.length }} 章</span>
    </div>
    <div v-else class="drawer-total directory-total">
      已读 {{ readCount }} / {{ chapters.length }} 章
    </div>
    <div class="chapter-tabs" role="tablist" aria-label="章节分组">
      <button
        v-for="g in groups" :key="g.key" type="button" role="tab"
        :aria-selected="selectedGroup === g.key"
        :class="{ active: selectedGroup === g.key }"
        @click="selectedGroup = g.key"
      >{{ g.title }}</button>
    </div>
    <ul v-if="selected" class="chapter-grid">
      <li v-for="c in selected.items" :key="c.slug">
        <router-link
          class="chapter-card"
          :class="{ active: c.slug === activeSlug, 'is-read': isRead(c.slug) }"
          :to="`/chapter/${encodeURIComponent(c.slug)}`"
          @click="$emit('pick')"
        >
          <span class="card-num">{{ c.num }}</span>
          <span class="card-title">{{ c.title }}</span>
          <span class="read-dot" v-if="isRead(c.slug)">已读</span>
          <span class="card-arrow" aria-hidden="true">›</span>
        </router-link>
      </li>
    </ul>
  </section>
</template>
