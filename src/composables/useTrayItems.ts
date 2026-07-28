import { computed, ref } from 'vue'

export interface TrayItem {
  id: string
  icon: string
  label: string
  action: () => void
  alwaysVisible?: boolean
  priority?: number
}

const _items = ref<TrayItem[]>([])

export function registerTrayItem(item: TrayItem) {
  const existing = _items.value.findIndex((i) => i.id === item.id)
  if (existing !== -1) {
    _items.value[existing] = item
  } else {
    _items.value.push(item)
  }
}

export function unregisterTrayItem(id: string) {
  const idx = _items.value.findIndex((i) => i.id === id)
  if (idx !== -1) _items.value.splice(idx, 1)
}

export function useTrayItems() {
  const sortedItems = computed(() =>
    [..._items.value].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
  )

  const visibleItems = computed(() => sortedItems.value.filter((i) => !i.alwaysVisible))
  const pinnedItems = computed(() => sortedItems.value.filter((i) => i.alwaysVisible))

  return {
    items: _items,
    sortedItems,
    visibleItems,
    pinnedItems,
    register: registerTrayItem,
    unregister: unregisterTrayItem,
  }
}
