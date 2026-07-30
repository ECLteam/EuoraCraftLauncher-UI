<template>
  <div class="section-layout">
    <aside class="section-layout__nav ecl-surface">
      <div class="section-layout__title">
        <UiIcon :name="icon" :size="18" />
        <span>{{ title }}</span>
      </div>
      <NMenu
        class="section-layout__menu"
        :value="route.path"
        :options="menuOptions"
        @update:value="handleNavigate"
      />
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
  path: string
  label: string
  icon: string
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
    key: item.path,
    label: item.label,
    icon: () => h(UiIcon, { name: item.icon, size: 18 }),
  }))
)

function handleNavigate(path: string) {
  if (path !== route.path) void router.push(path)
}
</script>

<style scoped src="@/styles/components/layout/SectionLayout.css"></style>
