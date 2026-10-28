<script setup lang="ts">
import type { ContentSection } from '@/api/public/types'
defineProps<{ sections: ContentSection[] }>()
</script>
<template>
  <section v-for="(section, index) in sections" :key="index" class="content-section">
    <h2 v-if="section.heading">{{ section.heading }}</h2>
    <p v-for="(paragraph, i) in section.paragraphs" :key="i">{{ paragraph }}</p>
    <ul v-if="section.bullets?.length"><li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li></ul>
  </section>
</template>
