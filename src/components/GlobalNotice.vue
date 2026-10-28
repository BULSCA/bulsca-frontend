<script setup lang="ts">
import { getNotice } from '@/api/public'
import { useApi } from '@/composables/useApi'
import ContentSections from './ContentSections.vue'
const { data, execute } = useApi(getNotice)
void execute()
</script>
<template>
  <aside v-if="data?.data" class="global-notice" aria-label="BULSCA announcement">
    <ContentSections :sections="[data.data]" />
  </aside>
</template>
