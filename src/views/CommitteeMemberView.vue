<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getDocument } from '@/api/public'
import { useApi } from '@/composables/useApi'
import PageLayout from '@/components/PageLayout.vue'
import PageSection from '@/components/PageSection.vue'
import CommitteeProfileCard from '@/components/CommitteeProfileCard.vue'
import ContentSections from '@/components/ContentSections.vue'
import PublicCards from '@/components/PublicCards.vue'
import RequestError from '@/components/RequestError.vue'
import SafeLink from '@/components/SafeLink.vue'
import { usePageMetadata } from '@/composables/usePageMetadata'
const route = useRoute()
const { data, error, loading, execute, clear } = useApi((signal: AbortSignal) =>
  getDocument('member', signal, {
    season: String(route.params.season || 'current'),
    slug: String(route.params.slug),
  }),
)
const member = computed(() => data.value?.data)
usePageMetadata(() => member.value?.title || 'Committee member')
const role = computed(
  () => member.value?.role_label || member.value?.tags?.[0] || 'Committee member',
)
const committeePath = computed(() =>
  route.params.season && route.params.season !== 'current'
    ? `/get-involved/committee/${encodeURIComponent(String(route.params.season))}`
    : '/get-involved/committee',
)
watch(
  () => `${String(route.params.season)}:${String(route.params.slug)}`,
  () => {
    clear()
    void execute()
  },
  { immediate: true },
)
</script>
<template>
  <PageLayout
    :title="member?.title || 'Committee member'"
    :subtitle="role"
    :busy="loading"
    full-width
  >
    <PageSection>
      <nav class="page-breadcrumb" aria-label="Breadcrumb">
        <RouterLink to="/">Home</RouterLink> /
        <RouterLink :to="committeePath">Committee</RouterLink> /
        {{ member?.title || 'Member profile' }}
      </nav>
      <RequestError v-if="error" :error="error" :busy="loading" @retry="execute()" />
      <p v-if="loading && !member" role="status">Loading committee profile…</p>
      <div v-if="member" class="committee-member-layout">
        <CommitteeProfileCard :member="member" :linked="false" />
        <article class="committee-biography reading-copy">
          <h2>About me</h2>
          <ContentSections
            v-if="member.sections.length"
            :sections="member.sections"
            :heading-level="3"
          />
          <p v-else>This member has not added a bio yet.</p>
          <nav v-if="member.links?.length" class="quick-links" aria-label="Profile links">
            <SafeLink v-for="link in member.links" :key="link.url" :to="link.url">{{
              link.label
            }}</SafeLink>
          </nav>
        </article>
      </div>
      <RouterLink :to="committeePath" class="action-button">Back to the committee</RouterLink>
    </PageSection>
    <PageSection v-if="member" :title="`What is the role of ${role}?`" tone="brand"
      ><ContentSections
        v-if="member.role_sections?.length"
        :sections="member.role_sections"
        :heading-level="3"
      />
      <p v-else>Details about this role have not been published yet.</p></PageSection
    >
    <PageSection v-if="member?.entries?.length" title="Related information"
      ><PublicCards :entries="member.entries"
    /></PageSection>
  </PageLayout>
</template>
