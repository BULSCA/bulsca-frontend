<script setup lang="ts">
import PageLayout from '@/components/PageLayout.vue'
import HomeCarousel from '@/components/HomeCarousel.vue'
import PageSection from '@/components/PageSection.vue'
import IconTextRow from '@/components/IconTextRow.vue'
import NavigationTile from '@/components/NavigationTile.vue'
import ChampionshipBand from '@/components/ChampionshipBand.vue'
import PublicCards from '@/components/PublicCards.vue'
import ApiSection from '@/components/ApiSection.vue'
import RequestError from '@/components/RequestError.vue'
import { useApi } from '@/composables/useApi'
import { getCollection } from '@/api/public'
import { presentation } from '@/services/presentation'
import { bundledImages } from '@/content/presentation'
const { data, loading, error, execute } = useApi((signal: AbortSignal) =>
  getCollection('highlights', signal),
)
void execute()
const config = presentation.config
</script>
<template>
  <PageLayout title="University lifesaving, together" home full-width>
    <template #hero><HomeCarousel :highlights="data?.data || []" /></template>
    <PageSection>
      <header class="home-intro">
        <p class="eyebrow">British Universities Life Saving Clubs’ Association</p>
        <h1>University lifesaving, together</h1>
      </header>
      <div class="feature-rows">
        <IconTextRow title="Acting Governing Body" icon="announcement"
          ><p>
            BULSCA acts as the governing body for lifesaving sport while at university. We oversee
            the development of university lifesaving clubs and the smooth running of an annual
            league.
          </p></IconTextRow
        >
        <IconTextRow title="By Students, For Students" icon="people" reverse
          ><p>
            The BULSCA committee is made up entirely of volunteers, either current students or
            graduates from higher education institutions.
          </p></IconTextRow
        >
        <IconTextRow title="Our Aims" icon="growth"
          ><p>
            Our aims are to promote the training and development of lifesaving skills, promote
            lifesaving as a sport and oversee competitive lifesaving between higher education
            institutions.
          </p></IconTextRow
        >
      </div>
      <nav class="navigation-tiles" aria-label="Explore BULSCA">
        <NavigationTile
          title="New to lifesaving?"
          to="/freshers"
          :image="bundledImages[2]!.url"
        /><NavigationTile
          title="Find a club"
          to="/get-involved/clubs"
          :image="bundledImages[0]!.url"
        />
      </nav>
    </PageSection>
    <PageSection title="Competition highlights" tone="soft" :aria-busy="loading">
      <p v-if="loading && !data" role="status">Loading competition highlights…</p>
      <RequestError
        v-if="error"
        :error="error"
        :stale="!!data"
        :busy="loading"
        @retry="execute()"
      />
      <PublicCards v-if="data?.data.length" :entries="data.data" />
      <p v-else-if="data">There are no published competitions here yet.</p>
      <RouterLink to="/competitions/calendar" class="text-link"
        >Browse the competition calendar</RouterLink
      >
    </PageSection>
    <ChampionshipBand
      v-if="config.championship_campaign"
      :campaign="config.championship_campaign"
    />
    <PageSection title="News from BULSCA"
      ><p>Read announcements and updates from the university lifesaving community.</p>
      <RouterLink to="/latest" class="text-link">Browse the latest news</RouterLink></PageSection
    >
    <PageSection tone="soft"
      ><ApiSection endpoint="social" title="From the community"
    /></PageSection>
  </PageLayout>
</template>
