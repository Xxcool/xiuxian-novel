<script setup>
import { chapters } from '../data/chapters'

defineEmits(['pick'])
</script>

<template>
  <ul class="chapter-list">
    <li v-for="c in chapters" :key="c.slug">
      <router-link
        class="chapter-card"
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
