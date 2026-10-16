// 章节 md 按需加载。
//
// 早期用 eager: true 把全部章节内联进主 chunk，章节少时简单直接；
// 但现有 110 章、源 md 合计约 849 KB（约 23 万字），eager 会把整本书
// 塞进首屏 JS（gzip 后仍 300KB+），移动端首屏明显变慢。
//
// 现在改为 lazy：glob 只建立「路径 → 动态 import 函数」的映射，不含正文；
// 正文在章节真正被访问时才按需下载，Vite 会把每章拆成独立 chunk。
// 结果同步返回，便于直接用在 computed 里；重复访问命中内存缓存，不再发请求。

const modules = import.meta.glob('../content/*.md', {
  query: '?raw',
  import: 'default',
})

const cache = new Map()

export function getChapterRaw(slug) {
  const key = `../content/${slug}.md`
  const loader = modules[key]
  if (!loader) return ''

  const cached = cache.get(key)
  if (cached !== undefined) return cached

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