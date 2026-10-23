<template>
  <div class="py-8 first-of-type:pt-0 border-b border-gray-200 w-full">
    <RouterLink
      :to="linkTarget"
      class="no-underline block w-full group text-inherit"
    >
      <article class="flex flex-col w-full">
        <!-- Top Title & Pin Row -->
        <div class="flex flex-row items-start justify-between w-full">
          <div class="w-full flex-1">
            <h1 class="header group-hover:text-bulsca_red transition-colors text-bulsca-blue">
              {{ article.title }}
            </h1>

            <div class="flex flex-row items-center justify-between w-full mt-1 mb-1">
              <small class="text-gray-500 font-normal text-sm">
                {{ dateAuthorText }}
              </small>
              <small class="text-gray-500 font-normal text-sm ml-auto flex flex-row items-center space-x-1">
                <span class="pl-2">{{ formattedViews }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-gray-400">
                  <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                </svg>
              </small>
            </div>
          </div>

          <!-- Pinned Pin Icon -->
          <svg
            v-if="isPinned"
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10 ml-4 text-bulsca_red transition-colors flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>

        <!-- Excerpt Paragraph -->
        <p v-if="excerptText" class="text-black font-normal mt-2 leading-relaxed text-base">
          {{ excerptText }}
        </p>

        <!-- Read more indicator (Blue text, aligned to the right, turns red on hover) -->
        <div class="flex justify-end w-full mt-2">
          <small class="text-bulsca-blue group-hover:text-bulsca_red transition-colors font-medium text-sm">
            Click to continue reading
          </small>
        </div>
      </article>
    </RouterLink>

    <!-- Tags Row -->
    <div v-if="article.tags && article.tags.length > 0" class="flex flex-wrap gap-2 items-center mt-3">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-gray-400">
        <path fill-rule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      <button
        type="button"
        v-for="tag in article.tags"
        :key="tag.id || tag.slug"
        class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-bulsca-blue hover:text-white transition-colors duration-200 cursor-pointer"
        @click.stop="$emit('select-tag', tag)"
      >
        {{ tag.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Article, Tag } from '@/api/articles/types'
import { formatDateAuthor, formatViews, getExcerpt, isArticlePinned } from '@/composables/useArticleFormatting'

const props = defineProps<{
  article: Article
  link?: string
}>()

defineEmits<{
  (e: 'select-tag', tag: Tag): void
}>()

const isPinned = computed(() => isArticlePinned(props.article))

const dateAuthorText = computed(() =>
  formatDateAuthor(props.article.created_at, props.article.author)
)

const formattedViews = computed(() =>
  formatViews(props.article.views)
)

const excerptText = computed(() =>
  getExcerpt(undefined, props.article.excerpt)
)

const linkTarget = computed(() => {
  if (props.link) return props.link
  const identifier = props.article.slug || props.article.id
  return identifier ? `/article/${identifier}` : '#'
})
</script>
