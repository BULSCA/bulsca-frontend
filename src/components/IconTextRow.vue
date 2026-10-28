<script setup lang="ts">
import SiteIcon, { type SiteIconName } from './SiteIcon.vue'
defineProps<{ title: string; icon: SiteIconName; reverse?: boolean }>()
</script>
<template>
  <section :class="['icon-text-row', { 'icon-text-row--reverse': reverse }]">
    <SiteIcon :name="icon" />
    <div class="reading-copy">
      <h2>{{ title }}</h2>
      <slot />
    </div>
  </section>
</template>
