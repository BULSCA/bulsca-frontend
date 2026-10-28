<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { getArticles } from '@/api/articles/articles'
import type { Tag } from '@/api/articles/types'
import PageLayout from '@/components/PageLayout.vue'
import ArticlePreviewCard from '@/components/articles/ArticlePreviewCard.vue'
import ArticleSkeleton from '@/components/articles/ArticleSkeleton.vue'
import ArticleEmpty from '@/components/articles/ArticleEmpty.vue'
import RequestError from '@/components/RequestError.vue'
const route = useRoute()
const router = useRouter()
const page = computed(() => {
  const value = Number(route.query.page)
  return Number.isSafeInteger(value) && value > 0 ? value : 1
})
const tag = computed(() => typeof route.query.tag === 'string' ? route.query.tag : '')
const { data, error, loading, execute } = useApi(getArticles)
const load = () => execute(page.value, tag.value)
watch([page, tag], load, { immediate: true })
function selectTag(value: Tag) { void router.push({ path: '/latest', query: { tag: value.slug } }) }
function pageQuery(value: number) { return { ...route.query, page: String(value) } }
</script>
<template>
  <PageLayout title="Latest news" subtitle="News" :busy="loading">
    <p>Announcements and updates from the university lifesaving community.</p>
    <p v-if="tag" class="my-4">Tag: {{ tag }} <RouterLink to="/latest">Clear filter</RouterLink></p>
    <RequestError v-if="error" :error="error" :stale="!!data" :busy="loading" @retry="load" />
    <p v-if="error && data">Previous results may not reflect your latest filter or page selection.</p>
    <div v-if="loading && !data" role="status" aria-label="Loading news"><ArticleSkeleton v-for="n in 3" :key="n" /></div>
    <template v-if="data">
      <ArticleEmpty v-if="!data.data.pinned.length && !data.data.articles.length" />
      <ArticlePreviewCard v-for="article in data.data.pinned" :key="`pinned-${article.id}`" :article="article" @select-tag="selectTag" />
      <ArticlePreviewCard v-for="article in data.data.articles" :key="article.id" :article="article" @select-tag="selectTag" />
      <nav v-if="data.meta.last_page > 1" aria-label="News pages" class="my-6 flex items-center gap-6">
        <RouterLink v-if="data.meta.current_page > 1" :to="{ path: '/latest', query: pageQuery(data.meta.current_page - 1) }">Previous</RouterLink>
        <span>Page {{ data.meta.current_page }} of {{ data.meta.last_page }}</span>
        <RouterLink v-if="data.meta.current_page < data.meta.last_page" :to="{ path: '/latest', query: pageQuery(data.meta.current_page + 1) }">Next</RouterLink>
      </nav>
    </template>
  </PageLayout>
</template>
