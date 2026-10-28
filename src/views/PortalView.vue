<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue'
import { portalUrl } from '@/config'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const destination = computed(() => {
  const path = ['/portal', '/account'].includes(route.path) ? '/dashboard' : route.path.startsWith('/auth/') ? '/login' : route.path
  return new URL(path, portalUrl).href
})
</script>
<template>
  <PageLayout title="Member and management portal">
    <nav aria-label="Breadcrumb"><RouterLink to="/">Home</RouterLink> / Portal</nav>
    <p class="page-description">Continue to BULSCA account access, club editing, competition management and administration.</p>
    <p>Sign-in and management continue in the existing BULSCA administration website.</p>
    <p class="quick-links"><a :href="destination" class="action-button">Open the portal</a><RouterLink to="/contact">Get help with access</RouterLink><RouterLink to="/">Return home</RouterLink></p>
  </PageLayout>
</template>
