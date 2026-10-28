<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ChampionshipCampaign } from '@/api/presentation'
import { formatDateRange } from '@/utils/dates'
import PageSection from './PageSection.vue'
import SafeLink from './SafeLink.vue'
const props = defineProps<{ campaign: ChampionshipCampaign }>()
const failed = ref(false)
watch(
  () => props.campaign.logo_url,
  () => {
    failed.value = false
  },
)
const colours = computed(() => ({
  '--campaign-primary': props.campaign.colours[0],
  '--campaign-secondary': props.campaign.colours[1],
}))
</script>
<template>
  <PageSection tone="brand" class="championship-band" :style="colours" :aria-label="campaign.title">
    <div class="championship-content">
      <div class="championship-identity">
        <img
          v-if="campaign.logo_url && !failed"
          :src="campaign.logo_url"
          :alt="`${campaign.title} logo`"
          loading="lazy"
          @error="failed = true"
        />
        <h2 v-else>{{ campaign.title }}</h2>
      </div>
      <div class="championship-copy">
        <h2 v-if="campaign.logo_url && !failed">{{ campaign.title }}</h2>
        <p class="championship-dates">
          <time :datetime="campaign.start_date">{{
            formatDateRange(campaign.start_date, campaign.end_date)
          }}</time>
        </p>
        <p class="championship-location">@ {{ campaign.location }}</p>
        <SafeLink
          v-if="campaign.link"
          :to="campaign.link.url"
          class="action-button action-button--light"
          >{{ campaign.link.label }}</SafeLink
        >
      </div>
    </div>
  </PageSection>
</template>
