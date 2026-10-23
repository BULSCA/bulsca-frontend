<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import { reportError } from './services/diagnostics'
const route = useRoute()
const router = useRouter()
const routeFailed = ref(false)
router.onError(() => { routeFailed.value = true; reportError('route', '/navigation') })
router.afterEach((_to, _from, failure) => { if (!failure) routeFailed.value = false })
</script>
<template>
  <ErrorBoundary route-template="/navigation"><NavBar /></ErrorBoundary>
  <main v-if="routeFailed" role="alert" class="container-responsive py-8">
    <h1>This page could not be loaded</h1>
    <p>Please use another navigation link or reload to try again.</p>
    <button type="button" @click="router.go(0)">Reload page</button>
  </main>
  <RouterView v-slot="{ Component }">
    <ErrorBoundary v-if="!routeFailed" :key="String(route.name)" :route-template="String(route.matched.at(-1)?.path ?? '/unknown')">
      <component :is="Component" />
    </ErrorBoundary>
  </RouterView>
  <ErrorBoundary route-template="/footer"><Footer /></ErrorBoundary>
</template>
