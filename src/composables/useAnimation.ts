import gsap from 'gsap'
import { onScopeDispose } from 'vue'

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useButtonFeedback() {
  const animatedElements = new Set<HTMLElement>()

  onScopeDispose(() => {
    for (const el of animatedElements) {
      gsap.killTweensOf(el)
    }
    animatedElements.clear()
  })

  const onClick = (event: MouseEvent) => {
    if (prefersReducedMotion()) {
      return
    }
    
    const btn = event.currentTarget as HTMLElement
    animatedElements.add(btn)
    gsap.to(btn, {
      scale: 0.96,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      onComplete: () => { animatedElements.delete(btn) }
    })
  }

  return { onClick }
}