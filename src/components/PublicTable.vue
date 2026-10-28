<script setup lang="ts">
import type { ContentTable } from '@/api/public/types'
defineProps<{ table: ContentTable }>()
</script>
<template>
  <div class="table-scroll" tabindex="0" :aria-label="table.caption">
    <table>
      <caption>{{ table.caption }}</caption>
      <thead><tr><th v-for="(column, i) in table.columns" :key="i" scope="col">{{ column }}</th></tr></thead>
      <tbody><tr v-for="(row, i) in table.rows" :key="i"><td v-for="(cell, j) in row" :key="j">{{ cell }}</td></tr></tbody>
    </table>
  </div>
</template>
