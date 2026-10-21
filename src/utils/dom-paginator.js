/**
 * 纯前端高精度流式 DOM 分页器 (Smart DOM Paginator)
 * 将 Markdown 生成的 HTML 内容，按指定容器宽高精确拆分为多个 <div class="book-page"> 页面，
 * 供 StPageFlip (page-flip) 物理翻页引擎直接装载。
 */

/**
 * 把一段长文本拆分成适合当页高度的切片
 */
function splitParagraphToFit(pText, measurer, availableHeight) {
  // 按句子标点进行初切，避免断在词语中间
  const sentences = pText.split(/(?<=[。！？；\n])/g)
  let fitText = ''
  let remainText = ''

  for (let i = 0; i < sentences.length; i++) {
    const testText = fitText + sentences[i]
    measurer.innerHTML = `<p>${testText}</p>`
    if (measurer.offsetHeight <= availableHeight) {
      fitText = testText
    } else {
      remainText = sentences.slice(i).join('')
      break
    }
  }

  // 若一句都放不下，按字强制拆分
  if (!fitText && pText) {
    let low = 0
    let high = pText.length
    let best = 0
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      measurer.innerHTML = `<p>${pText.slice(0, mid)}</p>`
      if (measurer.offsetHeight <= availableHeight) {
        best = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    fitText = pText.slice(0, best)
    remainText = pText.slice(best)
  }

  return { fitText, remainText }
}

/**
 * 分页核心函数
 * @param {Object} options
 * @param {string} options.html Markdown解析后的 HTML
 * @param {number} options.width 容器宽度 (px)
 * @param {number} options.height 容器高度 (px)
 * @param {number} options.fontScale 字号缩放系数
 * @param {number} options.lineHeight 行高系数
 * @returns {Array<string>} 各页面的内部 HTML 片段数组
 */
export function paginateHtml({
  html,
  width,
  height,
  fontScale = 1,
  lineHeight = 1.9,
}) {
  if (typeof document === 'undefined') return [html]

  const PADDING_V_TOP = 16
  const PADDING_V_BOTTOM = 28 // 底部安全缓冲，确保最后一行绝不贴底或被压住
  const PADDING_H = Math.max(18, Math.min(48, Math.round(width * 0.055)))
  const contentWidth = Math.max(200, width - PADDING_H * 2)
  const contentHeight = Math.max(200, height - PADDING_V_TOP - PADDING_V_BOTTOM)

  // 创建不可见的离屏测量容器
  const measurer = document.createElement('div')
  measurer.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: ${contentWidth}px;
    font-family: 'Songti SC', 'STSong', 'Noto Serif CJK SC', 'Source Han Serif SC', serif;
    font-size: calc(18px * ${fontScale});
    line-height: ${lineHeight};
    text-align: left;
    visibility: hidden;
    pointer-events: none;
    word-break: break-word;
    box-sizing: border-box;
  `
  document.body.appendChild(measurer)

  // 将原始 HTML 节点化
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  const nodes = Array.from(tempDiv.children)

  const pages = []
  let currentPageHtml = []
  let currentUsedHeight = 0

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const tag = node.tagName.toLowerCase()

    if (tag === 'p') {
      const pText = node.innerHTML.trim()
      if (!pText) continue

      measurer.innerHTML = `<p>${pText}</p>`
      const pHeight = measurer.offsetHeight + 14 // 包含段间距 margin-bottom

      const available = contentHeight - currentUsedHeight

      if (pHeight <= available) {
        // 放得下整段
        currentPageHtml.push(`<p>${pText}</p>`)
        currentUsedHeight += pHeight
      } else {
        // 如果当前页还有不少空间，尝试把段落拆开一部分填充剩余空间
        if (available > 60) {
          const { fitText, remainText } = splitParagraphToFit(pText, measurer, available - 14)
          if (fitText) {
            currentPageHtml.push(`<p>${fitText}</p>`)
          }
          // 封存当前页
          pages.push(currentPageHtml.join(''))
          // 开启新页
          currentPageHtml = []
          currentUsedHeight = 0

          if (remainText) {
            // 剩余文字插到下一个待处理循环
            const remainNode = document.createElement('p')
            remainNode.innerHTML = remainText
            nodes.splice(i + 1, 0, remainNode)
          }
          continue
        } else {
          // 当前页空间所剩无几，直接换到新页
          if (currentPageHtml.length > 0) {
            pages.push(currentPageHtml.join(''))
            currentPageHtml = []
            currentUsedHeight = 0
          }
          currentPageHtml.push(`<p>${pText}</p>`)
          currentUsedHeight = pHeight
        }
      }
    } else {
      // 其它元素（如 blockquote, hr, table 等）
      measurer.innerHTML = node.outerHTML
      const nodeHeight = measurer.offsetHeight + 16

      if (nodeHeight <= contentHeight - currentUsedHeight) {
        currentPageHtml.push(node.outerHTML)
        currentUsedHeight += nodeHeight
      } else {
        if (currentPageHtml.length > 0) {
          pages.push(currentPageHtml.join(''))
          currentPageHtml = []
          currentUsedHeight = 0
        }
        currentPageHtml.push(node.outerHTML)
        currentUsedHeight = nodeHeight
      }
    }
  }

  if (currentPageHtml.length > 0) {
    pages.push(currentPageHtml.join(''))
  }

  document.body.removeChild(measurer)
  return pages.length > 0 ? pages : [html]
}
