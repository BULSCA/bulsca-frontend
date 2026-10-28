<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { PublicEntry } from '@/api/public/types'
import { competitionStatus, formatEventDate } from '@/utils/dates'
import { entryPath, safeHref } from '@/utils/links'
import CardFrame from './CardFrame.vue'
import SafeLink from './SafeLink.vue'
import SiteIcon from './SiteIcon.vue'
const props = defineProps<{ entry: PublicEntry }>()
const now = ref(new Date())
const status = computed(() => competitionStatus(props.entry.date, now.value))
const results = computed(() =>
  props.entry.results_link && safeHref(props.entry.results_link.url)
    ? props.entry.results_link
    : null,
)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 60_000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>
<template>
  <CardFrame class="competition-card">
    <h3>{{ entry.title }}</h3>
    <p class="card-date">
      <time v-if="entry.date" :datetime="entry.date">{{ formatEventDate(entry.date) }}</time
      ><span v-else>Date to be announced</span>
    </p>
    <p v-if="entry.location" class="card-location">{{ entry.location }}</p>
    <p v-if="entry.summary">{{ entry.summary }}</p>
    <div class="competition-status">
      <SafeLink v-if="results" :to="results.url"
        >{{ results.label || 'View results' }}<SiteIcon name="results"
      /></SafeLink>
      <p v-else :class="{ 'competition-status--unavailable': status.icon === 'unavailable' }">
        {{ status.text }}<SiteIcon :name="status.icon" />
      </p>
    </div>
    <template #footer
      ><SafeLink :to="entryPath(entry)" class="card-action" :aria-label="`View ${entry.title}`"
        >View</SafeLink
      ></template
    >
  </CardFrame>
</template>
