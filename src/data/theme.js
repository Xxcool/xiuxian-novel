// 阅读主题注册表：单一来源，驱动「阅读器内文 + 外壳 Naive UI + 全局 CSS 变量」。
//
// 视觉定调：现代极简。
// 底色走中性灰阶（纯白 / 微暖白 / 宣纸暖白 / 青瓷淡绿 / 深夜墨黑），
// 强调色统一为单一「墨青」色相，不再使用装饰性的暗金与砖红，
// 避免多色相在这类低饱和背景上互相打架造成的陈旧感。
//
// 白天默认 light；系统偏好深色时默认 night（见 useTheme 的 initialKey）。

// 墨青色阶：主色偏深保证正文对比度，浅色辅色用于 hover 与浅色描边
const TEAL = {
  day: '#0f766e',
  dayHover: '#12857c',
  daySoft: '#5eb8ae',
  night: '#5eead4',
  nightHover: '#7bf0de',
  nightSoft: '#2d7069',
}

// 主题定义。bg/text 直接用于阅读器内文，务必保证足够对比度。
export const THEME_LIST = [
  { key: 'light', name: '极简白', bg: '#ffffff', text: '#1c1c1e', desc: '白天首选' },
  { key: 'paper', name: '暖纸白', bg: '#faf8f5', text: '#2b2823', desc: '柔和护眼' },
  { key: 'sepia', name: '宣纸', bg: '#f5f1e8', text: '#33302a', desc: '仿纸质书' },
  { key: 'green', name: '青瓷', bg: '#eef4f2', text: '#22322e', desc: '淡雅护眼' },
  { key: 'night', name: '深夜', bg: '#15171a', text: '#c9ccd1', desc: '夜间护眼' },
]

// 外壳配套令牌。
// bgElev 比 bg 略亮（暗色主题下略暗）形成层次；border 用低对比中性色而非高饱和色。
const SHELL = {
  light: {
    bgElev: '#ffffff',
    textSoft: '#6b7280',
    accent: TEAL.day,
    accentSoft: TEAL.dayHover,
    accentInk: '#065f56',
    border: '#e6e7e9',
    borderStrong: '#d3d5d8',
    shadow: 'rgba(16,24,40,0.06)',
    shadowLg: 'rgba(16,24,40,0.10)',
  },
  paper: {
    bgElev: '#ffffff',
    textSoft: '#6d665c',
    accent: TEAL.day,
    accentSoft: TEAL.dayHover,
    accentInk: '#065f56',
    border: '#e9e4dc',
    borderStrong: '#d8d2c8',
    shadow: 'rgba(43,40,35,0.06)',
    shadowLg: 'rgba(43,40,35,0.10)',
  },
  sepia: {
    bgElev: '#fffdf8',
    textSoft: '#726b5f',
    accent: TEAL.day,
    accentSoft: TEAL.dayHover,
    accentInk: '#065f56',
    border: '#e5ded1',
    borderStrong: '#d2c9b9',
    shadow: 'rgba(51,48,42,0.07)',
    shadowLg: 'rgba(51,48,42,0.11)',
  },
  green: {
    bgElev: '#ffffff',
    textSoft: '#5c6f69',
    accent: TEAL.day,
    accentSoft: TEAL.dayHover,
    accentInk: '#065f56',
    border: '#dce7e3',
    borderStrong: '#c4d6d0',
    shadow: 'rgba(34,50,46,0.07)',
    shadowLg: 'rgba(34,50,46,0.11)',
  },
  night: {
    bgElev: '#1c1f24',
    textSoft: '#9aa1a9',
    accent: TEAL.night,
    accentSoft: TEAL.nightHover,
    accentInk: '#99f6e0',
    border: '#2a2f36',
    borderStrong: '#383f47',
    shadow: 'rgba(0,0,0,0.40)',
    shadowLg: 'rgba(0,0,0,0.55)',
  },
}

// 保留导出以兼容既有引用（不再作为装饰色使用，仅当无强调色时的兜底）
export const GOLD = '#0f766e'
export const DEFAULT_DAY = 'light'
export const DEFAULT_NIGHT = 'night'

export function isDarkKey(key) {
  return key === 'night'
}

export function getTheme(key) {
  return THEME_LIST.find((t) => t.key === key) || THEME_LIST[0]
}

// 阅读器（epub-ts）主题：注入 iframe 内文。
// 标题与正文同色、靠字重区分，符合极简排版；段落松紧由 getReaderCss 控制。
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

export function getNavOverrides(key) {
  const t = getTheme(key)
  const s = SHELL[key] || SHELL.light
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
      borderRadius: '12px',
      fontFamily:
        "-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans CJK SC',system-ui,sans-serif",
    },
  }
}

export function getShellVars(key) {
  const t = getTheme(key)
  const s = SHELL[key] || SHELL.light
  return {
    '--bg': t.bg,
    '--bg-elev': s.bgElev,
    '--text': t.text,
    '--text-soft': s.textSoft,
    '--accent': s.accent,
    '--accent-soft': s.accentSoft,
    '--accent-ink': s.accentInk,
    '--border': s.border,
    '--border-strong': s.borderStrong,
    '--shadow': s.shadow,
    '--shadow-lg': s.shadowLg,
  }
}

// 行距档位（作用于阅读器内文与回退阅读器）
export const LINE_HEIGHT_OPTIONS = [
  { label: '紧凑', value: 1.7 },
  { label: '标准', value: 1.9 },
  { label: '宽松', value: 2.2 },
]

export function getLineHeightLabel(v) {
  const o = LINE_HEIGHT_OPTIONS.find((o) => o.value === Number(v))
  return o ? o.label : '标准'
}
