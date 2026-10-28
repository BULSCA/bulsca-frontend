<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { departments, pages } from '@/content/pages'
import ContentSections from '@/components/ContentSections.vue'
import SafeLink from '@/components/SafeLink.vue'
import ApiSection from '@/components/ApiSection.vue'
import PageLayout from '@/components/PageLayout.vue'
import HomeCarousel from '@/components/HomeCarousel.vue'
import PublicCards from '@/components/PublicCards.vue'
import RequestError from '@/components/RequestError.vue'
import { useApi } from '@/composables/useApi'
import { getCollection } from '@/api/public'
const route = useRoute()
const page = computed(() => pages[String(route.meta.content)] || pages.about!)
const highlights = useApi((signal: AbortSignal) => getCollection('highlights', signal))
const highlightsData = highlights.data
const highlightsError = highlights.error
const highlightsLoading = highlights.loading
watch(() => route.meta.content, content => { if (content === 'home') void highlights.execute(); else highlights.clear() }, { immediate: true })
</script>
<template>
  <PageLayout :title="page.title" :home="route.meta.content === 'home'">
    <template v-if="route.meta.content === 'home'" #hero><HomeCarousel :highlights="highlightsData?.data || []" /></template>
    <nav aria-label="Breadcrumb"><RouterLink to="/">Home</RouterLink><span v-if="route.path !== '/'"> / {{ page.title }}</span></nav>
    <header class="page-intro"><p class="eyebrow">British Universities Life Saving Clubs’ Association</p><h1 v-if="route.meta.content === 'home'">{{ page.title }}</h1><p>{{ page.intro }}</p></header>
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
      <section class="content-section" :aria-busy="highlightsLoading">
        <h2>Competition highlights</h2>
        <p v-if="highlightsLoading && !highlightsData" role="status">Loading competition highlights…</p>
        <RequestError v-if="highlightsError" :error="highlightsError" :stale="!!highlightsData" :busy="highlightsLoading" @retry="highlights.execute()" />
        <PublicCards v-if="highlightsData?.data.length" :entries="highlightsData.data" />
        <p v-else-if="highlightsData">There are no published competitions here yet.</p>
      </section>
      <section class="content-section"><h2>News from BULSCA</h2><p>Read announcements and updates from the university lifesaving community.</p><RouterLink to="/latest">Browse the latest news</RouterLink></section>
      <ApiSection endpoint="social" title="From the community" />
    </template>
    <ApiSection v-if="route.meta.content === 'freshers'" endpoint="clubs" title="Find your university club" />
    <ApiSection v-if="route.meta.content === 'competitions'" endpoint="competitions" title="Competitions and events" />
  </PageLayout>
</template>
