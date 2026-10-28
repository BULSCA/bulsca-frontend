<script setup lang="ts">
import type { SocialItem } from '@/types/footer'

defineProps<{
  links: SocialItem[]
}>()
</script>

<template>
  <div class="footer-social-links">
    <template v-for="(s, i) in links" :key="i">
      <a :href="s.href" target="_blank" rel="noopener noreferrer">
        <img :src="s.imgSrc" :alt="s.alt ?? ''" loading="lazy" class="w-12 h-12" />
      </a>
    </template>
  </div>
</template>
