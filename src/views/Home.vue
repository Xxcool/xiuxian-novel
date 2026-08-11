<script setup>
import ChapterList from '../components/ChapterList.vue'
import { chapters } from '../data/chapters'
</script>

<template>
  <div class="home">
    <header class="home-hero">
      <div class="seal">仙</div>
      <h1 class="home-title">签到修仙</h1>
      <p class="home-sub">从废柴到万古一帝</p>
      <p class="home-desc">
        废柴少年陈凡，先天五灵根、丹田被封、父母双亡、当众退婚……直到
        <strong>万界签到系统</strong>觉醒。一念签到，逆天改命。已更新至
        <strong>第 {{ chapters.length }} 章</strong>。
      </p>
    </header>
    <chapter-list />
  </div>
</template>
