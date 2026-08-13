<template>
  <div class="section-layout">
    <aside class="section-layout__nav ecl-surface">
      <div class="section-layout__title">
        <UiIcon :name="icon" :size="18" />
        <span>{{ title }}</span>
      </div>
      <NMenu class="section-layout__menu" :value="route.path" :options="menuOptions" @update:value="handleSelect" />
      <div v-if="$slots['nav-bottom']" class="section-layout__nav-bottom">
        <slot name="nav-bottom" />
      </div>
    </aside>

    <main class="section-layout__content">
      <slot name="content-top" />
      <div class="section-layout__viewport">
        <slot />
      </div>
      <slot name="content-bottom" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { NMenu, type MenuOption } from 'naive-ui'
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'

export interface SectionNavigationItem {
  key?: string
  path?: string
  label: string
  icon: string
  action?: () => void
}

const props = defineProps<{
  title: string
  icon: string
  items: SectionNavigationItem[]
}>()

const route = useRoute()
const router = useRouter()

const menuOptions = computed<MenuOption[]>(() =>
  props.items.map((item) => ({
    key: item.path ?? item.key ?? item.label,
    label: item.label,
    icon: () => h(UiIcon, { name: item.icon, size: 18 }),
  }))
)

function handleSelect(key: string) {
  const item = props.items.find((i) => (i.path ?? i.key ?? i.label) === key)
  if (!item) return
  if (item.action) {
    item.action()
    return
  }
  if (item.path && item.path !== route.path) void router.push(item.path)
}
</script>

<style scoped src="@/styles/components/layout/SectionLayout.css"></style>
