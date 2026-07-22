import { gsap } from 'gsap'
import { onScopeDispose, unref, type Ref } from 'vue'

/* ═══════════════════════════════════════════════════════════════════
   SnowLuma Animation Engine
   — 基于 GSAP 的非线性动画编排器
   — 所有进入用弹性/弹跳曲线，退出用标准减速
   — 支持交错(stagger)、链条、序列、滚动驱动
   ═══════════════════════════════════════════════════════════════════ */

// ---- 全局缓动预设 ----
export const EASE = {
  enter: 'power2.out',           // 进入：加速减速
  exit: 'power1.in',             // 退出：先快后慢
  spring: 'back.out(1.7)',       // 弹性过冲
  bounce: 'bounce.out',          // 弹跳
  gentle: 'power3.out',          // 平滑进入
  elastic: 'elastic.out(1, 0.4)', // 橡皮筋效果
  smooth: 'none',                // 线性
} as const

// ---- 持续时间预设 (秒) ----
export const DURATION = {
  instant: 0.06,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.5,
  slowest: 0.7,
} as const

// ---- 交错延迟预设 ----
export const STAGGER = {
  xs: 0.02,
  sm: 0.04,
  md: 0.06,
  lg: 0.08,
  xl: 0.12,
} as const

// ---- 工具函数：检查用户偏好 ----
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ═══════════════════════════════════════════════════════════════════
// 1. 按钮反馈
// ═══════════════════════════════════════════════════════════════════

export function useButtonFeedback() {
  const animatedElements = new Set<HTMLElement>()

  onScopeDispose(() => {
    for (const el of animatedElements) {
      gsap.killTweensOf(el)
    }
    animatedElements.clear()
  })

  const onClick = (event: MouseEvent) => {
    if (prefersReducedMotion()) return
    const btn = event.currentTarget as HTMLElement
    animatedElements.add(btn)

    const tl = gsap.timeline({
      onComplete: () => {
        animatedElements.delete(btn)
      },
    })

    tl.to(btn, {
      scale: 0.95,
      duration: DURATION.instant * 1.5,
      ease: EASE.exit,
    }).to(btn, {
      scale: 1,
      duration: DURATION.fast,
      ease: EASE.spring,
    })
  }

  return { onClick }
}

// ═══════════════════════════════════════════════════════════════════
// 3. 交错入场 (Stagger Entry) — 列表/网格子项
// ═══════════════════════════════════════════════════════════════════

export interface StaggerOptions {
  /** 每个项目的动画持续时间，默认 0.35s */
  duration?: number
  /** 交错间隔，默认 0.05s */
  stagger?: number
  /** 入场方向: up / down / left / right / scale / fade */
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
  /** 位移距离 (px)，默认 14px */
  distance?: number
  /** 整体延迟，默认 0 */
  delay?: number
  /** 缓动曲线，默认 spring */
  ease?: string
  /** 从哪个项目开始 (默认 0) */
  from?: 'start' | 'end' | 'center' | number
  /** 滚动进入视口时触发 (基于 ScrollTrigger) */
  scrollTrigger?: boolean
}

export function useStaggerEntry(
  items: (string | HTMLElement)[] | Ref<HTMLElement[] | null>,
  options: StaggerOptions = {},
) {
  if (prefersReducedMotion()) return

  const {
    duration = DURATION.slow,
    stagger = STAGGER.sm,
    direction = 'up',
    distance = 14,
    delay = 0,
    ease = EASE.spring,
    from = 'start',
  } = options

  const targets = unref(items) || []

  if (!targets || targets.length === 0) return

  const vars: gsap.TweenVars = {
    opacity: 0,
    duration,
    ease,
    stagger: { each: stagger, from },
    delay,
    clearProps: 'transform',
  }

  switch (direction) {
    case 'up':    vars.y = distance; break
    case 'down':  vars.y = -distance; break
    case 'left':  vars.x = distance; break
    case 'right': vars.x = -distance; break
    case 'scale': vars.scale = 0.9; break
    case 'fade':  break
  }

  gsap.from(targets, vars)
}

// ═══════════════════════════════════════════════════════════════════
// 4. 容器展开/折叠 (手风琴/子菜单)
// ═══════════════════════════════════════════════════════════════════

