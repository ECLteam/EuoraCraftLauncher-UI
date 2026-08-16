<template>
  <div ref="selectRef" v-bind="$attrs" v-click-outside class="ui-select" :class="{ open: isOpen, 'is-disabled': disabled }">
    <div class="select-trigger" @click="toggle">
      <span class="selected-text">
        <slot name="trigger" :selected="selectedOption">
          <template v-if="selectedOption">
            {{ selectedOption.label || selectedOption.value }}
          </template>
          <span v-else class="placeholder">{{ placeholder }}</span>
        </slot>
      </span>
      <UiIcon name="arrow-right" class="select-arrow" :class="{ rotated: isOpen }" />
    </div>
  </div>

  <Teleport to="body">
    <Transition name="select-dropdown">
      <div v-show="isOpen" ref="dropdownRef" class="select-dropdown" :style="dropdownStyle">
        <div v-if="searchable" class="select-search">
          <UiInput v-model="searchQuery" :placeholder="searchPlaceholder" size="sm" />
        </div>
        <div class="select-options">
          <div
            v-for="option in filteredOptions"
            :key="option.value"
            class="select-option"
            :class="{ active: modelValue === option.value }"
            @click="select(option.value)"
          >
            <div class="option-content">
              <slot name="option" :option="option" :active="modelValue === option.value">
                <span class="option-label">{{ option.label || option.value }}</span>
                <span v-if="option.desc" class="option-desc">{{ option.desc }}</span>
              </slot>
            </div>
            <UiIcon v-if="modelValue === option.value" name="check" class="check-icon" />
          </div>
          <div v-if="filteredOptions.length === 0" class="select-empty">
            {{ emptyText }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, type CSSProperties } from 'vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'

defineOptions({ name: 'UiSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    placeholder?: string
    searchable?: boolean
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
  }>(),
  {
    placeholder: '请选择',
    searchable: false,
    searchPlaceholder: '搜索...',
    emptyText: '暂无选项',
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

export interface SelectOption {
  label?: string
  value: string
  desc?: string
  [key: string]: unknown
}

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<CSSProperties>({})
const searchQuery = ref('')

const selectedOption = computed(() => props.options.find((o) => o.value === props.modelValue))

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.options
  }
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(
    (o) => (o.label || o.value).toLowerCase().includes(query) || (o.desc?.toLowerCase().includes(query) ?? false)
  )
})

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function select(value: string) {
  emit('update:modelValue', value)
  emit('change', value)
  isOpen.value = false
  searchQuery.value = ''
}

// 下拉菜单通过 Teleport 挂到 body，用 fixed 定位避免被 UiCard 的 overflow:hidden 裁剪。
// 始终在触发框正下方展开，高度受限时收缩以适配视口。
function positionDropdown() {
  if (!isOpen.value || !selectRef.value) return
  const rect = selectRef.value.getBoundingClientRect()
  const gap = 6
  const spaceBelow = window.innerHeight - rect.bottom - gap
  const maxH = Math.max(120, Math.min(288, spaceBelow))
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + gap}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxH}px`,
    zIndex: 9000,
  }
}

watch(isOpen, (open) => {
  if (open) {
    requestAnimationFrame(positionDropdown)
    window.addEventListener('scroll', positionDropdown, true)
    window.addEventListener('resize', positionDropdown)
  } else {
    window.removeEventListener('scroll', positionDropdown, true)
    window.removeEventListener('resize', positionDropdown)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', positionDropdown, true)
  window.removeEventListener('resize', positionDropdown)
})

watch(
  () => props.modelValue,
  () => {
    searchQuery.value = ''
  }
)

interface ClickOutsideElement extends HTMLElement {
  __clickOutsideHandler?: (e: MouseEvent) => void
}

const vClickOutside = {
  mounted(el: ClickOutsideElement) {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const inSelect = el.contains(target)
      const inDropdown = dropdownRef.value ? dropdownRef.value.contains(target) : false
      if (!inSelect && !inDropdown) close()
    }
    document.addEventListener('click', handler)
    el.__clickOutsideHandler = handler
  },
  unmounted(el: ClickOutsideElement) {
    const handler = el.__clickOutsideHandler
    if (handler) {
      document.removeEventListener('click', handler)
    }
  },
}
</script>

<style scoped src="@/styles/components/ui/Select.css"></style>