<script setup lang="ts">
import records from '@/content/records.json'
import PublicTable from '@/components/PublicTable.vue'
</script>
<template>
  <main id="main-content" class="public-page">
    <nav aria-label="Breadcrumb"><RouterLink to="/">Home</RouterLink> / <RouterLink to="/about">About</RouterLink> / Records</nav>
    <header class="page-intro"><h1>BULSCA records</h1><p>Records copied from the existing BULSCA website. These are the published source records, not live results.</p></header>
    <PublicTable v-for="table in records" :key="table.caption" :table="table" />
    <p class="content-section">For a record correction or submission, <RouterLink to="/contact-form?department=data">contact the Data Manager</RouterLink>.</p>
  </main>
</template>
