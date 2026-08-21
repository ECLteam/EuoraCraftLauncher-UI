<template>
  <div v-if="topNavEnabled && visibleItems.length > 0" class="titlebar-tray">
    <PluginSlotHost slotId="plugin-slot-titlebar-tray" class="plugin-slot-container" />

    <div ref="trayWrapperRef" class="titlebar-tray-wrapper">
      <button class="titlebar-btn titlebar-tray-btn" :title="t('common.more')" @click.stop="onToggle">
        <UiIcon name="chevron-up" :size="16" />
      </button>

      <div v-if="showMenu" class="titlebar-tray-menu" @click.stop>
        <button v-for="item in visibleItems" :key="item.id" class="tray-menu-item" @click="onItemClick(item)">
          <UiIcon :name="item.icon" :size="16" />
          <span class="tray-menu-label">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'
import { useTopNav } from '@/composables/useTopNav'
import { registerTrayItem, unregisterTrayItem, useTrayItems, type TrayItem } from '@/composables/useTrayItems'
import { URLS } from '@/config/urls'
import PluginSlotHost from '@/features/plugins/slots/PluginSlotHost.vue'
import { openExternalUrl } from '@/utils/openExternal'

defineOptions({ name: 'TitleBarTray' })

const { t } = useI18n()
const { topNavEnabled } = useTopNav()
const { visibleItems } = useTrayItems()
const router = useRouter()

const showMenu = ref(false)
const trayWrapperRef = ref<HTMLElement | null>(null)

// Register items immediately (avoid chicken-and-egg)
{
  const items: TrayItem[] = []
  items.push({ id: 'debug', icon: 'bug', label: t('sidebar.debug'), action: () => router.push('/dev'), priority: 0 })
  items.push({
    id: 'docs',
    icon: 'file-text',
    label: t('sidebar.help'),
    action: () => openExternalUrl(URLS.docs),
    priority: 1,
  })
  for (const item of items) registerTrayItem(item)
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  unregisterTrayItem('debug')
  unregisterTrayItem('docs')
  document.removeEventListener('click', onDocClick)
})

function onToggle() {
  showMenu.value = !showMenu.value
}

function onItemClick(item: { action: () => void }) {
  item.action()
  showMenu.value = false
}

function onDocClick(e: MouseEvent) {
  if (!showMenu.value) return
  const el = trayWrapperRef.value
  if (el && !el.contains(e.target as Node)) {
    showMenu.value = false
  }
}
</script>

<style scoped>
.titlebar-tray {
  display: flex;
  align-items: center;
}

.titlebar-tray-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
  position: relative;
}

.titlebar-tray-btn:hover {
  background: var(--glass-item-hover);
  color: var(--text-primary);
}

.titlebar-tray-btn:active {
  transform: scale(0.94);
  transition-duration: var(--duration-instant);
}

.titlebar-tray-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  background: var(--card-bg);
  border: 1px solid var(--control-border);
  border-radius: var(--r-sm);
  box-shadow: var(--shadow-lg), inset 0 1px 0 var(--glass-highlight);
  backdrop-filter: var(--glass-backdrop);
  -webkit-backdrop-filter: var(--glass-backdrop);
  z-index: 10000;
  min-width: 140px;
}

.tray-menu-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 11px;
  border: none;
  border-radius: var(--r-xs);
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--duration-fast) ease-out;
}

.tray-menu-item:hover {
  background: var(--control-bg-hover);
}

.tray-menu-item:active {
  background: var(--control-bg-active);
}

.tray-menu-label {
  flex: 1;
}
</style>
