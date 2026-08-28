<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { getArticles } from '@/api/articles/articles'
import PageBanner from '@/components/PageBanner.vue'
import ArticlePreviewCard from '@/components/articles/ArticlePreviewCard.vue'
import ArticleSkeleton from '@/components/articles/ArticleSkeleton.vue'
import ArticleEmpty from '@/components/articles/ArticleEmpty.vue'
import { isArticlePinned } from '@/composables/useArticleFormatting'

const { data: articles, error, loading, execute } = useApi(getArticles)

onMounted(execute)

const pinnedArticles = computed(() => {
  if (!articles.value) return []
  return articles.value.filter(a => isArticlePinned(a))
})

const regularArticles = computed(() => {
  if (!articles.value) return []
  return articles.value.filter(a => !isArticlePinned(a))
})
</script>

<template>
  <PageBanner
    title="Latest"
    subtitle="News 📰"
    background-image="https://bulsca.co.uk/storage/photos/DSC_0335.jpg"
    :snow-container="true"
    height="h-[40vh]"
  />

  <div class="container-responsive">
    <!-- Loading State with Skeletons -->
    <div v-if="loading" class="flex flex-col">
      <ArticleSkeleton v-for="n in 3" :key="n" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="py-8 text-center">
      <div class="bg-red-50 border border-bulsca-red/30 rounded-lg p-6 max-w-lg mx-auto">
        <p class="text-bulsca-red font-medium mb-3">{{ error }}</p>
        <button
          @click="execute"
          class="px-4 py-2 bg-bulsca-blue text-white rounded font-medium hover:bg-bulsca-blue/90 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <ArticleEmpty v-else-if="!articles?.length" />

    <!-- Articles List -->
    <div v-else class="flex flex-col pb-8">
      <!-- Pinned Articles Section -->
      <div v-if="pinnedArticles.length > 0" class="flex flex-col">
        <ArticlePreviewCard
          v-for="article in pinnedArticles"
          :key="'pinned-' + article.id"
          :article="article"
        />
      </div>

      <!-- Regular Articles Section -->
      <div class="flex flex-col">
        <ArticlePreviewCard
          v-for="article in regularArticles"
          :key="article.id"
          :article="article"
        />
      </div>
    </div>
  </div>
</template>

