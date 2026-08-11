<script setup>
import { NDrawer, NDrawerContent } from 'naive-ui'
import { useTheme } from '../composables/useTheme'
import { useReaderSettings, SCALE_LABELS } from '../composables/useReaderSettings'
import { THEME_LIST, LINE_HEIGHT_OPTIONS, getLineHeightLabel } from '../data/theme'

defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['update:show'])

const { themeKey, setTheme } = useTheme()
const { label, setScale, lineHeight, setLineHeight } = useReaderSettings()
const scaleKeys = Object.keys(SCALE_LABELS)
</script>

<template>
  <!-- 底部弹出阅读设置：移动端不挤占顶栏，也不与翻页手势冲突（仅点击齿轮触发） -->
  <n-drawer
    :show="show"
    placement="bottom"
    :height="420"
    @update:show="emit('update:show', $event)"
  >
    <n-drawer-content title="阅读设置" :native-scrollbar="false" closable>
      <div class="settings">
        <section class="set-group">
          <div class="set-head">
            <span class="set-label">主题</span>
            <span class="set-value">{{
              (THEME_LIST.find((t) => t.key === themeKey) || {}).name
            }}</span>
          </div>
          <div class="theme-grid">
            <button
              v-for="t in THEME_LIST"
              :key="t.key"
              class="theme-card"
              :class="{ active: themeKey === t.key }"
              :style="{ background: t.bg, color: t.text }"
              @click="setTheme(t.key)"
            >
              <span class="theme-name">{{ t.name }}</span>
              <span class="theme-desc">{{ t.desc }}</span>
            </button>
          </div>
        </section>

        <section class="set-group">
          <div class="set-head">
            <span class="set-label">字号</span>
            <span class="set-value">{{ label }}</span>
          </div>
          <div class="seg">
            <button
              v-for="k in scaleKeys"
              :key="k"
              class="seg-item"
              :class="{ active: label === k }"
              @click="setScale(k)"
            >
              {{ k }}
            </button>
          </div>
        </section>

        <section class="set-group">
          <div class="set-head">
            <span class="set-label">行距</span>
            <span class="set-value">{{ getLineHeightLabel(lineHeight) }}</span>
          </div>
          <div class="seg">
            <button
              v-for="o in LINE_HEIGHT_OPTIONS"
              :key="o.value"
              class="seg-item"
              :class="{ active: lineHeight === o.value }"
              @click="setLineHeight(o.value)"
            >
              {{ o.label }}
            </button>
          </div>
        </section>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 6px 2px 14px;
}
.set-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}
.set-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.set-value {
  font-size: 13px;
  color: var(--text-soft);
}
.theme-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 12px 4px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  min-height: 64px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
}
.theme-card .theme-name {
  font-size: 13px;
  font-weight: 600;
}
.theme-card .theme-desc {
  font-size: 10px;
  opacity: 0.75;
}
.theme-card.active {
  box-shadow: 0 0 0 2px var(--accent);
  transform: translateY(-1px);
}
.seg {
  display: flex;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.seg-item {
  flex: 1;
  padding: 11px 0;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.seg-item + .seg-item {
  border-left: 1px solid var(--border);
}
.seg-item.active {
  background: var(--accent);
  color: #fff;
}
.seg-item:not(.active):hover {
  background: var(--bg-elev);
}
</style>
