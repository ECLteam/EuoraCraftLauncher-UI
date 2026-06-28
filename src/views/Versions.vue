<template>
  <div class="versions-container">
    <div class="versions-content" ref="contentRef">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import '@/styles/Versions.css'
import gsap from 'gsap'

const contentRef = ref<HTMLElement | null>(null)

// 页面加载动画
const playEnterAnimation = () => {
  if (contentRef.value) {
    gsap.fromTo(contentRef.value,
      { opacity: 0, y: 20, scale: 0.98, filter: 'blur(10px)' },
      { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }
    )
  }
}

onMounted(() => {
  playEnterAnimation()
})
</script>

