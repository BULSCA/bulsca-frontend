<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue'
import records from '@/content/records.json'
import PublicTable from '@/components/PublicTable.vue'
</script>
<template>
  <PageLayout title="BULSCA records">
    <nav aria-label="Breadcrumb"><RouterLink to="/">Home</RouterLink> / <RouterLink to="/about">About</RouterLink> / Records</nav>
    <p class="page-description">Records copied from the existing BULSCA website. These are the published source records, not live results.</p>
    <PublicTable v-for="table in records" :key="table.caption" :table="table" />
    <p class="content-section">For a record correction or submission, <RouterLink to="/contact-form?department=data">contact the Data Manager</RouterLink>.</p>
  </PageLayout>
</template>