export function useExpandCollapse(
  container: HTMLElement | Ref<HTMLElement | null>,
  isExpanded: boolean | Ref<boolean>,
) {
  if (prefersReducedMotion()) return

  const el = unref(container)
  if (!el) return

  const expanded = unref(isExpanded)

  if (expanded) {
    // 展开
    gsap.set(el, { display: 'block' })
    gsap.from(el, {
      height: 0,
      opacity: 0,
      duration: DURATION.slow,
      ease: EASE.enter,
      clearProps: 'height',
    })
    gsap.from(el.children, {
      opacity: 0,
      y: -7,
      duration: DURATION.normal,
      stagger: STAGGER.xs,
      ease: EASE.enter,
      delay: DURATION.fast,
      clearProps: 'transform',
    })
  } else {
    // 折叠
    gsap.to(el, {
      height: 0,
      opacity: 0,
      duration: DURATION.fast,
      ease: EASE.exit,
      onComplete: () => {
        gsap.set(el, { clearProps: 'all' })
      },
    })
  }
}

// ═══════════════════════════════════════════════════════════════════
// 5. 排序队列动画 (拖拽列表 & 排序)
// ═══════════════════════════════════════════════════════════════════

export function useSortAnimation(
  container: HTMLElement | Ref<HTMLElement | null>,
) {
  if (prefersReducedMotion()) return null

  const el = unref(container)
  if (!el) return null

  // Flip 动画 — 监听子项位置变化并平滑过渡
  const flipState = new Map<string, DOMRect>()

  const record = () => {
    flipState.clear()
    const items = el.querySelectorAll(':scope > *')
    items.forEach((item) => {
      const id = item.getAttribute('data-key') || item.id || Math.random().toString()
      flipState.set(id, item.getBoundingClientRect())
    })
  }

  const animate = () => {
    const items = el.querySelectorAll(':scope > *')
    items.forEach((item) => {
      const id = item.getAttribute('data-key') || item.id || ''
      const oldRect = flipState.get(id)
      if (!oldRect) return
      const newRect = item.getBoundingClientRect()
      const dx = oldRect.left - newRect.left
      const dy = oldRect.top - newRect.top
      if (dx !== 0 || dy !== 0) {
        gsap.from(item, {
          x: dx,
          y: dy,
          duration: DURATION.slow,
          ease: EASE.enter,
          clearProps: 'transform',
        })
      }
    })
    flipState.clear()
  }

  return { record, animate }
}

// ═══════════════════════════════════════════════════════════════════
// 6. 数字跳动动画 (用于统计展示)
// ═══════════════════════════════════════════════════════════════════

export function useCountUp(
  target: HTMLElement | Ref<HTMLElement | null>,
  startValue: number,
  endValue: number,
  options?: { duration?: number; ease?: string; prefix?: string; suffix?: string },
) {
  if (prefersReducedMotion()) return

  const el = unref(target)
  if (!el) return

  const { duration = DURATION.slower, ease = EASE.enter } = options || {}

  const obj = { value: startValue }

  gsap.to(obj, {
    value: endValue,
    duration,
    ease,
    onUpdate: () => {
      el.textContent = `${options?.prefix || ''}${Math.round(obj.value)}${options?.suffix || ''}`
    },
  })
}

// ═══════════════════════════════════════════════════════════════════
// 9. 入场序列编排 (多元素链式入场)
// ═══════════════════════════════════════════════════════════════════

export interface SequenceStep {
  target: string | HTMLElement
  /** 动画类型: from / to / fromTo */
  type?: 'from' | 'to' | 'fromTo'
  /** x, y, opacity, scale 等 GSAP 属性 */
  vars: gsap.TweenVars
  /** 与前一步的偏移量 (秒)，默认 0 */
  offset?: number
}

export function useSequence(
  steps: SequenceStep[],
  options?: { delay?: number; onComplete?: () => void },
) {
  if (prefersReducedMotion()) return

  const tl = gsap.timeline({
    delay: options?.delay || 0,
    onComplete: options?.onComplete,
    ease: EASE.enter,
  })

  for (const step of steps) {
    const { target, type = 'from', vars, offset = -0.1 } = step

    switch (type) {
      case 'from':
        tl.from(target, { ...vars, duration: vars.duration || DURATION.slow }, offset)
        break
      case 'to':
        tl.to(target, { ...vars, duration: vars.duration || DURATION.slow }, offset)
        break
      case 'fromTo':
        tl.fromTo(target, vars.fromVars || {}, vars.toVars || {}, offset)
        break
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 10. 工具 — 清理 GSAP 动画
// ═══════════════════════════════════════════════════════════════════

export function killTweens(targets: (string | HTMLElement) | (string | HTMLElement)[]) {
  gsap.killTweensOf(targets)
}
