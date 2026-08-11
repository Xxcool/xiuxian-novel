<script setup>
import { NList, NListItem } from 'naive-ui'
import { chapters } from '../data/chapters'

defineEmits(['pick'])
</script>

<template>
  <!-- 框架组件 n-list 承载章节列表；卡片视觉由 .chapter-card 自定义 -->
  <n-list class="chapter-list">
    <n-list-item v-for="c in chapters" :key="c.slug">
      <router-link
        class="chapter-card"
        :to="`/chapter/${encodeURIComponent(c.slug)}`"
        @click="$emit('pick')"
      >
        <span class="card-num">{{ c.num }}</span>
        <span class="card-title">{{ c.title }}</span>
        <span class="card-arrow">›</span>
      </router-link>
    </n-list-item>
  </n-list>
</template>
