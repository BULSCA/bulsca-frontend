<template>
  <div class="fixed w-screen z-50 transition-all duration-100" :class="navStyle" id="navbar">
    <div class="nav-wrapper transition-all duration-100">
      <RouterLink to="/" class="nav-brand 2xl:text-2xl text-xl pr-2 md:pr-0 capitalize transition-all">
        British Universities Lifesaving Clubs' Association
      </RouterLink>

      <button class="lg:hidden block text-white font-bold ml-auto" @click="mobileOpen = !mobileOpen" aria-label="Toggle menu">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <nav class="ml-auto mr-10 lg:block hidden">
        <ul class="flex space-x-4 xl:space-x-8 2xl:space-x-12 nav-list">
          <li v-for="(item, i) in links" :key="i" :class="{ 'group': !!item.children, 'nav-active': isActive(item) }">
            <!-- explicit, guarded rendering -->
            <RouterLink v-if="!item.external && routeExists(item.to)" :to="item.to" class="inline-block">{{ item.label }}</RouterLink>
            <a v-else-if="item.external" :href="item.href" class="inline-block" target="_blank" rel="noopener noreferrer">{{ item.label }}</a>
            <a v-else :href="item.to" class="inline-block">{{ item.label }}</a>

            <div v-if="item.children" class="dropdown group-hover:h-auto group-focus:h-auto group-active:h-auto group-focus-within:h-auto">
              <ul>
                <li v-for="(c, j) in item.children" :key="j">
                  <RouterLink v-if="routeExists(c.to)" :to="c.to">{{ c.label }}</RouterLink>
                  <a v-else :href="c.to">{{ c.label }}</a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  </div>

  <!-- Mobile nav (unchanged) -->
  <div :class="['mobile-nav', mobileOpen ? 'open' : '']">
    ...
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'

const mobileOpen = ref(false)
const mobileOpenItems = reactive<Record<number, boolean>>({})

function toggleMobileItem(i: number) {
  mobileOpenItems[i] = !mobileOpenItems[i]
}

const links = [
  /* ...your links... */
]

const route = useRoute()
const router = useRouter()

function routeExists(path?: string) {
  if (!path) return false
  return router.getRoutes().some(r => r.path === path || (r.path !== '/' && path.startsWith(r.path)))
}

function isActive(item: any) {
  if (item.external) return false
  if (!item.to) return false
  if (!routeExists(item.to)) return false
  return route.path.startsWith(item.to)
}

const navStyle = computed(() => '')
</script>

<style scoped>
.mobile-nav { right: -100%; }
.mobile-nav.open { right: 0; }
</style>