<script setup>
// 受控组件：进度由 EpubReader 的 relocated 事件传入（库级 CFI 定位）
// 框架无等价物，故保留为自定义组件
defineProps({
  progress: { type: Number, default: 0 },
})
</script>

<template>
  <div class="reading-progress" aria-hidden="true">
    <div class="bar" :style="{ width: progress + '%' }"></div>
  </div>
</template>
