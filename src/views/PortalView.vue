<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue'
import { portalUrl } from '@/config'
</script>
<template>
  <PageLayout title="Member and management portal">
    <nav aria-label="Breadcrumb"><RouterLink to="/">Home</RouterLink> / Portal</nav>
    <p class="page-description">Account access, club editing, competition management and administration belong in the separate BULSCA portal.</p>
    <p>This public website does not carry out account or management actions. Portal availability depends on the separate portal service.</p>
    <p class="quick-links"><a :href="portalUrl" class="action-button">Open the portal</a><RouterLink to="/contact">Get help with access</RouterLink><RouterLink to="/">Return home</RouterLink></p>
  </PageLayout>
</template>
