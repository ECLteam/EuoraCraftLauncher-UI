<template>
  <nav class="ui-tabs" role="tablist" @mouseleave="handleMouseLeave" @keydown="handleKeydown">
    <div class="active-background" ref="activeBgRef"></div>
    <div class="tabs-indicator" ref="indicatorRef"></div>
    <button
      v-for="(tab, index) in items"
      :key="tab.id"
      :ref="el => { if (el) tabRefs[index] = el as HTMLElement }"
      class="tab-item"
      :class="{ active: modelValue === tab.id }"
      :id="`tab-${tab.id}`"
      :aria-selected="modelValue === tab.id"
      :aria-controls="`panel-${tab.id}`"
      role="tab"
      type="button"
      @click="handleClick(tab.id)"
      @mouseenter="handleMouseEnter(index)"
    >
      <i v-if="tab.icon" :class="['icon', tab.icon]" />
      {{ tab.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'

interface TabItem {
  id: string
  label: string
  icon?: string
}

const props = defineProps<{
  modelValue: string
  items: TabItem[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const indicatorRef = ref<HTMLElement | null>(null)
const activeBgRef = ref<HTMLElement | null>(null)
const tabRefs = ref<HTMLElement[]>([])

const updateIndicator = (index: number) => {
  if (!indicatorRef.value || !tabRefs.value[index]) return
  
  const tab = tabRefs.value[index]
  // 指示器宽度为 tab 宽度的 90%，居中显示
  const indicatorWidth = tab.offsetWidth * 0.9
  const indicatorLeft = tab.offsetLeft + (tab.offsetWidth - indicatorWidth) / 2
  indicatorRef.value.style.left = `${indicatorLeft}px`
  indicatorRef.value.style.width = `${indicatorWidth}px`
  indicatorRef.value.style.opacity = '1'
}

const updateActiveBackground = (index: number) => {
  if (!activeBgRef.value || !tabRefs.value[index]) return
  
  const tab = tabRefs.value[index]
  activeBgRef.value.style.left = `${tab.offsetLeft}px`
  activeBgRef.value.style.width = `${tab.offsetWidth}px`
  activeBgRef.value.style.height = `${tab.offsetHeight}px`
  activeBgRef.value.style.top = `${tab.offsetTop}px`
  activeBgRef.value.style.opacity = '1'
}

const handleMouseEnter = (index: number) => {
  updateIndicator(index)
}

const handleMouseLeave = () => {
  const index = props.items.findIndex(t => t.id === props.modelValue)
  if (index !== -1) {
    updateIndicator(index)
  }
}

const handleClick = (id: string) => {
  emit('update:modelValue', id)
}

const handleKeydown = (event: KeyboardEvent) => {
  const currentIndex = props.items.findIndex(t => t.id === props.modelValue)
  let newIndex = currentIndex
  
  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      newIndex = currentIndex > 0 ? currentIndex - 1 : props.items.length - 1
      break
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      newIndex = currentIndex < props.items.length - 1 ? currentIndex + 1 : 0
      break
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
    case 'End':
      event.preventDefault()
      newIndex = props.items.length - 1
      break
    default:
      return
  }
  
  if (newIndex !== currentIndex) {
    emit('update:modelValue', props.items[newIndex].id)
    tabRefs.value[newIndex]?.focus()
  }
}

watch(() => props.modelValue, () => {
  const index = props.items.findIndex(t => t.id === props.modelValue)
  if (index !== -1) {
    nextTick(() => {
      updateIndicator(index)
      updateActiveBackground(index)
    })
  }
})

onMounted(() => {
  const index = props.items.findIndex(t => t.id === props.modelValue)
  if (index !== -1) {
    // 稍微延迟以确保 DOM 渲染完成
    setTimeout(() => {
      updateIndicator(index)
      updateActiveBackground(index)
    }, 100)
  }
})
</script>

<style scoped src="@/styles/Tabs.css"></style>