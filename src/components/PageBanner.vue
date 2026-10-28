<script setup lang="ts">
import { onMounted, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import logo from '@/assets/blogo.png'
import { presentation } from '@/services/presentation'
const props = defineProps<{ title: string; subtitle?: string; pageKey?: string }>()
const route = useRoute()
const image = shallowRef(presentation.choose(props.pageKey || route.path))
watch(
  () => props.pageKey || route.path,
  (page) => {
    image.value = presentation.choose(page)
  },
)
onMounted(() => {
  void presentation.ensure()
})
function failed() {
  if (image.value) image.value = presentation.imageFailed(props.pageKey || route.path, image.value)
}
</script>
<template>
  <header class="page-banner" :data-image-id="image?.id">
    <img
      v-if="image"
      :key="image.url"
      class="hero-photo"
      :src="image.url"
      alt=""
      aria-hidden="true"
      fetchpriority="high"
      @error="failed"
    />
    <div class="hero-shade" />
    <div class="page-banner-content">
      <img class="banner-logo" :src="logo" alt="" aria-hidden="true" />
      <div>
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>
  </header>
</template>
