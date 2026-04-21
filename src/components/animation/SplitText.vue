<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import gsap from 'gsap';

const props = withDefaults(defineProps<{
  text?: string;
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
}>(), {
  text: '',
  className: '',
  delay: 0,
  stagger: 0.05,
  duration: 0.5
});

const containerRef = ref<HTMLElement | null>(null);

const animate = () => {
  if (!containerRef.value) return;
  
  const chars = containerRef.value.querySelectorAll('.char');
  
  gsap.fromTo(chars,
    { 
      opacity: 0,
      y: 20,
      rotateX: -90
    },
    {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: props.duration || 0.4,
      stagger: props.stagger,
      delay: props.delay / 1000,
      ease: 'back.out(1.7)'
    }
  );
};

onMounted(() => {
  animate();
});

watch(() => props.text, () => {
  // 当文本变化时重新动画
  setTimeout(animate, 50);
});
</script>

<template>
  <div ref="containerRef" :class="['split-text', className]">
    <span 
      v-for="(char, index) in text.split('')" 
      :key="index"
      class="char"
      style="display: inline-block; white-space: pre;"
    >{{ char }}</span>
  </div>
</template>

<style scoped>
.split-text {
  display: inline-block;
  perspective: 400px;
}

.char {
  transform-origin: 50% 100%;
  will-change: transform, opacity;
}
</style>