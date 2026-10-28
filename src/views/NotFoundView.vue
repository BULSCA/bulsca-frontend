<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue'
</script>
<template>
  <PageLayout title="Page not found">
    <p>We could not find this page. You can return home or browse the latest news.</p>
    <RouterLink to="/">Home</RouterLink> · <RouterLink to="/latest">Latest news</RouterLink>
  </PageLayout>
</template>
