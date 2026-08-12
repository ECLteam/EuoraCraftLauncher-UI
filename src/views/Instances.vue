<template>
  <div class="instances-page">
    <SectionLayout :title="t('sidebar.versions')" icon="cube" :items="navItems">
      <template #nav-bottom>
        <div id="plugin-slot-versions-nav-bottom" class="plugin-slot-container"></div>
      </template>
      <template #content-top>
        <div id="plugin-slot-versions-content-top" class="plugin-slot-container"></div>
      </template>
      <ManageTab />
    </SectionLayout>

    <DownloadModal v-model:visible="showDownloadModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionLayout from '@/components/layout/SectionLayout.vue'
import DownloadModal from '@/views/instances/DownloadModal.vue'
import ManageTab from '@/views/instances/ManageTab.vue'

const { t } = useI18n()

const showDownloadModal = ref(false)

const navItems = computed(() => [
  { path: '/versions/manage', icon: 'settings', label: t('versions.manageTab') },
  {
    key: 'download',
    icon: 'download',
    label: t('download.title'),
    action: () => {
      showDownloadModal.value = true
    },
  },
])
</script>

<style scoped>
.instances-page {
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
