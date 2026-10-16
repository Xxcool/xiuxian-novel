import { ref } from 'vue'

// 沉浸阅读模式：点击正文中央区域隐藏顶栏与导航，再点一次恢复。
// 用模块级单例做跨组件共享——AppNav 挂在 App.vue 上，Chapter 在 router-view 内，
// 二者无父子关系，无法直接 props 传递。

const immersive = ref(false)

export function useImmersive() {
  return {
    immersive,
    enter: () => {
      immersive.value = true
    },
    exit: () => {
      immersive.value = false
    },
    toggle: () => {
      immersive.value = !immersive.value
    },
  }
}
