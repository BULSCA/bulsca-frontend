<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { departments, pages } from '@/content/pages'
import ContentSections from '@/components/ContentSections.vue'
import SafeLink from '@/components/SafeLink.vue'
import ApiSection from '@/components/ApiSection.vue'
const route = useRoute()
const page = computed(() => pages[String(route.meta.content)] || pages.about!)
</script>
<template>
  <main id="main-content" class="public-page">
    <nav aria-label="Breadcrumb"><RouterLink to="/">Home</RouterLink><span v-if="route.path !== '/'"> / {{ page.title }}</span></nav>
    <header class="page-intro"><p class="eyebrow">British Universities Life Saving Clubs’ Association</p><h1>{{ page.title }}</h1><p>{{ page.intro }}</p></header>
    <nav v-if="page.links.length" aria-label="Explore this section" class="quick-links"><SafeLink v-for="link in page.links" :key="link.url" :to="link.url">{{ link.label }}</SafeLink></nav>
    <ContentSections :sections="page.sections" />
    <div v-if="route.meta.content === 'contact'" class="public-grid">
      <section v-for="department in departments" :key="department.id" class="public-card">
        <h2>{{ department.label }}</h2><p>{{ department.description }}</p>
        <RouterLink :to="{ path: '/contact-form', query: { department: department.id } }">Contact {{ department.label }}</RouterLink>
        <p><SafeLink :to="`mailto:${department.email}`">{{ department.email }}</SafeLink></p>
      </section>
    </div>
    <template v-if="route.meta.content === 'home'">
      <ApiSection endpoint="highlights" title="Competition highlights" />
      <section class="content-section"><h2>News from BULSCA</h2><p>Read announcements and updates from the university lifesaving community.</p><RouterLink to="/latest">Browse the latest news</RouterLink></section>
      <ApiSection endpoint="social" title="From the community" />
    </template>
    <ApiSection v-if="route.meta.content === 'freshers'" endpoint="clubs" title="Find your university club" />
    <ApiSection v-if="route.meta.content === 'competitions'" endpoint="competitions" title="Competitions and events" />
  </main>
</template>
