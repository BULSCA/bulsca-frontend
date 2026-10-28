<script setup lang="ts">
import type { PublicEntry } from '@/api/public/types'
import { entryPath } from '@/utils/links'
import SafeLink from './SafeLink.vue'
import CardFrame from './CardFrame.vue'
import CompetitionCard from './CompetitionCard.vue'
import NavigationTile from './NavigationTile.vue'
import { computed } from 'vue'
import { publicImageUrl } from '@/api/presentation'
import CommitteeProfiles from './CommitteeProfiles.vue'
const props = defineProps<{ entries: PublicEntry[] }>()
const tiled = computed(
  () =>
    props.entries.length > 0 &&
    props.entries.every((item) =>
      ['resource-pages', 'championships', 'seasons', 'committees'].includes(item.kind),
    ),
)
function hideImage(event: Event) {
  if (event.target instanceof HTMLImageElement) event.target.hidden = true
}
</script>
<template>
  <CommitteeProfiles v-if="entries.length && entries.every(item => item.kind === 'members')" :members="entries" />
  <div v-else :class="tiled ? 'navigation-tiles' : 'public-grid'">
    <template v-for="item in entries" :key="`${item.kind}-${item.id}`">
      <NavigationTile
        v-if="tiled"
        :title="item.title"
        :to="entryPath(item)"
        :image="item.image_url"
      />
      <CompetitionCard v-else-if="item.kind === 'competitions'" :entry="item" />
      <CardFrame v-else>
        <img
          v-if="publicImageUrl(item.image_url)"
          :key="item.image_url"
          :src="item.image_url"
          alt=""
          loading="lazy"
          @error="hideImage"
        />
        <h3>
          <SafeLink :to="entryPath(item)">{{ item.title }}</SafeLink>
        </h3>
        <p v-if="item.date">
          <time :datetime="item.date">{{ item.date }}</time>
        </p>
        <p v-if="item.location">{{ item.location }}</p>
        <p v-if="item.summary">{{ item.summary }}</p>
        <ul v-if="item.tags?.length" class="tag-list">
          <li v-for="tag in item.tags" :key="tag">{{ tag }}</li>
        </ul>
        <template #footer
          ><SafeLink class="card-action" :to="entryPath(item)" :aria-label="`View ${item.title}`"
            >View</SafeLink
          ></template
        >
      </CardFrame>
    </template>
  </div>
</template>
