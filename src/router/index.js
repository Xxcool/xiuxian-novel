import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Chapter from '../views/Chapter.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/chapter/:slug', name: 'chapter', component: Chapter, props: true },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
