import { onClickOutside } from '@vueuse/core'
import type { Ref } from 'vue'

export function useClickOutside(target: Ref<HTMLElement | null>, callback: () => void) {
  onClickOutside(target, () => callback())
}
