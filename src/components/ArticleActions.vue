<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { recordView, rateArticle, type ArticleCounters } from '@/api/articles/interactions'
import { getArticleBySlug } from '@/api/articles/articles'
import type { Article } from '@/api/articles/types'
import { previewMode } from '@/config'
const props = defineProps<{ article: Article }>()
const counters = shallowRef<ArticleCounters>(props.article)
const pending = ref(false)
const message = ref('')
const uncertain = ref(false)
let controller = new AbortController()
let revision = 0
onMounted(() => watch(() => props.article.id, async () => {
  controller.abort()
  const active = new AbortController()
  controller = active
  revision = 0; pending.value = false; uncertain.value = false; message.value = ''; counters.value = props.article
  try {
    const result = await recordView(props.article.slug, crypto.randomUUID(), active.signal)
    if (!active.signal.aborted && revision === 0) counters.value = result
  } catch { /* Best-effort view reporting never blocks the article or rating controls. */ }
}, { immediate: true }))
async function vote(type: 'up' | 'down') {
  if (pending.value || uncertain.value) return
  const active = controller
  revision++
  pending.value = true; message.value = ''
  try {
    const result = await rateArticle(props.article.slug, type, crypto.randomUUID(), active.signal)
    if (!active.signal.aborted) { counters.value = result; message.value = previewMode ? 'Preview rating updated locally.' : 'Thank you for your feedback.' }
  } catch {
    if (!active.signal.aborted) { uncertain.value = true; message.value = 'We could not confirm your rating. Refresh the totals before submitting another rating.' }
  } finally { if (!active.signal.aborted) pending.value = false }
}
async function refresh() {
  if (pending.value) return
  const active = controller
  revision++
  pending.value = true
  try {
    const result = await getArticleBySlug(active.signal, props.article.slug)
    if (!active.signal.aborted) { counters.value = result.data; uncertain.value = false; message.value = 'Totals refreshed.' }
  } catch { if (!active.signal.aborted) message.value = 'Totals are still unavailable. Your article remains readable.' }
  finally { if (!active.signal.aborted) pending.value = false }
}
onBeforeUnmount(() => controller.abort())
</script>
<template>
  <section class="content-section article-actions" aria-label="Article feedback" :aria-busy="pending">
    <h2>Article feedback</h2>
    <p>{{ counters.views }} views</p>
    <div class="quick-links">
      <button class="action-button" :disabled="pending || uncertain" @click="vote('up')">Helpful ({{ counters.thumbs_up }})</button>
      <button class="action-button" :disabled="pending || uncertain" @click="vote('down')">Not helpful ({{ counters.thumbs_down }})</button>
      <button v-if="uncertain" class="action-button" :disabled="pending" @click="refresh">Refresh totals</button>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="previewMode">Preview feedback stays in this browser and is not submitted.</p>
  </section>
</template>
