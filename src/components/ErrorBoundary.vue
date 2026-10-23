<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'
import { reportError } from '@/services/diagnostics'
const props = withDefaults(defineProps<{ routeTemplate?: string }>(), { routeTemplate: '/unknown' })
const failed = ref(false)
const version = ref(0)
onErrorCaptured(() => { failed.value = true; reportError('component', props.routeTemplate); return false })
function retry() { version.value++; failed.value = false }
</script>
<template>
  <section v-if="failed" role="alert" class="container-responsive py-8">
    <h1>This section is temporarily unavailable</h1>
    <p>You can still use the navigation or try loading this section again.</p>
    <button type="button" class="mt-4 rounded border px-4 py-2" @click="retry">Try again</button>
  </section>
  <slot v-else :key="version" />
</template>
