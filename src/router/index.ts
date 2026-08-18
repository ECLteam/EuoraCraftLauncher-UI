import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { pinia } from '@/app/stores'
import { useLayoutStore } from '@/app/stores/layoutStore'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'game', component: () => import('@/views/Game.vue') },
  {
    path: '/versions',
    name: 'versions-manage',
    component: () => import('@/views/Instances.vue'),
  },
  { path: '/connect', name: 'connect', component: () => import('@/views/Connect.vue') },
  { path: '/download', name: 'download', component: () => import('@/views/Download.vue') },
  { path: '/plugins', name: 'plugins', component: () => import('@/views/Plugins.vue') },
  { path: '/online-mods', name: 'online-mods', component: () => import('@/views/OnlineMods.vue') },
  {
    path: '/settings',
    component: () => import('@/views/Settings.vue'),
    redirect: '/settings/general',
    children: [
      { path: 'general', name: 'settings-general', component: () => import('@/views/settings/GeneralTab.vue') },
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

// 路由切换前重置弹窗遗留的页面过渡状态（通过 layoutStore 状态驱动，不直接操作 DOM）
router.beforeEach(() => {
  useLayoutStore(pinia).resetTransientState()
})

export default router