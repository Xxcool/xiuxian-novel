<script setup>
import { NSpace } from 'naive-ui'

// 上一章 / 下一章为 undefined 时由模板条件渲染（按钮不出现）
defineProps({
  prev: { type: Object, default: null },
  next: { type: Object, default: null },
})
</script>

<template>
  <!-- 框架组件 n-space 负责布局间距；按钮为 Naive n-button -->
  <n-space justify="center" :wrap="true" class="chapter-nav" :size="12">
    <router-link v-if="prev" :to="`/chapter/${encodeURIComponent(prev.slug)}`">
      <n-button>上一章</n-button>
    </router-link>
    <router-link to="/">
      <n-button type="primary">目录</n-button>
    </router-link>
    <router-link v-if="next" :to="`/chapter/${encodeURIComponent(next.slug)}`">
      <n-button>下一章</n-button>
    </router-link>
  </n-space>
</template>
