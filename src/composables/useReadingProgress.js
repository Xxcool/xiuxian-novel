import { ref, computed, watch } from 'vue'

// 阅读进度：记住「读到哪一章、读到百分之几、哪些章已读」。
// 全部落在 localStorage，模块级单例，任何组件共享同一份状态。
//
// 存储结构：
//   xx-read-progress = { slug, percent, updatedAt, title? }
//   xx-read-set      = [slug, ...]   已读章节（进入即算读过）

const PROGRESS_KEY = 'xx-read-progress'
const READ_SET_KEY = 'xx-read-set'

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 隐私模式等写入失败时静默降级，不影响阅读 */
  }
}

// 已读集合用 Set 语义但因需持久化/响应式，内部存数组
const readList = ref(safeGet(READ_SET_KEY, []))
const readSet = computed(() => new Set(readList.value))

const lastRead = ref(safeGet(PROGRESS_KEY, null))

export function useReadingProgress() {
  // 记录一次阅读位置。percent 为本章内百分比（0-100）
  function record(slug, percent, title) {
    if (!slug) return
    const pct = Math.max(0, Math.min(100, Math.round(percent || 0)))
    const prev = lastRead.value
    // 同一章且进度变化不足 1% 时不写盘，避免 relocated 高频抖动
    if (prev && prev.slug === slug && Math.abs((prev.percent || 0) - pct) < 1) {
      return
    }
    const next = { slug, percent: pct, updatedAt: Date.now(), title: title || prev?.title }
    lastRead.value = next
    safeSet(PROGRESS_KEY, next)
  }

  // 标记某章已读（进入章节页时调用）
  function markRead(slug) {
    if (!slug || readSet.value.has(slug)) return
    readList.value = [...readList.value, slug]
  }

  function isRead(slug) {
    return readSet.value.has(slug)
  }

  function clearAll() {
    lastRead.value = null
    readList.value = []
    try {
      localStorage.removeItem(PROGRESS_KEY)
      localStorage.removeItem(READ_SET_KEY)
    } catch {
      /* noop */
    }
  }

  return {
    lastRead,
    readList,
    readCount: computed(() => readList.value.length),
    record,
    markRead,
    isRead,
    clearAll,
  }
}

// 状态变化即持久化（readList 变化来自 markRead / clearAll）
watch(readList, (v) => safeSet(READ_SET_KEY, v))
