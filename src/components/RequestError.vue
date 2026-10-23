<script setup lang="ts">
import type { ApiFailure } from '@/api/errors'
import { onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps<{ error: ApiFailure; stale?: boolean; busy?: boolean }>()
defineEmits<{ retry: [] }>()
const waiting = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
watch(() => props.error, error => {
  clearTimeout(timer)
  waiting.value = !!error.retryAfter
  if (error.retryAfter) timer = setTimeout(() => { waiting.value = false }, Math.min(error.retryAfter, 86400) * 1000)
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <div role="alert" class="my-6 rounded border border-red-200 bg-red-50 p-5">
    <p>{{ error.message }}</p>
    <p v-if="stale">Showing previously loaded content. It may be out of date.</p>
    <small v-if="error.requestId">Reference: {{ error.requestId }}</small>
    <p v-if="error.retryAfter">Please wait at least {{ error.retryAfter }} seconds.</p>
    <button v-if="!['not_found', 'forbidden'].includes(error.kind)" type="button" :disabled="busy || waiting"
      class="mt-3 block rounded bg-bulsca-blue px-4 py-2 text-white disabled:opacity-50" @click="$emit('retry')">Try again</button>
  </div>
</template>
