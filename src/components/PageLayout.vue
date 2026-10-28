<script setup lang="ts">
import PageBanner from './PageBanner.vue'
import ContentContainer from './ContentContainer.vue'
defineProps<{
  title: string
  subtitle?: string
  home?: boolean
  busy?: boolean
  fullWidth?: boolean
}>()
</script>
<template>
  <main id="main-content" :aria-busy="busy">
    <slot v-if="home" name="hero" />
    <PageBanner v-else :title="title" :subtitle="subtitle" />
    <div v-if="fullWidth" class="page-body"><slot /></div>
    <ContentContainer v-else class="public-page"><slot /></ContentContainer>
  </main>
</template>
