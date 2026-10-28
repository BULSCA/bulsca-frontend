<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue'
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticleBySlug } from '@/api/articles/articles'
import { useApi } from '@/composables/useApi'
import { formatDateAuthor } from '@/composables/useArticleFormatting'
import RequestError from '@/components/RequestError.vue'
const route = useRoute()
const router = useRouter()
const { data, error, loading, execute, clear } = useApi(getArticleBySlug)
const load = () => execute(String(route.params.slug))
watch(() => route.params.slug, async () => {
  if (data.value?.data.slug === route.params.slug) return
  clear() // Never show a previous article under another article's URL.
  if (await load()) {
    const slug = data.value?.data.slug
    if (slug && slug !== route.params.slug) void router.replace({ name: 'article', params: { slug } })
  }
}, { immediate: true })
</script>
<template>
  <PageLayout :title="data?.data.title || 'Article'" :subtitle="data ? formatDateAuthor(data.data.created_at, data.data.author) : 'News and announcements'" :busy="loading">
    <RouterLink to="/latest">Back to news</RouterLink>
    <RequestError v-if="error" :error="error" :stale="!!data" :busy="loading" @retry="load" />
    <p v-if="loading && !data" role="status">Loading article…</p>
    <article v-if="data" class="prose max-w-none py-6">
      <!-- Only use the versioned backend's allowlist-sanitized HTML. -->
      <div v-html="data.data.content" />
      <nav v-if="data.data.tags.length" aria-label="Article tags" class="mt-6 flex gap-3">
        <RouterLink v-for="tag in data.data.tags" :key="tag.id" :to="{ path: '/latest', query: { tag: tag.slug } }">{{ tag.name }}</RouterLink>
      </nav>
    </article>
  </PageLayout>
</template>
