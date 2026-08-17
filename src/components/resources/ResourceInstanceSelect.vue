<template>
  <NSelect
    v-model:value="currentKey"
    :options="options"
    :placeholder="t('mods.selectInstance')"
    filterable
    :disabled="!target.ready.value || options.length === 0"
    class="resource-instance-select"
  >
    <template #render-label="{ option }">
      <span class="ris-option">
        <UiIcon name="game-controller" :size="14" />
        <span>{{ option.label }}</span>
      </span>
    </template>
  </NSelect>
</template>

<script setup lang="ts">
import { NSelect } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { instanceKey, type useResourceInstallTarget } from '@/composables/useResourceInstallTarget'

const props = defineProps<{
  target: ReturnType<typeof useResourceInstallTarget>
}>()

const emit = defineEmits<{
  (e: 'persist'): void
}>()

const { t } = useI18n()

const options = computed(() =>
  props.target.installableInstances.value.map((version) => ({
    label: `${version.displayName} · ${version.vanillaName} · ${version.primaryLoader}`,
    value: instanceKey(version),
  }))
)

const currentKey = computed({
  get: () => props.target.selectedKey.value,
  set: (key: string) => {
    const version = props.target.installableInstances.value.find((v) => instanceKey(v) === key)
    if (version) props.target.setTarget(version)
    emit('persist')
  },
})
</script>

<style scoped>
.resource-instance-select {
  width: 320px;
}

.ris-option {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ris-option :deep(svg) {
  flex-shrink: 0;
  color: var(--primary);
}
</style>