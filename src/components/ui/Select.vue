<template>
  <div
    class="ui-select"
    :class="{ open: isOpen }"
    ref="selectRef"
    v-click-outside="close"
  >
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

    <transition name="select-dropdown">
      <div v-show="isOpen" class="select-dropdown">
        <div v-if="searchable" class="select-search">
          <UiInput
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            size="sm"
          />
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
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import UiIcon from './Icon.vue'
import UiInput from './Input.vue'

export interface SelectOption {
  label?: string
  value: string
  desc?: string
  [key: string]: any
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: SelectOption[]
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  emptyText?: string
}>(), {
  placeholder: '请选择',
  searchable: false,
  searchPlaceholder: '搜索...',
  emptyText: '暂无选项'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')

const selectedOption = computed(() =>
  props.options.find(o => o.value === props.modelValue)
)

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.options
  }
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(o =>
    (o.label || o.value).toLowerCase().includes(query) ||
    (o.desc?.toLowerCase().includes(query) ?? false)
  )
})

function toggle() {
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

watch(() => props.modelValue, () => {
  searchQuery.value = ''
})

const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    const handler = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) {
        binding.value()
      }
    }
    document.addEventListener('click', handler)
    ;(el as any).__clickOutsideHandler = handler
  },
  unmounted(el: HTMLElement) {
    const handler = (el as any).__clickOutsideHandler
    if (handler) {
      document.removeEventListener('click', handler)
    }
  }
}
</script>

<style scoped>
.ui-select {
  position: relative;
  width: 200px;
  font-family: inherit;
  user-select: none;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.select-trigger:hover {
  border-color: var(--color-primary);
  background-color: var(--bg-surface-hover);
}

.ui-select.open .select-trigger {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.selected-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.placeholder {
  color: var(--text-disabled);
}

.select-arrow {
  font-size: 11px;
  color: var(--text-secondary);
  transition: transform 0.3s var(--ease-spring);
  margin-left: 6px;
  flex-shrink: 0;
}

.select-arrow.rotated {
  transform: rotate(90deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.select-search {
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.select-options {
  overflow-y: auto;
  max-height: 260px;
  padding: 4px;
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color 0.15s ease;
}

.select-option:hover {
  background-color: var(--bg-surface-hover);
}

.select-option.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: inherit;
}

.option-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.check-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-left: 8px;
}

.select-empty {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.select-dropdown-enter-active,
.select-dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.select-dropdown-enter-from,
.select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

[data-theme="dark"] .select-trigger {
  background-color: rgba(255, 255, 255, 0.05);
}

[data-theme="dark"] .select-dropdown {
  background-color: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(var(--blur-md));
}

[data-theme="dark"] .select-option:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] .select-option.active {
  background-color: rgba(var(--color-primary-rgb, 59, 130, 246), 0.2);
}
</style>
