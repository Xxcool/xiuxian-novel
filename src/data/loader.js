// 用 Vite 的 import.meta.glob 在构建期把全部章节 md 作为原始文本内联
const modules = import.meta.glob('../content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export function getChapterRaw(slug) {
  return modules[`../content/${slug}.md`] || ''
}
