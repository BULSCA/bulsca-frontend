<script setup lang="ts">
import { onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { getAssets } from '@/api/assets'

const { data: assets, error, loading, execute } = useApi(async (signal: AbortSignal) => {
  signal.throwIfAborted()
  return (await getAssets()).data.data
})

onMounted(execute)
</script>

<template>
  <div class="dashboard">
    <div v-if="loading">Loading assets…</div>

    <div v-else-if="error" class="error-state">
      <p>{{ error.message }}</p>
      <button @click="execute">Retry</button>
    </div>

    <div v-else-if="!assets?.length" class="empty-state">
      <p>No assets yet.</p>
    </div>

    <ul v-else>
      <li v-for="asset in assets" :key="asset.id">{{ asset.name }}</li>
    </ul>
  </div>
</template>
