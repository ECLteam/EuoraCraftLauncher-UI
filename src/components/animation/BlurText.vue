<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import gsap from 'gsap';

const props = withDefaults(defineProps<{
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
}>(), {
  text: '',
  delay: 50,
  className: '',
  animateBy: 'words',
  direction: 'top'
});

const containerRef = ref<HTMLElement | null>(null);

const animate = () => {
  if (!containerRef.value) return;
  
  const elements = containerRef.value.querySelectorAll('.element');
  const yOffset = props.direction === 'top' ? 10 : -10;
  
  gsap.fromTo(elements,
    { 
      opacity: 0,
      filter: 'blur(10px)',
      y: yOffset
    },
    {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      duration: 0.5,
      stagger: props.delay / 1000,
      ease: 'power2.out'
    }
  );
};

onMounted(() => {
  animate();
});

watch(() => props.text, () => {
  setTimeout(animate, 50);
});

const getElements = () => {
  if (props.animateBy === 'words') {
    return props.text.split(' ');
  }
  return props.text.split('');
};
</script>

<template>
  <div ref="containerRef" :class="['blur-text', className]">
    <span
      v-for="(el, index) in getElements()"
      :key="index"
      class="element"
      style="display: inline-block; white-space: pre;"
    >
      {{ el }}
      <template v-if="animateBy === 'words' && index < getElements().length - 1">&nbsp;</template>
    </span>
  </div>
</template>

<style scoped>
.blur-text {
  display: inline-block;
}

.element {
  will-change: transform, filter, opacity;
}
</style>