<script setup lang="ts">
import { ref, watch } from 'vue'
import SafeLink from './SafeLink.vue'
import { publicImageUrl } from '@/api/presentation'
const props = defineProps<{ title: string; to: string; image?: string }>()
const failed = ref(false)
watch(
  () => props.image,
  () => {
    failed.value = false
  },
)
</script>
<template>
  <SafeLink :to="to" class="navigation-tile">
    <img
      v-if="publicImageUrl(image) && !failed"
      :src="image"
      alt=""
      loading="lazy"
      @error="failed = true"
    />
    <span>{{ title }}</span>
  </SafeLink>
</template>
