<template>
  <label class="ui-switch" :class="{ 'is-disabled': disabled }">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
    />
    <span class="slider"></span>
    <span v-if="label" class="switch-label">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  label?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<style scoped>
.ui-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.ui-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.slider {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  background-color: var(--text-disabled);
  transition: all var(--duration-normal) var(--ease-standard);
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: all var(--duration-normal) var(--ease-standard);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(16px);
}

input:focus-visible + .slider {
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-label {
  font-size: 14px;
  color: var(--text-primary);
}
</style>