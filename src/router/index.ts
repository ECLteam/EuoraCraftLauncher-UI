// src/router/index.ts
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/',        name: 'game',    component: () => import('@/views/Game.vue') },
  {
    path: '/versions',
    component: () => import('@/views/Versions.vue'),
    redirect: '/versions/manage',
    children: [
      { path: 'manage', name: 'versions-manage', component: () => import('@/views/versions/ManageTab.vue') },
      { path: 'versions', name: 'versions-versions', component: () => import('@/views/versions/VersionsTab.vue') },
    ]
  },
  { path: '/plugins', name: 'plugins', component: () => import('@/views/Plugins.vue') },
  { path: '/online-mods', name: 'online-mods', component: () => import('@/views/OnlineMods.vue') },
  {
    path: '/settings',
    component: () => import('@/views/Settings.vue'),
    redirect: '/settings/general',
    children: [
      { path: 'general', name: 'settings-general', component: () => import('@/views/settings/GeneralTab.vue') },
      { path: 'download', name: 'settings-download', component: () => import('@/views/settings/DownloadTab.vue') },
      { path: 'game', name: 'settings-game', component: () => import('@/views/settings/GameTab.vue') },
      { path: 'about', name: 'settings-about', component: () => import('@/views/settings/AboutTab.vue') },
    ]
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