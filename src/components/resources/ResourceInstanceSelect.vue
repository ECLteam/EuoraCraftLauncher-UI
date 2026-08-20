<template>
  <NSelect
    v-model:value="currentKey"
    :options="options"
    :renderLabel="renderLabel"
    :placeholder="placeholder || t('mods.selectInstance')"
    filterable
    :disabled="!target.ready.value || options.length === 0"
    class="resource-instance-select"
  />
</template>

<script setup lang="ts">
import { NSelect } from 'naive-ui'
import { computed, h, type VNode } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { instanceKey, type useResourceInstallTarget } from '@/composables/useResourceInstallTarget'

const props = withDefaults(
  defineProps<{
    target: ReturnType<typeof useResourceInstallTarget>
    placeholder?: string
    showNoneOption?: boolean
    noneLabel?: string
    compatibleOnly?: boolean
  }>(),
  { placeholder: '', showNoneOption: false, noneLabel: '', compatibleOnly: false }
)

const emit = defineEmits<{
  (e: 'persist'): void
}>()

const { t } = useI18n()

const options = computed(() => {
  const list = (
    props.compatibleOnly ? props.target.compatibleInstances.value : props.target.installableInstances.value
  ).map((version) => ({
    label: `${version.displayName} · ${version.vanillaName} · ${version.primaryLoader}`,
    value: instanceKey(version),
  }))
  if (props.showNoneOption) {
    return [{ label: props.noneLabel || t('mods.noneInstance'), value: '' }, ...list]
  }
  return list
})

const currentKey = computed({
  get: () => props.target.selectedKey.value,
  set: (key: string) => {
    if (!key) {
      props.target.clearTarget()
    } else {
      const version = props.target.installableInstances.value.find((v) => instanceKey(v) === key)
      if (version) props.target.setTarget(version)
    }
    emit('persist')
  },
})

function renderLabel(option: { label: string; value: string }): VNode {
  return h('span', { class: 'ris-option' }, [
    h(UiIcon, { name: 'game-controller', size: 14 }),
    h('span', { class: 'ris-option-label' }, option.label),
  ])
}
</script>

<style scoped>
.resource-instance-select {
  width: 320px;
}

/* renderLabel 输出的元素不带 scoped 属性，需用 :global 使样式生效 */
:global(.ris-option) {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

:global(.ris-option .icon) {
  flex-shrink: 0;
}

:global(.ris-option svg) {
  flex-shrink: 0;
  color: var(--primary);
}

:global(.ris-option-label) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
