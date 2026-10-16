import JSZip from 'jszip'

// 阅读区基础排版（字号/行高由 EpubReader 通过 epub-ts themes.override 动态控制，这里只定版式）
// 正文采用宋体书卷排版；字体大小和行高仍由阅读设置动态覆盖。
const READER_CSS = `
body {
  font-family: 'Songti SC','STSong','Noto Serif CJK SC','Source Han Serif SC',serif;
  line-height: 1.9;
  margin: 0;
  padding: 5% 7%;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
h1 { font-size: 1.6em; font-weight: 700; text-align: center; margin: 0.2em 0 1em; letter-spacing: -0.01em; }
h2 { font-size: 1.2em; font-weight: 650; margin: 1.4em 0 0.6em; }
h3 { font-size: 1.05em; font-weight: 600; margin: 1.1em 0 0.5em; opacity: 0.85; }
p { text-indent: 0; margin: 0 0 1.4em; }
blockquote {
  border-left: 3px solid rgba(128,128,128,0.35);
  padding: 6px 0 6px 16px;
  margin: 1.1em 0;
  opacity: 0.82;
}
hr { border: none; border-top: 1px solid rgba(128,128,128,0.25); margin: 1.8em 0; }
table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.92em; }
th, td { border: 1px solid rgba(128,128,128,0.3); padding: 6px 10px; }
a { text-decoration: none; }
`

function escapeXml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// HTML5 void 元素（不闭合），EPUB 的 chapter.xhtml 以严格 XML 解析，必须自闭合
const VOID_TAGS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]

// 把 marked 产出的 HTML5 片段规整为 XHTML，避免 XML 解析器报错
// （对应 "Opening and ending tag mismatch: hr ... and body" 这类错误）
function toXhtml(html = '') {
  if (!html) return ''
  // 1) void 元素自闭合：<hr> → <hr />、<br> → <br />、<img ...> → <img ... />
  const voidRe = new RegExp(`<(${VOID_TAGS.join('|')})\\b([^>]*?)(/?)>`, 'gi')
  let out = html.replace(voidRe, (m, tag, attrs, slash) => {
    if (slash) return m // 已自闭合，保持原样
    return `<${tag}${attrs} />`
  })
  // 2) 游离 & 转义（仅处理不是合法实体引用的 &），防止 XML 解析失败
  out = out.replace(
    /&(?!(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);)/g,
    '&amp;'
  )
  return out
}

function uuid() {
  // RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 把单章 Markdown 渲染后的 HTML 包成最小可用 EPUB（EPUB2 + NCX）。
 * 返回 Blob，可直接 arrayBuffer() 后交给 @likecoin/epub-ts。
 * 全套结构合规，分页/翻页由阅读库负责，这里只生产标准电子书文件。
 */
export async function buildEpub({ title, author = '佚名', html }) {
  const uid = `urn:uuid:${uuid()}`
  const zip = new JSZip()

  // mimetype 必须首个写入且不压缩
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  zip.folder('META-INF').file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  )

  const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh" lang="zh">
<head>
<meta charset="utf-8"/>
<title>${escapeXml(title)}</title>
<style>${READER_CSS}</style>
</head>
<body>
${toXhtml(html)}
</body>
</html>`

  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="bookid" opf:scheme="UUID">${uid}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>zh</dc:language>
    <meta name="generator" content="xx-novel"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="chap1" href="chapter.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chap1"/>
  </spine>
</package>`

  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    <navPoint id="np1" playOrder="1">
      <navLabel><text>${escapeXml(title)}</text></navLabel>
      <content src="chapter.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`

  const oebps = zip.folder('OEBPS')
  oebps.file('content.opf', opf)
  oebps.file('chapter.xhtml', xhtml)
  oebps.file('toc.ncx', ncx)

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
  })
}
