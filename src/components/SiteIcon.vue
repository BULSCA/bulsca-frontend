<script setup lang="ts">
export type SiteIconName =
  | 'announcement'
  | 'people'
  | 'growth'
  | 'clock'
  | 'results'
  | 'unavailable'
defineProps<{ name: SiteIconName }>()
const paths: Record<SiteIconName, string> = {
  announcement:
    'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  people:
    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  growth: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  results: 'M14 3h7v7m0-7L10 14M10 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5',
  unavailable:
    'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
}
</script>
<template>
  <svg
    class="site-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="paths[name]" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
