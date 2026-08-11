// 章节清单（顺序即阅读顺序）。slug 对应 src/content/<slug>.md
export const chapters = [
  { num: '第01章', slug: '第01章_废柴的最后一天', title: '废柴的最后一天' },
  { num: '第02章', slug: '第02章_混沌吞天诀', title: '混沌吞天诀' },
  { num: '第03章', slug: '第03章_封印解除', title: '封印解除' },
  { num: '第04章', slug: '第04章_锋芒初露', title: '锋芒初露' },
  { num: '第05章', slug: '第05章_暴风雨前', title: '暴风雨前' },
  { num: '第06章', slug: '第06章_大比之日', title: '大比之日' },
  { num: '第07章', slug: '第07章_你来晚了', title: '你来晚了' },
  { num: '第08章', slug: '第08章_巅峰对决', title: '巅峰对决' },
  { num: '第09章', slug: '第09章_怒发冲冠', title: '怒发冲冠' },
  { num: '第10章', slug: '第10章_一剑斩六魔', title: '一剑斩六魔' },
]

export function getNeighbor(slug) {
  const i = chapters.findIndex((c) => c.slug === slug)
  return {
    prev: i > 0 ? chapters[i - 1] : null,
    next: i >= 0 && i < chapters.length - 1 ? chapters[i + 1] : null,
  }
}
