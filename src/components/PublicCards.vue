<script setup lang="ts">
import type { PublicEntry } from '@/api/public/types'
import { entryPath, safeHref } from '@/utils/links'
import SafeLink from './SafeLink.vue'
defineProps<{ entries: PublicEntry[] }>()
function hideImage(event: Event) { if (event.target instanceof HTMLImageElement) event.target.hidden = true }
</script>
<template>
  <div class="public-grid">
    <article v-for="item in entries" :key="`${item.kind}-${item.id}`" class="public-card">
      <img v-if="item.image_url && safeHref(item.image_url)" :src="item.image_url" alt="" loading="lazy" @error="hideImage" />
      <h3><SafeLink :to="entryPath(item)">{{ item.title }}</SafeLink></h3>
      <p v-if="item.date"><time :datetime="item.date">{{ item.date }}</time></p>
      <p v-if="item.location">{{ item.location }}</p>
      <p v-if="item.summary">{{ item.summary }}</p>
      <ul v-if="item.tags?.length" class="tag-list"><li v-for="tag in item.tags" :key="tag">{{ tag }}</li></ul>
    </article>
  </div>
</template>
