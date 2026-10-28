<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getResourceAccess } from '@/api/public'
import { useApi } from '@/composables/useApi'
import { safeHref } from '@/utils/links'
import RequestError from './RequestError.vue'
const props = defineProps<{ id: string }>()
const { data, error, loading, execute, clear } = useApi((signal: AbortSignal) => getResourceAccess(signal, props.id))
const warning = ref('')
const url = computed(() => {
  const href = safeHref(data.value?.data.url)
  return href && (href.startsWith('/') || /^https?:\/\//i.test(href)) ? href : null
})
watch(() => props.id, () => { clear(); warning.value = '' })
async function prepare() { warning.value = ''; await execute() }
function checkExpiry(event: MouseEvent) {
  const expires = data.value?.data.expires_at
  if (expires && (!Number.isFinite(Date.parse(expires)) || Date.parse(expires) <= Date.now())) {
    event.preventDefault(); clear(); warning.value = 'This download link has expired. Please request a new link.'
  }
}
</script>
<template>
  <section class="content-section" aria-label="Document access">
    <h2>Open this document</h2>
    <button type="button" class="action-button" :disabled="loading" @click="prepare">{{ loading ? 'Preparing link…' : 'Get download link' }}</button>
    <RequestError v-if="error" :error="error" :busy="loading" @retry="prepare" />
    <p v-if="warning" role="alert">{{ warning }}</p>
    <p v-if="data && !url" role="alert">A usable download link was not returned. Please contact BULSCA or try again.</p>
    <p v-if="url"><a :href="url" :download="data?.data.filename" rel="noopener noreferrer" @click="checkExpiry">Open or download document</a></p>
  </section>
</template>
