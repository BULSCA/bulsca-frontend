<script setup lang="ts">
import { computed } from 'vue'
import { safeHref } from '@/utils/links'
const props = defineProps<{ to: string; download?: string }>()
const href = computed(() => safeHref(props.to))
const internal = computed(() => href.value?.startsWith('/') && !props.download && !href.value.startsWith('/preview/'))
</script>
<template>
  <RouterLink v-if="href && internal" :to="href"><slot /></RouterLink>
  <a v-else-if="href" :href="href" :download="download" :rel="href.startsWith('http') ? 'noopener noreferrer' : undefined"><slot /></a>
  <span v-else><slot /> <small>(link unavailable)</small></span>
</template>
