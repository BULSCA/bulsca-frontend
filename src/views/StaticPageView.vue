<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { departments, pages } from '@/content/pages'
import ContentSections from '@/components/ContentSections.vue'
import SafeLink from '@/components/SafeLink.vue'
import ApiSection from '@/components/ApiSection.vue'
import PageLayout from '@/components/PageLayout.vue'
import NavigationTile from '@/components/NavigationTile.vue'
import CardFrame from '@/components/CardFrame.vue'
import { bundledImages } from '@/content/presentation'
const route = useRoute()
const page = computed(() => pages[String(route.meta.content)] || pages.about!)
const tiled = computed(() =>
  ['about', 'freshers', 'involved', 'competitions', 'welfare'].includes(String(route.meta.content)),
)
</script>
<template>
  <PageLayout :title="page.title">
    <nav aria-label="Breadcrumb">
      <RouterLink to="/">Home</RouterLink><span v-if="route.path !== '/'"> / {{ page.title }}</span>
    </nav>
    <header class="page-intro">
      <p class="eyebrow">British Universities Life Saving Clubs’ Association</p>
      <p>{{ page.intro }}</p>
    </header>
    <nav
      v-if="page.links.length"
      aria-label="Explore this section"
      :class="tiled ? 'navigation-tiles' : 'quick-links'"
    >
      <template v-for="(link, index) in page.links" :key="link.url"
        ><NavigationTile
          v-if="tiled"
          :title="link.label"
          :to="link.url"
          :image="bundledImages[index % bundledImages.length]!.url"
        /><SafeLink v-else :to="link.url">{{ link.label }}</SafeLink></template
      >
    </nav>
    <ContentSections :sections="page.sections" />
    <div v-if="route.meta.content === 'contact'" class="public-grid">
      <CardFrame v-for="department in departments" :key="department.id">
        <h2>{{ department.label }}</h2>
        <p>{{ department.description }}</p>
        <p>
          <SafeLink :to="`mailto:${department.email}`">{{ department.email }}</SafeLink>
        </p>
        <template #footer
          ><RouterLink
            class="card-action"
            :to="{ path: '/contact-form', query: { department: department.id } }"
            >Contact {{ department.label }}</RouterLink
          ></template
        >
      </CardFrame>
    </div>
    <ApiSection
      v-if="route.meta.content === 'freshers'"
      endpoint="clubs"
      title="Find your university club"
    />
    <ApiSection
      v-if="route.meta.content === 'competitions'"
      endpoint="competitions"
      title="Competitions and events"
    />
  </PageLayout>
</template>
