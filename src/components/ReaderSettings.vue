<script setup>
import { computed } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import { useTheme } from '../composables/useTheme'
import {
  useReaderSettings,
  FLIP_MODES,
  FONT_FAMILIES,
} from '../composables/useReaderSettings'
import { THEME_LIST, LINE_HEIGHT_OPTIONS, getLineHeightLabel } from '../data/theme'

defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['update:show'])

const { themeKey, setTheme } = useTheme()
const {
  fontSize,
  decreaseFontSize,
  increaseFontSize,
  canDecrease,
  canIncrease,
  flipMode,
  setFlipMode,
  fontFamily,
  setFontFamily,
  lineHeight,
  setLineHeight,
} = useReaderSettings()

function cycleFontFamily() {
  const idx = FONT_FAMILIES.findIndex((f) => f.key === fontFamily.value)
  const nextIdx = (idx + 1) % FONT_FAMILIES.length
  setFontFamily(FONT_FAMILIES[nextIdx].key)
}

const currentFontFamilyLabel = computed(() => {
  return (FONT_FAMILIES.find((f) => f.key === fontFamily.value) || FONT_FAMILIES[0]).label
})
</script>

<template>
  <!-- 底部弹出阅读设置：高品质小说阅读器排版设置 -->
  <n-drawer
    :show="show"
    placement="bottom"
    :height="470"
    @update:show="emit('update:show', $event)"
  >
    <n-drawer-content title="阅读设置" :native-scrollbar="false" closable>
      <div class="settings">
        <!-- 1. 字号调节（胶囊步进器 A- 24 A+）与字体 -->
        <section class="set-group">
          <div class="set-head">
            <span class="set-label">字号</span>
          </div>
          <div class="font-controls-row">
            <div class="font-stepper">
              <button
                type="button"
                class="stepper-btn"
                :disabled="!canDecrease"
                @click="decreaseFontSize"
                aria-label="缩小字号"
              >
                A-
              </button>
              <span class="stepper-val">{{ fontSize }}</span>
              <button
                type="button"
                class="stepper-btn"
                :disabled="!canIncrease"
                @click="increaseFontSize"
                aria-label="放大字号"
              >
                A+
              </button>
            </div>

            <button
              type="button"
              class="font-family-btn"
              @click="cycleFontFamily"
              title="切换正文字体"
            >
              <span>{{ currentFontFamilyLabel }}</span>
              <span class="arrow">›</span>
            </button>
          </div>
        </section>

        <!-- 2. 翻页模式选择（仿真、覆盖、平移、无动画） -->
        <section class="set-group">
          <div class="set-head">
            <span class="set-label">翻页效果</span>
          </div>
          <div class="flip-mode-tabs">
            <button
              v-for="m in FLIP_MODES"
              :key="m.key"
              type="button"
              class="mode-pill"
              :class="{ active: flipMode === m.key }"
              @click="setFlipMode(m.key)"
            >
              {{ m.label }}
            </button>
          </div>
        </section>

        <!-- 3. 背景与主题 -->
        <section class="set-group">
          <div class="set-head">
            <span class="set-label">背景颜色</span>
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

        <!-- 4. 行距调节（方案 A：微信读书/掌阅同款可视化疏密线条图标） -->
        <section class="set-group">
          <div class="set-head">
            <span class="set-label">行距</span>
            <span class="set-value">{{ getLineHeightLabel(lineHeight) }}</span>
          </div>
          <div class="line-height-tabs">
            <button
              v-for="o in LINE_HEIGHT_OPTIONS"
              :key="o.value"
              type="button"
              class="lh-pill"
              :class="{ active: Math.abs(lineHeight - o.value) < 0.08 }"
              :title="`行距：${o.label}`"
              :aria-label="`行距：${o.label}`"
              @click="setLineHeight(o.value)"
            >
              <div class="lh-icon" :class="'density-' + o.density">
                <span class="lh-bar"></span>
                <span class="lh-bar"></span>
                <span class="lh-bar"></span>
              </div>
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
  gap: 20px;
  padding: 4px 2px 16px;
}
.set-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.set-label {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text);
}
.set-value {
  font-size: 12.5px;
  color: var(--text-soft);
}

