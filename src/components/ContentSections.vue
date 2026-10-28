<script setup lang="ts">
import type { ContentSection } from '@/api/public/types'
withDefaults(defineProps<{ sections: ContentSection[]; headingLevel?: 2 | 3 }>(), { headingLevel: 2 })
</script>
<template>
  <section v-for="(section, index) in sections" :key="index" class="content-section reading-copy">
    <component :is="`h${headingLevel}`" v-if="section.heading">{{ section.heading }}</component>
    <!-- html is exclusively the versioned backend's allowlist-sanitized rich content. -->
    <div v-if="section.html" class="article-copy" v-html="section.html" />
    <p v-for="(paragraph, i) in section.paragraphs" :key="i">{{ paragraph }}</p>
    <ul v-if="section.bullets?.length"><li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li></ul>
  </section>
</template>
