// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/',        name: 'game',    component: () => import('@/views/Game.vue') },
  {
    path: '/versions',
    component: () => import('@/views/Versions.vue'),
    redirect: '/versions/manage',
    children: [
      { path: 'manage', name: 'versions-manage', component: () => import('@/components/versions/ManageTab.vue') },
      { path: 'versions', name: 'versions-versions', component: () => import('@/components/versions/VersionsTab.vue') },
      { path: 'mods', name: 'versions-mods', component: () => import('@/components/versions/ModsTab.vue') },
    ]
  },
  { path: '/instances', name: 'instances', component: () => import('@/views/Instances.vue') },
  {
    path: '/settings',
    component: () => import('@/views/Settings.vue'),
    redirect: '/settings/general',
    children: [
      { path: 'general', name: 'settings-general', component: () => import('@/components/settings/GeneralTab.vue') },
      { path: 'download', name: 'settings-download', component: () => import('@/components/settings/DownloadTab.vue') },
      { path: 'game', name: 'settings-game', component: () => import('@/components/settings/GameTab.vue') },
      { path: 'about', name: 'settings-about', component: () => import('@/components/settings/AboutTab.vue') },
    ]
  },
  { path: '/dev', name: 'dev', component: () => import('@/views/DevTools.vue'), meta: { devOnly: true } },
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