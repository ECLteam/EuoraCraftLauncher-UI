<template>
  <Teleport to="body">
    <div
      class="notification-center"
      :class="{ 'is-flush-left': shouldFlushLeft }"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      <TransitionGroup name="notification-list" tag="div" class="notification-list">
        <article
          v-for="message in messages"
          :key="message.id"
          class="notification"
          :class="[`notification-${message.type}`, { 'is-paused': message.paused }]"
          :role="getRole(message.type)"
          aria-atomic="true"
          @mouseenter="setInteractionState(message, 'hovered', true)"
          @mouseleave="setInteractionState(message, 'hovered', false)"
          @focusin="setInteractionState(message, 'focused', true)"
          @focusout="handleFocusOut(message, $event)"
        >
          <div class="notification-icon" aria-hidden="true">
            <UiIcon :name="getIcon(message.type)" :size="19" :class="{ spin: message.type === 'loading' }" />
          </div>

          <div class="notification-content">
            <div class="notification-heading">
              {{ message.title || getDefaultTitle(message.type) }}
            </div>
            <p class="notification-message">
              {{ message.content }}
            </p>
          </div>

          <button
            v-if="message.closable"
            type="button"
            class="notification-close"
            :title="t('common.close')"
            :aria-label="t('common.close')"
            @click="remove(message.id)"
          >
            <UiIcon name="close" :size="15" />
          </button>

          <div v-if="message.duration > 0" class="notification-progress" aria-hidden="true">
            <span :style="{ width: `${progressMap[message.id] ?? 100}%` }" />
          </div>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import { useTopNav } from '@/composables/useTopNav'

defineOptions({ name: 'GlassMessage' })

export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface MessageOptions {
  type?: MessageType
  content: string
  title?: string
  duration?: number
  closable?: boolean
  onClose?: () => void
}

interface MessageItem extends MessageOptions {
  id: string
  type: MessageType
  duration: number
  closable: boolean
  remaining: number
  paused: boolean
  hovered: boolean
  focused: boolean
}

interface TimerEntry {
  timeout: ReturnType<typeof setTimeout>
  startedAt: number
}

const DEFAULT_DURATION = 4000
const MAX_VISIBLE_MESSAGES = 5
const PROGRESS_INTERVAL = 50

const { t } = useI18n()
const { isVisible: isFullscreenModalVisible } = useFullscreenModal()
const { topNavEnabled } = useTopNav()
const shouldFlushLeft = computed(() => isFullscreenModalVisible.value || topNavEnabled.value)
const messages = ref<MessageItem[]>([])
const progressMap = ref<Record<string, number>>({})
const timerMap = new Map<string, TimerEntry>()
let progressTicker: ReturnType<typeof setInterval> | null = null
let messageSequence = 0

function getIcon(type: MessageType): string {
  return type === 'loading' ? 'spinner' : type
}

function getRole(type: MessageType): 'alert' | 'status' {
  return type === 'error' || type === 'warning' ? 'alert' : 'status'
}

function getDefaultTitle(type: MessageType): string {
  return t(`common.${type}`)
}

function getVisibleRemaining(message: MessageItem, now = performance.now()): number {
  const timer = timerMap.get(message.id)
  if (!timer) return message.remaining
  return Math.max(0, message.remaining - (now - timer.startedAt))
}

function stopProgressTickerIfIdle() {
  if (timerMap.size > 0 || !progressTicker) return
  clearInterval(progressTicker)
  progressTicker = null
}

function ensureProgressTicker() {
  if (progressTicker) return

  progressTicker = setInterval(() => {
    const now = performance.now()
    for (const message of messages.value) {
      if (message.duration <= 0 || message.paused) continue
      progressMap.value[message.id] = (getVisibleRemaining(message, now) / message.duration) * 100
    }
  }, PROGRESS_INTERVAL)
}

function clearTimer(id: string) {
  const timer = timerMap.get(id)
  if (!timer) return
  clearTimeout(timer.timeout)
  timerMap.delete(id)
}

function startTimer(message: MessageItem) {
  clearTimer(message.id)
  if (message.duration <= 0 || message.remaining <= 0) return

  message.paused = false
  const startedAt = performance.now()
  const timeout = setTimeout(() => remove(message.id), message.remaining)
  timerMap.set(message.id, { timeout, startedAt })
  ensureProgressTicker()
}

function pauseTimer(message: MessageItem) {
  if (message.duration <= 0 || message.paused) return

  message.remaining = getVisibleRemaining(message)
  message.paused = true
  progressMap.value[message.id] = (message.remaining / message.duration) * 100
  clearTimer(message.id)
  stopProgressTickerIfIdle()
}

function resumeTimer(message: MessageItem) {
  if (message.duration <= 0 || !message.paused || message.remaining <= 0) return
  startTimer(message)
}

function setInteractionState(message: MessageItem, state: 'hovered' | 'focused', active: boolean) {
  message[state] = active
  const shouldPause = message.hovered || message.focused
  if (shouldPause) pauseTimer(message)
  else resumeTimer(message)
}

function handleFocusOut(message: MessageItem, event: FocusEvent) {
  const currentTarget = event.currentTarget as HTMLElement | null
  const nextTarget = event.relatedTarget as Node | null
  if (currentTarget?.contains(nextTarget)) return
  setInteractionState(message, 'focused', false)
}

function remove(id: string) {
  const index = messages.value.findIndex((message) => message.id === id)
  if (index === -1) return

  const [message] = messages.value.splice(index, 1)
  clearTimer(id)
  delete progressMap.value[id]
  stopProgressTickerIfIdle()
  message?.onClose?.()
}

function add(options: MessageOptions): string {
  const type = options.type ?? 'info'
  const duration = Math.max(0, options.duration ?? (type === 'loading' ? 0 : DEFAULT_DURATION))
  const id = `notification_${Date.now()}_${messageSequence++}`
  const message: MessageItem = {
    ...options,
    id,
    type,
    duration,
    closable: options.closable ?? true,
    remaining: duration,
    paused: false,
    hovered: false,
    focused: false,
  }

  if (messages.value.length >= MAX_VISIBLE_MESSAGES) {
    const oldestDismissible = [...messages.value].reverse().find((item) => item.type !== 'loading')
    remove(oldestDismissible?.id ?? messages.value.at(-1)?.id ?? '')
  }

  messages.value.unshift(message)
  progressMap.value[id] = 100
  startTimer(message)
  return id
}

function clear() {
  for (const message of [...messages.value]) remove(message.id)
}

onBeforeUnmount(() => {
  for (const timer of timerMap.values()) clearTimeout(timer.timeout)
  timerMap.clear()
  if (progressTicker) clearInterval(progressTicker)
  progressTicker = null
})

defineExpose({
  add,
  remove,
  success: (content: string, duration?: number) => add({ type: 'success', content, duration }),
  error: (content: string, duration?: number) => add({ type: 'error', content, duration }),
  warning: (content: string, duration?: number) => add({ type: 'warning', content, duration }),
  info: (content: string, duration?: number) => add({ type: 'info', content, duration }),
  loading: (content: string, duration = 0) => add({ type: 'loading', content, duration }),
  clear,
})
</script>

<style scoped src="@/styles/components/ui/GlassMessage.css"></style>
