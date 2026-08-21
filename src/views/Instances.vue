<template>
  <div class="instances-page">
    <PluginSlotHost slotId="plugin-slot-versions-content-top" class="plugin-slot-container" />
    <ManageTab />
  </div>
</template>

<script setup lang="ts">
import PluginSlotHost from '@/features/plugins/slots/PluginSlotHost.vue'
import ManageTab from '@/views/instances/ManageTab.vue'
</script>

<style scoped>
.instances-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.instances-page > :deep(.manage-page) {
  flex: 1;
  min-height: 0;
}
</style>
