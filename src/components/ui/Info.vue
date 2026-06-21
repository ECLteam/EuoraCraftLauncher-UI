<template>
  <div class="info-panel" :class="{ collapsed: isCollapsed }">
    <div class="info-header" @click="toggleCollapse">
      <div class="header-left">
        <UiIcon name="info" />
        <span class="info-title">系统信息</span>
      </div>
      <UiIcon name="arrow-right" class="toggle-icon" :class="{ rotated: !isCollapsed }" />
    </div>
    
    <div class="info-content" v-show="!isCollapsed">
      <div class="info-item">
        <span class="info-label">版本</span>
        <span class="info-value">v1.0.0</span>
      </div>
      <div class="info-item">
        <span class="info-label">Java</span>
        <span class="info-value" :class="{ 'status-error': !javaStatus }">
          {{ javaStatus ? '已就绪' : '未找到' }}
        </span>
      </div>
      <div class="info-item">
        <span class="info-label">内存</span>
        <span class="info-value">{{ memoryUsage }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">状态</span>
        <span class="info-value status-online">
          <span class="status-dot"></span>
          在线
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isCollapsed = ref(true)
const javaStatus = ref(true)
const memoryUsage = ref('0 MB')

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 模拟获取系统信息
const updateInfo = () => {
  // 模拟内存使用
  const used = Math.floor(Math.random() * 500) + 200
  memoryUsage.value = `${used} MB`
}

let timer: number

onMounted(() => {
  updateInfo()
  timer = window.setInterval(updateInfo, 5000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped src="@/styles/Info.css"></style>