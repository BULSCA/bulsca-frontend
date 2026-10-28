<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import { reportError } from './services/diagnostics'
import { previewMode } from './config'
import PageLayout from './components/PageLayout.vue'
import GlobalNotice from './components/GlobalNotice.vue'
const route = useRoute()
const router = useRouter()
const routeFailed = ref(false)
router.onError(() => { routeFailed.value = true; reportError('route', '/navigation') })
router.afterEach((_to, _from, failure) => { if (!failure) routeFailed.value = false })
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div v-if="previewMode" class="preview-banner" role="status">Preview — sample data. Dynamic people, clubs and results are fictional; messages are not sent. Archives and records are labelled separately. <RouterLink to="/">Explore the preview</RouterLink></div>
  <ErrorBoundary route-template="/navigation"><NavBar /></ErrorBoundary>
  <ErrorBoundary route-template="/notice"><GlobalNotice /></ErrorBoundary>
  <PageLayout v-if="routeFailed" title="This page could not be loaded" role="alert">
    <p>Please use another navigation link or reload to try again.</p>
    <button type="button" @click="router.go(0)">Reload page</button>
  </PageLayout>
  <RouterView v-slot="{ Component }">
    <ErrorBoundary v-if="!routeFailed" :key="route.path" :reset-key="route.fullPath" :route-template="String(route.matched[route.matched.length - 1]?.path ?? '/unknown')">
      <template #fallback="{ retry }">
        <PageLayout title="This page is temporarily unavailable" role="alert">
          <p>You can still use the navigation or try loading this page again.</p>
          <button type="button" class="action-button" @click="retry">Try again</button>
        </PageLayout>
      </template>
      <component :is="Component" />
    </ErrorBoundary>
  </RouterView>
  <ErrorBoundary route-template="/footer"><Footer /></ErrorBoundary>
</template>
