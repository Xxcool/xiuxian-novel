// 章节 md 按需加载。
//
// 早期用 eager: true 把全部章节内联进主 chunk，章节少时简单直接；
// 但现有 110 章、源 md 合计约 849 KB（约 23 万字），eager 会把整本书
// 塞进首屏 JS（gzip 后仍 300KB+），移动端首屏明显变慢。
//
// 现在改为 lazy：glob 只建立「路径 → 动态 import 函数」的映射，不含正文；
// 正文在章节真正被访问时才按需下载，Vite 会把每章拆成独立 chunk。
// 结果恒以 Promise 返回（命中缓存时也包成 Promise），重复访问不再发请求。

const modules = import.meta.glob('../content/*.md', {
  query: '?raw',
  import: 'default',
})

const cache = new Map()

// 返回值恒为 Promise<string>：'' 表示章节不存在。
//
// 缓存里两种值都会出现：进行中的 Promise（首次加载）、已解析的正文字符串
// （解析完成后回写，以及 prefetchChapters 预取完成后的结果）。
// 命中字符串时必须包一层 Promise 再返回——调用方统一写 p.then(...)，
// 直接把字符串交出去会报 "p.then is not a function"，且正文永远停在 null，
// 表现为「点了下一章一直载入中」。
export function getChapterRaw(slug) {
  const key = `../content/${slug}.md`
  const loader = modules[key]
  if (!loader) return Promise.resolve('')

  const cached = cache.get(key)
  if (cached !== undefined) return Promise.resolve(cached)

  const promise = loader().then((text) => {
    cache.set(key, text)
    return text
  })

  // 缓存 Promise 本身，避免并发重复请求（章节间快速切换时命中）
  cache.set(key, promise)
  return promise
}

// 预取相邻章节：读者读完当前章常直接点「下一章」，
// 提前把下一章 chunk 拉下来，翻页即可秒开。
export function prefetchChapters(slugs) {
  slugs.filter(Boolean).forEach((slug) => {
    const key = `../content/${slug}.md`
    if (cache.has(key) || !modules[key]) return
    cache.set(
      key,
      modules[key]().then((text) => {
        cache.set(key, text)
        return text
      }),
    )
  })
}

// 闲时后台全量预热（整本离线渐进调度）：
// 不阻塞首屏，延后 3.5s 启动，利用 requestIdleCallback 分批平滑预取剩余章节。
// 既避免了 110 个 chunk 并发抢占前台带宽，又在读者阅读几分钟内悄然完成全书离线缓存。
export function idleWarmupAllChapters(chapterSlugs = []) {
  if (typeof window === 'undefined' || !chapterSlugs.length) return

  const schedule = typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback
    : (cb) => setTimeout(cb, 1000)

  // 延后启动，把宝贵的首屏渲染与字体/首图资源窗口 100% 留给前台
  setTimeout(() => {
    let index = 0
    const BATCH_SIZE = 6

    function pump() {
      if (index >= chapterSlugs.length) return
      const batch = chapterSlugs.slice(index, index + BATCH_SIZE)
      prefetchChapters(batch)
      index += BATCH_SIZE

      if (index < chapterSlugs.length) {
        schedule(() => setTimeout(pump, 600))
      }
    }

    schedule(pump)
  }, 3500)
}