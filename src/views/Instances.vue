<template>
  <SectionLayout :title="t('sidebar.versions')" icon="cube" :items="navItems">
    <template #nav-bottom>
      <div id="plugin-slot-versions-nav-bottom" class="plugin-slot-container"></div>
    </template>
    <template #content-top>
      <div id="plugin-slot-versions-content-top" class="plugin-slot-container"></div>
    </template>
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </SectionLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionLayout from '@/components/layout/SectionLayout.vue'

const { t } = useI18n()

const navItems = computed(() => [
  { path: '/versions/manage', icon: 'settings', label: t('versions.manageTab') },
  { path: '/versions/versions', icon: 'cube', label: t('versions.versions') },
])
</script>
