<template>
  <component
    :is="rootTag"
    class="ui-loading"
    :class="[`ui-loading--${mode}`, `ui-loading--${size}`, { 'is-visible': show }]"
    :aria-busy="show || undefined"
  >
    <slot />
    <span
      v-if="show"
      class="ui-loading__indicator"
      :role="decorative ? undefined : 'status'"
      :aria-live="decorative ? undefined : 'polite'"
      :aria-label="decorative ? undefined : label || t('app.loading')"
    >
      <UiIcon name="spinner" class="ui-loading__icon" :size="iconSize" />
      <span v-if="label" class="ui-loading__label">{{ label }}</span>
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from './Icon.vue'

defineOptions({ name: 'UiLoading' })

const props = withDefaults(
  defineProps<{
    show?: boolean
    mode?: 'inline' | 'block' | 'overlay'
    size?: 'sm' | 'md' | 'lg'
    label?: string
    decorative?: boolean
  }>(),
  {
    show: true,
    mode: 'block',
    size: 'md',
    label: '',
    decorative: false,
  }
)

const { t } = useI18n()

const rootTag = computed(() => (props.mode === 'inline' ? 'span' : 'div'))
const iconSize = computed(() => ({ sm: 14, md: 20, lg: 28 })[props.size])
</script>

<style scoped src="@/styles/components/ui/Loading.css"></style>
