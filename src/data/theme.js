// 阅读主题单一来源：外壳、EPUB 正文和首页景图共用同一个 key。
export const THEME_LIST = [
  { key: 'night', name: '月下', bg: '#111D26', text: '#e7e1d5', desc: '深夜沉浸', accent: '#c9ad75', accentText: '#17202b', heroTint: 'rgba(10, 19, 30, .08)' },
  { key: 'warm', name: '暖白', bg: '#f8f7f2', text: '#24352f', desc: '清爽书房', accent: '#27533f', accentText: '#fffdf5', heroTint: 'rgba(225, 230, 211, .39)' },
  { key: 'paper', name: '宣纸', bg: '#f7f1e7', text: '#302c27', desc: '温和护眼', accent: '#a44334', accentText: '#fffaf4', heroTint: 'rgba(237, 216, 189, .45)' },
]
const SHELL = {
  // seal：朱砂印章色。深色底上提亮保证对比，浅色主题共用同一档朱砂。
  night: { bgElev: '#1a2b36', textSoft: '#b5b4ad', border: '#31404c', borderStrong: '#4a5a66', shadow: 'rgba(0, 0, 0, .22)', shadowLg: 'rgba(0, 0, 0, .38)', directory: 'rgba(18, 29, 41, .91)', seal: '#c8543f' },
  warm: { bgElev: '#fffefa', textSoft: '#697a70', border: '#d9e1d8', borderStrong: '#bfcfc1', shadow: 'rgba(36, 60, 46, .07)', shadowLg: 'rgba(36, 60, 46, .13)', directory: 'rgba(252, 253, 247, .91)', seal: '#a44334' },
  paper: { bgElev: '#fffbf4', textSoft: '#766c62', border: '#e4d8c9', borderStrong: '#d0bfa9', shadow: 'rgba(55, 40, 29, .07)', shadowLg: 'rgba(55, 40, 29, .14)', directory: 'rgba(251, 245, 234, .91)', seal: '#a44334' },
}
export const GOLD = '#c9ad75'
export const DEFAULT_DAY = 'warm'
export const DEFAULT_NIGHT = 'night'
export function isDarkKey(key) { return key === 'night' }
export function getTheme(key) { return THEME_LIST.find((t) => t.key === key) || THEME_LIST[0] }
export function getReaderTheme(key) {
  const { bg, text } = getTheme(key)
  return { body: { background: bg, color: text }, h1: { color: text }, h2: { color: text }, h3: { color: text }, a: { color: text } }
}
export function getShellVars(key) {
  const t = getTheme(key)
  const s = SHELL[t.key]
  return {
    '--bg': t.bg, '--bg-elev': s.bgElev, '--text': t.text, '--text-soft': s.textSoft,
    '--accent': t.accent, '--accent-soft': t.accent, '--accent-ink': t.accentText,
    '--border': s.border, '--border-strong': s.borderStrong, '--shadow': s.shadow,
    '--shadow-lg': s.shadowLg, '--hero-tint': t.heroTint, '--directory-bg': s.directory,
    '--seal-ink': s.seal,
  }
}
export function getNavOverrides(key) {
  const t = getTheme(key)
  const s = SHELL[t.key]
  return { common: {
    primaryColor: t.accent, primaryColorHover: t.accent, primaryColorPressed: t.accent,
    primaryColorSuppl: t.accent, bodyColor: t.bg, cardColor: s.bgElev,
    modalColor: s.bgElev, popoverColor: s.bgElev, textColorBase: t.text,
    textColor2: s.textSoft, textColor3: s.textSoft, borderColor: s.border,
    borderRadius: '10px', fontFamily: "-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif",
  } }
}
export const LINE_HEIGHT_OPTIONS = [
  { label: '紧凑', value: 1.7 }, { label: '标准', value: 1.9 }, { label: '宽松', value: 2.2 },
]
export function getLineHeightLabel(v) {
  return LINE_HEIGHT_OPTIONS.find((o) => o.value === Number(v))?.label || '标准'
}
