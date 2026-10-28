<script setup lang="ts">
import PageBanner from './PageBanner.vue'
defineProps<{ title: string; subtitle?: string; home?: boolean; busy?: boolean }>()
</script>
<template>
  <main id="main-content" :aria-busy="busy">
    <slot v-if="home" name="hero" />
    <PageBanner v-else :title="title" :subtitle="subtitle" />
    <div class="public-page"><slot /></div>
  </main>
</template>
