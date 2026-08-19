import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 页面布局过渡状态（Pinia）。
 *
 * 弹窗打开时锁定主内容区滚动、给页面容器加滑出过渡类；路由切换时由路由守卫
 * 调用 resetTransientState() 清理。所有 DOM 副作用集中在本 store，组件与守卫
 * 只操作状态，不再直接 querySelector。
 */
export const useLayoutStore = defineStore('layout', () => {
  const modalPageSlideOut = ref(false)
  const mainContentScrollLocked = ref(false)

  /** 切换页面容器的滑出过渡类（全屏弹窗打开时启用）。 */
  function setModalPageSlideOut(value: boolean) {
    modalPageSlideOut.value = value
    const pageContent = document.querySelector('.page-container') as HTMLElement | null
    if (!pageContent) return
    pageContent.classList.toggle('modal-page-slide-out', value)
  }

  /** 锁定 / 解锁主内容区滚动（弹窗打开时隐藏滚动条）。 */
  function setMainContentScrollLocked(value: boolean) {
    mainContentScrollLocked.value = value
    const mainContent = document.querySelector('.main-content') as HTMLElement | null
    if (mainContent) {
      mainContent.style.overflow = value ? 'hidden' : ''
    }
  }

  /** 路由切换时清理弹窗遗留的页面过渡状态。 */
  function resetTransientState() {
    setModalPageSlideOut(false)
    setMainContentScrollLocked(false)
  }

  return {
    modalPageSlideOut,
    mainContentScrollLocked,
    setModalPageSlideOut,
    setMainContentScrollLocked,
    resetTransientState,
  }
})
