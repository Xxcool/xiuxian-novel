// 阅读主题注册表：单一来源，驱动「阅读器内文 + 外壳 Naive UI + 全局 CSS 变量」。
//
// 5 套主题的背景/文字严格按需求配置：
//   light 纯白 / sepia 棕黄护眼 / paper 宣纸浅黄 / green 豆沙浅绿 / night 深灰夜间
// 白天默认首选 sepia，夜间默认首选 night（见 useTheme 的初始值）。

export const THEME_LIST = [
  { key: 'light', name: '纯白', bg: '#ffffff', text: '#222222', desc: '强光白天' },
  { key: 'sepia', name: '棕黄护眼', bg: '#f4ecd8', text: '#5c4b38', desc: '最通用护眼' },
  { key: 'paper', name: '宣纸浅黄', bg: '#fff9e8', text: '#333333', desc: '仿纸质书' },
  { key: 'green', name: '豆沙浅绿', bg: '#C7EDCC', text: '#2c4230', desc: '经典电脑护眼色' },
  { key: 'night', name: '深灰夜间', bg: '#1a1a1a', text: '#cccccc', desc: 'LCD 屏幕夜间首选' },
]

// 外壳配套令牌（bg-elev 用于卡片/弹层；textSoft 用于次要文字；accent 用于强调色）
const SHELL = {
  light: { bgElev: '#f5f5f5', textSoft: '#555555', accent: '#9e3d26', accentSoft: '#b8603f', border: '#e5e5e5', shadow: 'rgba(0,0,0,0.08)' },
  sepia: { bgElev: '#faf4e6', textSoft: '#7a6a52', accent: '#9e3d26', accentSoft: '#b8603f', border: '#e0d4ba', shadow: 'rgba(92,75,56,0.08)' },
  paper: { bgElev: '#fffdf5', textSoft: '#666666', accent: '#9e3d26', accentSoft: '#b8603f', border: '#e8e0c8', shadow: 'rgba(51,51,51,0.08)' },
  green: { bgElev: '#d6f2da', textSoft: '#4a6b50', accent: '#9e3d26', accentSoft: '#b8603f', border: '#a9d8b0', shadow: 'rgba(44,66,48,0.10)' },
  night: { bgElev: '#242424', textSoft: '#9a8c78', accent: '#d97757', accentSoft: '#e08c6c', border: '#333333', shadow: 'rgba(0,0,0,0.5)' },
}

export const GOLD = '#c9a96e'
export const DEFAULT_DAY = 'sepia'
export const DEFAULT_NIGHT = 'night'

export function isDarkKey(key) {
  return key === 'night'
}

export function getTheme(key) {
  return THEME_LIST.find((t) => t.key === key) || THEME_LIST[1]
}

// 阅读器（epub-ts）主题：直接注入 iframe 内文。标题沿用正文色，保持护眼一致性。
export function getReaderTheme(key) {
  const t = getTheme(key)
  return {
    body: { background: t.bg, color: t.text },
    h1: { color: t.text },
    h2: { color: t.text },
    h3: { color: t.text },
    a: { color: t.text },
  }
}

// Naive UI 主题覆盖（外壳组件：按钮/抽屉/下拉/开关）
export function getNavOverrides(key) {
  const t = getTheme(key)
  const s = SHELL[key] || SHELL.sepia
  return {
    common: {
      primaryColor: s.accent,
      primaryColorHover: s.accentSoft,
      primaryColorPressed: s.accentSoft,
      primaryColorSuppl: s.accentSoft,
      bodyColor: t.bg,
      cardColor: s.bgElev,
      modalColor: s.bgElev,
      popoverColor: s.bgElev,
      textColorBase: t.text,
      textColor2: s.textSoft,
      textColor3: s.textSoft,
      borderColor: s.border,
      borderRadius: '10px',
      fontFamily:
        "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',system-ui,sans-serif",
    },
  }
}

// 外壳 CSS 变量：驱动 global.css 的设计令牌，使整页（导航/目录/卡片）随主题变化
export function getShellVars(key) {
  const t = getTheme(key)
  const s = SHELL[key] || SHELL.sepia
  return {
    '--bg': t.bg,
    '--bg-elev': s.bgElev,
    '--text': t.text,
    '--text-soft': s.textSoft,
    '--accent': s.accent,
    '--accent-soft': s.accentSoft,
    '--gold': GOLD,
    '--border': s.border,
    '--shadow': s.shadow,
  }
}

// 行距档位（作用于阅读器内文与回退阅读器）
export const LINE_HEIGHT_OPTIONS = [
  { label: '紧凑', value: 1.6 },
  { label: '标准', value: 1.9 },
  { label: '宽松', value: 2.3 },
]

export function getLineHeightLabel(v) {
  const o = LINE_HEIGHT_OPTIONS.find((o) => o.value === Number(v))
  return o ? o.label : '标准'
}
