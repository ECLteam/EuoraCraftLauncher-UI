<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="markdown-content" @click="handleClick" v-html="html" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import { openExternalUrl } from '@/utils/openExternal'

defineOptions({ name: 'MarkdownContent' })

const props = defineProps<{
  content: string
}>()

const html = computed(() => renderMarkdown(props.content))

function handleClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Element)) return

  const anchor = target.closest<HTMLAnchorElement>('a')
  const href = anchor?.getAttribute('href')?.trim()
  if (!anchor || !href || href.startsWith('#')) return

  event.preventDefault()
  if (/^https?:\/\//i.test(href)) {
    void openExternalUrl(href)
  }
}
</script>

<style scoped src="@/styles/components/ui/MarkdownContent.css"></style>
