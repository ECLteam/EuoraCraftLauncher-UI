<template>
  <SectionLayout :title="t('settings.title')" icon="settings" :items="navItems">
    <template #nav-bottom>
      <div id="plugin-slot-settings-nav-bottom" class="plugin-slot-container"></div>
    </template>
    <template #content-top>
      <div id="plugin-slot-settings-content-top" class="plugin-slot-container"></div>
    </template>
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
    <template #content-bottom>
      <div id="plugin-slot-settings-content-bottom" class="plugin-slot-container"></div>
    </template>
  </SectionLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionLayout from '@/components/layout/SectionLayout.vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

const { t } = useI18n()
const settingsStore = useSettingsStore()

const navItems = computed(() => [
  { path: '/settings/general', icon: 'brush', label: t('settings.general') },
  { path: '/settings/game', icon: 'game', label: t('settings.gameSettings') },
  { path: '/settings/about', icon: 'info', label: t('settings.about') },
])

onMounted(() => {
  void settingsStore.load().catch(() => {})
})
</script>
