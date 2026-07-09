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
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'

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

<style scoped src="@/styles/Select.css"></style>
