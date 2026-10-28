<script setup lang="ts">
import type { LinkItem } from '@/types/footer'

defineProps<{
  links: LinkItem[]
}>()
</script>

<template>
  <nav class="footer-quick-links" aria-label="Footer navigation">
    <h3 class="header header-white">Quick Links</h3>
    <div class="flex flex-col space-y-1">
      <template v-for="(l, i) in links" :key="i">
        <router-link
          v-if="!l.external && l.to"
          :to="l.to"
          class="text-white font-normal no-underline hover:underline"
        >
          {{ l.label }}
        </router-link>
        <a
          v-else
          :href="l.href"
          class="text-white font-normal no-underline hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ l.label }}
        </a>
      </template>
    </div>
  </nav>
</template>
