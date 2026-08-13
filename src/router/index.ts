import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'game', component: () => import('@/views/Game.vue') },
  {
    path: '/versions',
    name: 'versions-manage',
    component: () => import('@/views/Instances.vue'),
  },
  { path: '/versions/manage', redirect: '/versions' },
  { path: '/versions/running', redirect: '/' },
  { path: '/download', name: 'download', component: () => import('@/views/Download.vue') },
  { path: '/plugins', name: 'plugins', component: () => import('@/views/Plugins.vue') },
  { path: '/online-mods', name: 'online-mods', component: () => import('@/views/OnlineMods.vue') },
  {
    path: '/settings',
    component: () => import('@/views/Settings.vue'),
    redirect: '/settings/general',
    children: [
      { path: 'general', name: 'settings-general', component: () => import('@/views/settings/GeneralTab.vue') },
      { path: 'download', name: 'settings-download', redirect: '/settings/game' },
      { path: 'game', name: 'settings-game', component: () => import('@/views/settings/GameTab.vue') },
      { path: 'about', name: 'settings-about', component: () => import('@/views/settings/AboutTab.vue') },
    ],
  },
  { path: '/dev', name: 'dev', component: () => import('@/views/DevTools.vue'), meta: { devOnly: true } },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({ history: createWebHashHistory(), routes })

// 路由切换前重置弹窗状态
router.beforeEach(() => {
  // 移除页面内容的滑出类
  const pageContent = document.querySelector('.page-container') as HTMLElement
  if (pageContent) {
    pageContent.classList.remove('modal-page-slide-out')
  }
  // 重置主内容区滚动
  const mainContent = document.querySelector('.main-content') as HTMLElement
  if (mainContent) {
    mainContent.style.overflow = ''
  }
})

export default router
