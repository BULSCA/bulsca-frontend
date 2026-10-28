<script setup lang="ts">
import { useId } from 'vue'
import ContentContainer from './ContentContainer.vue'
withDefaults(defineProps<{ title?: string; intro?: string; tone?: 'plain' | 'soft' | 'brand' }>(), {
  tone: 'plain',
})
const headingId = useId()
</script>
<template>
  <section
    :class="['page-section', `page-section--${tone}`]"
    :aria-labelledby="title ? headingId : undefined"
  >
    <ContentContainer>
      <header v-if="title || intro" class="section-heading">
        <h2 v-if="title" :id="headingId">{{ title }}</h2>
        <p v-if="intro">{{ intro }}</p>
      </header>
      <slot />
    </ContentContainer>
  </section>
</template>
