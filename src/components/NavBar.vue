<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { navigation } from '@/content/navigation'
import logo from '@/assets/blogo.png'
const route = useRoute()
const mobileOpen = ref(false)
const container = ref<HTMLElement>()
function closeMenus() {
  mobileOpen.value = false
  container.value?.querySelectorAll('details').forEach(item => { item.open = false })
}
function escape(event: KeyboardEvent) { if (event.key === 'Escape') closeMenus() }
watch(() => route.fullPath, closeMenus)
onMounted(() => window.addEventListener('keydown', escape))
onBeforeUnmount(() => window.removeEventListener('keydown', escape))
</script>
<template>
  <header ref="container" class="site-header">
    <div class="site-header-inner">
      <RouterLink to="/" class="site-brand" aria-label="BULSCA home"><img :src="logo" alt="" /><span>BULSCA<small>University lifesaving</small></span></RouterLink>
      <button type="button" class="menu-toggle" aria-controls="site-navigation" :aria-expanded="mobileOpen" @click="mobileOpen = !mobileOpen">{{ mobileOpen ? 'Close menu' : 'Menu' }}</button>
      <nav id="site-navigation" aria-label="Main navigation" :class="{ 'is-open': mobileOpen }">
        <ul>
          <li v-for="item in navigation" :key="item.to">
            <details v-if="item.children">
              <summary :class="{ active: route.path.startsWith(item.to) }">{{ item.label }}</summary>
              <ul><li v-for="child in item.children" :key="child.to"><RouterLink :to="child.to">{{ child.label }}</RouterLink></li></ul>
            </details>
            <RouterLink v-else :to="item.to">{{ item.label }}</RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>
