<script setup lang="ts">
import { watch } from 'vue'
import { getCollection, type CollectionEndpoint } from '@/api/public'
import { useApi } from '@/composables/useApi'
import RequestError from './RequestError.vue'
import PublicCards from './PublicCards.vue'
const props = defineProps<{ endpoint: CollectionEndpoint; title: string }>()
const { data, error, loading, execute, clear } = useApi((signal: AbortSignal) => getCollection(props.endpoint, signal))
const load = () => execute()
watch(() => props.endpoint, () => { clear(); void load() }, { immediate: true })
</script>
<template>
  <section class="content-section" :aria-busy="loading">
    <h2>{{ title }}</h2>
    <p v-if="loading && !data" role="status">Loading {{ title.toLowerCase() }}…</p>
    <RequestError v-if="error" :error="error" :stale="!!data" :busy="loading" @retry="load" />
    <PublicCards v-if="data?.data.length" :entries="data.data" />
    <p v-else-if="data">There are no published items here yet.</p>
  </section>
</template>
