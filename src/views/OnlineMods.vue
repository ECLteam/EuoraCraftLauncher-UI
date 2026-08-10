<template>
  <div class="ecl-page online-mods-page">
    <PageHeader :title="t('mods.onlineSearch')" icon="search" />

    <div class="instance-select-card">
      <NSelect
        v-model:value="selectedInstanceKey"
        :options="instanceOptions"
        :placeholder="t('mods.selectInstance')"
        filterable
        class="instance-select-wide"
      />
    </div>

    <OnlineModSearch :instance="selectedInstance" />
  </div>
</template>

<script setup lang="ts">
import { NSelect } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/layout/PageHeader.vue'
import OnlineModSearch from '@/components/mods/OnlineModSearch.vue'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useInstanceStore } from '@/features/instances/stores/instanceStore'
import type { ScannedVersion } from '@/types/api'
import { getErrorMessage } from '@/utils/error'

const { t } = useI18n()
const message = useGlassMessage()
const instanceStore = useInstanceStore()
const selectedInstanceKey = ref('')

const installableInstances = computed(() =>
  instanceStore.scannedVersions.filter((version) => !version.isBroken)
)

function instanceKey(version: ScannedVersion): string {
  return `${version.path}\u0000${version.versionId}`
}

const instanceOptions = computed(() =>
  installableInstances.value.map((version) => ({
    label: `${version.displayName} · ${version.vanillaName} · ${version.primaryLoader}`,
    value: instanceKey(version),
  }))
)

const selectedInstance = computed(
  () => installableInstances.value.find((version) => instanceKey(version) === selectedInstanceKey.value) ?? null
)

onMounted(async () => {
  try {
    await instanceStore.loadAll()
    const preferred =
      installableInstances.value.find(
        (version) =>
          version.versionId === instanceStore.selectedVersion && version.path === instanceStore.currentGamePath
      ) ?? installableInstances.value[0]
    if (preferred) selectedInstanceKey.value = instanceKey(preferred)
  } catch (error) {
    message.error(getErrorMessage(error))
  }
})
</script>

<style scoped>
.instance-select-card {
  flex-shrink: 0;
  padding: 12px 14px;
  border: 1px solid var(--ecl-border);
  border-radius: var(--ecl-radius-card);
  background: var(--ecl-surface);
  box-shadow: var(--ecl-shadow-surface);
}

.instance-select-wide {
  width: 100%;
}
</style>