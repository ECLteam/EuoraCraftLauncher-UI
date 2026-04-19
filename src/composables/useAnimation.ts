import { nextTick } from 'vue'
import gsap from 'gsap'

/**
 * 检查用户是否偏好减少动画
 */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useFadeIn(
  elementRef: any,
  options: { delay?: number; y?: number; duration?: number } = {}
) {
  const { delay = 0, y = 20, duration = 0.25 } = options

  const animate = () => {
    if (!elementRef.value) return
    
    if (prefersReducedMotion()) {
      // 用户偏好减少动画，直接设置终态
      gsap.set(elementRef.value, { opacity: 1, y: 0 })
      return
    }

    gsap.fromTo(elementRef.value,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: 'power2.out'
      }
    )
  }

  return { animate }
}

export function useStagger(
  containerRef: any,
  itemSelector: string = '> *',
  options: { delay?: number; stagger?: number; duration?: number } = {}
) {
  const { delay = 0.1, stagger = 0.05, duration = 0.25 } = options

  const animate = async () => {
    await nextTick()
    const container = containerRef.value?.$el || containerRef.value
    if (!container) return
    
    if (prefersReducedMotion()) {
      // 用户偏好减少动画，直接设置所有元素的终态
      const items = container.querySelectorAll(itemSelector)
      items.forEach((item: Element) => gsap.set(item, { opacity: 1, y: 0 }))
      return
    }

    const items = container.querySelectorAll(itemSelector)
    if (items.length === 0) return

    gsap.fromTo(items,
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        delay,
        ease: 'power2.out'
      }
    )
  }

  return { animate }
}

export function usePageTransition() {
  const beforeEnter = (el: Element) => {
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 })
    } else {
      gsap.set(el, { opacity: 0, y: 8 })
    }
  }

  const enter = (el: Element, done: () => void) => {
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 })
      done()
    } else {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: done
      })
    }
  }

  const leave = (el: Element, done: () => void) => {
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 0, y: 0 })
      done()
    } else {
      gsap.to(el, {
        opacity: 0,
        y: -8,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: done
      })
    }
  }

  return { beforeEnter, enter, leave }
}

export function useButtonFeedback() {
  const onClick = (event: MouseEvent) => {
    if (prefersReducedMotion()) {
      return // 用户偏好减少动画，不执行按钮反馈动画
    }
    
    const btn = event.currentTarget as HTMLElement
    gsap.to(btn, {
      scale: 0.96,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out'
    })
  }

  return { onClick }
}