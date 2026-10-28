<script setup lang="ts">
import { portalUrl } from '@/config'
</script>
<template>
  <main id="main-content" class="public-page">
    <nav aria-label="Breadcrumb"><RouterLink to="/">Home</RouterLink> / Portal</nav>
    <header class="page-intro"><h1>Member and management portal</h1><p>Account access, club editing, competition management and administration belong in the separate BULSCA portal.</p></header>
    <p>This public website does not carry out account or management actions. Portal availability depends on the separate portal service.</p>
    <p class="quick-links"><a :href="portalUrl" class="action-button">Open the portal</a><RouterLink to="/contact">Get help with access</RouterLink><RouterLink to="/">Return home</RouterLink></p>
  </main>
</template>
