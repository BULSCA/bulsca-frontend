<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCollection, getDocument, type CollectionEndpoint, type DetailEndpoint, type Params } from '@/api/public'
import type { DocumentResponse, PublicCollection } from '@/api/public/types'
import { browsePages } from '@/content/browse'
import { ApiFailure } from '@/api/errors'
import { useApi } from '@/composables/useApi'
import RequestError from '@/components/RequestError.vue'
import PublicCards from '@/components/PublicCards.vue'
import PublicTable from '@/components/PublicTable.vue'
import ContentSections from '@/components/ContentSections.vue'
import SafeLink from '@/components/SafeLink.vue'
import DocumentAccess from '@/components/DocumentAccess.vue'
import archives from '@/content/championships.json'
const route = useRoute()
const router = useRouter()
const definition = computed(() => browsePages[String(route.meta.browse)]!)
const query = computed(() => ({ q: typeof route.query.q === 'string' ? route.query.q : '', tag: typeof route.query.tag === 'string' ? route.query.tag : '',
  page: String(Number.isSafeInteger(Number(route.query.page)) && Number(route.query.page) > 0 ? Number(route.query.page) : 1) }))
const params = computed<Params>(() => ({ ...Object.fromEntries(Object.entries(route.params).map(([key, value]) => [key, String(value)])),
  season: String(route.params.season || 'current') }))
const { data, error, loading, execute, clear } = useApi<PublicCollection | DocumentResponse, []>((signal: AbortSignal) =>
  definition.value.mode === 'collection'
    ? getCollection(definition.value.endpoint as CollectionEndpoint, signal, query.value)
    : getDocument(definition.value.endpoint as DetailEndpoint, signal, params.value))
const collection = computed(() => data.value && Array.isArray(data.value.data) ? data.value as PublicCollection : null)
const document = computed(() => data.value && !Array.isArray(data.value.data) ? (data.value as DocumentResponse).data : null)
const archive = computed(() => definition.value.endpoint === 'championship' ? archives[String(route.params.year) as keyof typeof archives] : undefined)
const displayError = computed(() => error.value?.status === 404
  ? new ApiFailure('server', 'We could not load this information. The item may not exist, or this service may not be available yet.', 404, error.value.requestId)
  : error.value)
const search = ref(query.value.q)
const tag = ref(query.value.tag)
let timer: ReturnType<typeof setTimeout> | undefined
const load = () => execute()
watch([() => `${String(route.name)}:${JSON.stringify(route.params)}`, () => JSON.stringify(query.value)], ([identity], previous) => {
  if (identity !== previous?.[0]) clear()
  search.value = query.value.q; tag.value = query.value.tag
  void load()
}, { immediate: true })
function searchNow() { clearTimeout(timer); void router.replace({ path: route.path, query: { ...route.query, q: search.value || undefined, tag: tag.value || undefined, page: undefined } }) }
function debounce() { clearTimeout(timer); timer = setTimeout(searchNow, 300) }
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <PageLayout :title="document?.title || definition.title" :busy="loading">
    <nav aria-label="Breadcrumb"><RouterLink to="/">Home</RouterLink> / {{ definition.title }}</nav>
    <p class="page-description">{{ definition.intro }}</p>
    <nav class="quick-links" aria-label="Related pages"><SafeLink v-for="link in definition.links" :key="link.url" :to="link.url">{{ link.label }}</SafeLink></nav>
    <form v-if="definition.search" class="search-form" role="search" @submit.prevent="searchNow">
      <label>Search<input v-model="search" type="search" name="q" @input="debounce" /></label>
      <label>Tag<input v-model="tag" name="tag" placeholder="All tags" /></label>
      <button type="submit" class="action-button">Search</button>
      <RouterLink v-if="query.q || query.tag" :to="route.path">Clear filters</RouterLink>
    </form>
    <RequestError v-if="displayError" :error="displayError" :stale="!!data" :busy="loading" @retry="load" />
    <p v-if="error && collection">These are previously loaded results; they may not match your latest search.</p>
    <p v-if="loading && !data" role="status">Loading {{ definition.title.toLowerCase() }}…</p>
    <section v-if="archive" class="content-section">
      <h2>Championships {{ route.params.year }} archive</h2>
      <p>These details are copied from the published historical page. Entry forms, deadlines and prices are archival; do not use them as current event information.</p>
      <ContentSections :sections="archive.sections" />
      <nav class="quick-links" aria-label="Archived event links"><SafeLink v-for="link in archive.links" :key="link.url" :to="link.url">{{ link.label }}</SafeLink></nav>
    </section>
    <template v-if="collection">
      <p v-if="!collection.data.length" role="status">No matching items are published here. Try another search or browse the related pages.</p>
      <PublicCards :entries="collection.data" />
      <nav v-if="collection.meta.last_page > 1" class="quick-links" aria-label="Result pages">
        <RouterLink v-if="collection.meta.current_page > 1" :to="{ path: route.path, query: { ...route.query, page: collection.meta.current_page - 1 } }">Previous</RouterLink>
        <span>Page {{ collection.meta.current_page }} of {{ collection.meta.last_page }}</span>
        <RouterLink v-if="collection.meta.current_page < collection.meta.last_page" :to="{ path: route.path, query: { ...route.query, page: collection.meta.current_page + 1 } }">Next</RouterLink>
      </nav>
    </template>
    <article v-if="document">
      <p v-if="document.summary" class="content-section">{{ document.summary }}</p>
      <p v-if="document.date"><time :datetime="document.date">{{ document.date }}</time></p>
      <p v-if="document.location">{{ document.location }}</p>
      <ContentSections :sections="document.sections" />
      <PublicTable v-if="document.table" :table="document.table" />
      <nav v-if="document.links?.length" class="quick-links" aria-label="Useful links"><SafeLink v-for="link in document.links" :key="link.url" :to="link.url">{{ link.label }}</SafeLink></nav>
      <section v-if="document.entries?.length" class="content-section"><h2>Explore more</h2><PublicCards :entries="document.entries" /></section>
      <DocumentAccess v-if="document.downloadable && definition.endpoint === 'resource'" :id="String(document.id)" />
    </article>
  </PageLayout>
</template>
