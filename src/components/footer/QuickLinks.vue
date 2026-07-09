<script setup lang="ts">
import type { LinkItem } from '@/types/footer'

const props = defineProps<{
  links: LinkItem[]
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center md:flex-[1] flex-1 border-0">
    <h3 class="header header-white">Quick Links</h3>
    <div class="flex flex-col space-y-1">
      <template v-for="(l, i) in links" :key="i">
        <router-link v-if="!l.external && l.to" :to="l.to" class="text-white font-normal no-underline hover:underline">
          {{ l.label }}
        </router-link>
        <a v-else :href="l.href" class="text-white font-normal no-underline hover:underline" target="_blank" rel="noopener noreferrer">
          {{ l.label }}
        </a>
      </template>
    </div>
  </div>
</template>