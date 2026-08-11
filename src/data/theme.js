// Naive UI 主题覆盖：把 DESIGN.md 第 3 节设计令牌灌进框架组件。
// 正文排版令牌（颜色/字号/行高）走 global.css 的 CSS 变量，不在此重复定义，避免双来源。

export const lightThemeOverrides = {
  common: {
    primaryColor: '#9e3d26',
    primaryColorHover: '#b8603f',
    primaryColorPressed: '#873322',
    primaryColorSuppl: '#b8603f',
    bodyColor: '#f4ece0',
    cardColor: '#fbf6ec',
    modalColor: '#fbf6ec',
    popoverColor: '#fbf6ec',
    textColorBase: '#2b2620',
    textColor2: '#6b5d4a',
    textColor3: '#6b5d4a',
    borderColor: '#e3d6c0',
    borderRadius: '10px',
    fontFamily:
      "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',system-ui,sans-serif",
  },
}

export const darkThemeOverrides = {
  common: {
    primaryColor: '#d97757',
    primaryColorHover: '#e08c6c',
    primaryColorPressed: '#c76647',
    primaryColorSuppl: '#e08c6c',
    bodyColor: '#15120e',
    cardColor: '#211c16',
    modalColor: '#211c16',
    popoverColor: '#211c16',
    textColorBase: '#ddd2c2',
    textColor2: '#9a8c78',
    textColor3: '#9a8c78',
    borderColor: '#3a322a',
    borderRadius: '10px',
    fontFamily:
      "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',system-ui,sans-serif",
  },
}