/* 1. 字号胶囊行 */
.font-controls-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.font-stepper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background: color-mix(in srgb, var(--bg-elev) 80%, var(--bg));
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 0 4px;
}
.stepper-btn {
  width: 52px;
  height: 36px;
  border-radius: 18px;
  border: none;
  background: transparent;
  color: var(--text);
  font-family: var(--sans);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, opacity 0.15s ease;
}
.stepper-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}
.stepper-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
.stepper-val {
  font-family: var(--sans);
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}
.font-family-btn {
  flex: 0 0 auto;
  height: 44px;
  padding: 0 16px;
  border-radius: 22px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg-elev) 80%, var(--bg));
  color: var(--text);
  font-family: var(--serif);
  font-size: 13.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.font-family-btn:hover {
  border-color: var(--accent);
}
.font-family-btn .arrow {
  color: var(--text-soft);
  font-size: 16px;
}

/* 2. 翻页模式胶囊组 */
.flip-mode-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  background: color-mix(in srgb, var(--bg-elev) 80%, var(--bg));
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 4px;
}
.mode-pill {
  flex: 1;
  height: 38px;
  border-radius: 19px;
  border: none;
  background: transparent;
  color: var(--text-soft);
  font-family: var(--serif);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.mode-pill:hover:not(.active) {
  color: var(--text);
}
.mode-pill.active {
  background: #ffffff;
  color: #111111;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
[data-theme-key='warm'] .mode-pill.active {
  background: #fdfaf2;
  color: #24352f;
}
[data-theme-key='paper'] .mode-pill.active {
  background: #f4ede1;
  color: #302c27;
}

/* 3. 主题卡片网格 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 10px 4px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  cursor: pointer;
  transition: transform 0.16s var(--ease), box-shadow 0.16s var(--ease),
    border-color 0.16s var(--ease);
  min-height: 58px;
}
.theme-card:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
}
.theme-card .theme-name {
  font-size: 12.5px;
  font-weight: 600;
}
.theme-card .theme-desc {
  font-size: 10px;
  opacity: 0.7;
}
.theme-card.active {
  box-shadow: 0 0 0 2px var(--accent);
  border-color: var(--accent);
}

/* 4. 行距可视化胶囊按钮（方案 A：疏密线条图标） */
.line-height-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px;
  border-radius: 12px;
  gap: 6px;
}
:root[data-theme='night'] .line-height-tabs {
  background: rgba(255, 255, 255, 0.06);
}
.lh-pill {
  flex: 1;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.lh-pill:hover:not(.active) {
  background: rgba(0, 0, 0, 0.03);
}
:root[data-theme='night'] .lh-pill:hover:not(.active) {
  background: rgba(255, 255, 255, 0.04);
}
.lh-pill.active {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
}
:root[data-theme='night'] .lh-pill.active {
  background: rgba(255, 255, 255, 0.16);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.lh-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 32px;
}
.lh-bar {
  display: block;
  height: 2px;
  border-radius: 1.5px;
  background: var(--text-soft);
  transition: background 0.2s, transform 0.2s;
}
.lh-bar:nth-child(1) {
  width: 20px;
}
.lh-bar:nth-child(2) {
  width: 26px;
}
.lh-bar:nth-child(3) {
  width: 16px;
}

.lh-pill.active .lh-bar {
  background: #111111;
}
:root[data-theme='night'] .lh-pill.active .lh-bar {
  background: #ffffff;
}

/* 密实 (1.65) */
.density-dense {
  gap: 3.5px;
}
/* 标准 (1.9) */
.density-normal {
  gap: 6px;
}
/* 宽松 (2.2) */
.density-loose {
  gap: 9px;
}
</style>
