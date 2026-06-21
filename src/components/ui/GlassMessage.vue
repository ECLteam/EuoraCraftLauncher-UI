<template>
  <Teleport to="body">
    <div class="glass-message-container">
      <transition-group name="message-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="glass-message"
          :class="[msg.type, { 'closable': msg.closable }]"
          @mouseenter="pauseTimer(msg)"
          @mouseleave="resumeTimer(msg)"
        >
          <div class="message-icon">
            <Icon :icon="getIcon(msg.type)" width="20" height="20" :style="{ color: getIconColor(msg.type) }" />
          </div>

          <div class="message-content">
            <div v-if="msg.title" class="message-title">{{ msg.title }}</div>
            <div class="message-body">{{ msg.content }}</div>
          </div>

          <UiButton 
            v-if="msg.closable" 
            variant="ghost"
            shape="circle"
            size="sm"
            icon="icon-close"
            class="close-btn"
            @click="remove(msg.id)"
          />

          <div v-if="msg.duration > 0" class="message-progress">
            <div 
              class="progress-bar" 
              :style="{ 
                width: `${progressMap[msg.id] || 100}%`,
                backgroundColor: getProgressColor(msg.type)
              }"
            />
          </div>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import UiButton from '@/components/ui/Button.vue'

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
  startTime: number
  remaining: number
}

const messages = ref<MessageItem[]>([])
const progressMap = ref<Record<string, number>>({})
const timerMap = ref<Record<string, any>>({})

const getIcon = (type: MessageType) => ({
  success: 'mdi:check-circle-outline',
  error: 'mdi:close-circle-outline',
  warning: 'mdi:alert-circle-outline',
  info: 'mdi:information-outline',
  loading: 'mdi:loading'
}[type])

const getIconColor = (type: MessageType) => ({
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  loading: '#60a5fa'
}[type])

const getProgressColor = (type: MessageType) => getIconColor(type)

const add = (options: MessageOptions) => {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const duration = options.duration ?? 3000
  
  const message: MessageItem = {
    type: 'info',
    closable: true,
    ...options,
    id,
    duration,
    startTime: Date.now(),
    remaining: duration
  }

  messages.value.push(message)
  progressMap.value[id] = 100
  
  if (duration > 0) {
    startTimer(message)
  }
  
  return id
}

const startTimer = (msg: MessageItem) => {
  if (timerMap.value[msg.id]) {
    clearTimeout(timerMap.value[msg.id].timeout)
    clearInterval(timerMap.value[msg.id].interval)
  }
  
  const endTime = Date.now() + msg.remaining
  
  const interval = setInterval(() => {
    const left = Math.max(0, endTime - Date.now())
    progressMap.value[msg.id] = (left / msg.duration) * 100
  }, 50)
  
  const timeout = setTimeout(() => {
    clearInterval(interval)
    remove(msg.id)
  }, msg.remaining)
  
  timerMap.value[msg.id] = { interval, timeout }
}

const pauseTimer = (msg: MessageItem) => {
  const timer = timerMap.value[msg.id]
  if (!timer) return
  
  clearTimeout(timer.timeout)
  clearInterval(timer.interval)
  
  msg.remaining = Math.max(0, msg.duration - (Date.now() - msg.startTime))
}

const resumeTimer = (msg: MessageItem) => {
  if (msg.remaining <= 0) return
  msg.startTime = Date.now()
  startTimer(msg)
}

const remove = (id: string) => {
  const idx = messages.value.findIndex(m => m.id === id)
  if (idx === -1) return
  
  const msg = messages.value[idx]
  const timer = timerMap.value[id]
  if (timer) {
    clearTimeout(timer.timeout)
    clearInterval(timer.interval)
    delete timerMap.value[id]
  }
  
  messages.value.splice(idx, 1)
  delete progressMap.value[id]
  msg.onClose?.()
}

defineExpose({
  add,
  remove,
  success: (content: string, duration?: number) => add({ type: 'success', content, duration }),
  error: (content: string, duration?: number) => add({ type: 'error', content, duration }),
  warning: (content: string, duration?: number) => add({ type: 'warning', content, duration }),
  info: (content: string, duration?: number) => add({ type: 'info', content, duration }),
  loading: (content: string, duration?: number) => add({ type: 'loading', content, duration }),
  clear: () => messages.value.forEach(m => remove(m.id))
})
</script>

<style scoped src="@/styles/GlassMessage.css"></style>