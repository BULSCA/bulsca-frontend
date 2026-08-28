<template>
  <div class="fixed top-0 left-0 w-screen z-50 transition-all duration-200" :class="navStyle" id="navbar">
    <div class="nav-wrapper transition-all duration-200">
      <RouterLink to="/" class="nav-brand transition-all">
        British Universities Lifesaving Clubs' Association
      </RouterLink>

      <button
        class="lg:hidden block text-white font-bold ml-auto p-1 focus:outline-none"
        @click="mobileOpen = !mobileOpen"
        aria-label="Toggle menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <nav class="ml-auto mr-10 lg:block hidden">
        <ul class="flex space-x-6 xl:space-x-10 2xl:space-x-14 nav-list">
          <li
            v-for="(item, i) in links"
            :key="i"
            :class="{ 'group': !!item.children, 'nav-active': isActive(item) }"
          >
            <!-- Top level link -->
            <RouterLink
              v-if="!item.external && item.to"
              :to="item.to"
              class="overflow-hidden overflow-ellipsis whitespace-nowrap inline-block"
            >
              {{ item.label }}
            </RouterLink>
            <a
              v-else-if="item.external"
              :href="item.href || item.to"
              class="overflow-hidden overflow-ellipsis whitespace-nowrap inline-block"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ item.label }}
            </a>
            <span
              v-else
              class="overflow-hidden overflow-ellipsis whitespace-nowrap inline-block cursor-pointer"
            >
              {{ item.label }}
            </span>

            <!-- Dropdown menu -->
            <div v-if="item.children" class="dropdown group-hover:h-auto group-focus:h-auto group-active:h-auto group-focus-within:h-auto">
              <ul>
                <li v-for="(c, j) in item.children" :key="j">
                  <RouterLink v-if="!c.external && c.to" :to="c.to">
                    {{ c.label }}
                  </RouterLink>
                  <a
                    v-else-if="c.external"
                    :href="c.href || c.to"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ c.label }}
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  </div>

  <!-- Mobile nav drawer -->
  <div :class="['mobile-nav', mobileOpen ? 'open' : '']">
    <div>
      <RouterLink to="/" class="nav-brand text-lg" @click="mobileOpen = false">
        British Universities Lifesaving Clubs' Association
      </RouterLink>
      <button
        class="ml-auto text-gray-800 p-1 focus:outline-none"
        @click="mobileOpen = false"
        aria-label="Close menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <nav>
      <ul>
        <li
          v-for="(item, i) in links"
          :key="i"
          :class="{ 'mobile-nav-active': isActive(item) }"
        >
          <div class="mobile-nav-link">
            <RouterLink
              v-if="!item.external && item.to"
              :to="item.to"
              class="py-2 text-gray-800 hover:text-bulsca-red flex-1"
              @click="mobileOpen = false"
            >
              {{ item.label }}
            </RouterLink>
            <a
              v-else-if="item.external"
              :href="item.href || item.to"
              target="_blank"
              rel="noopener noreferrer"
              class="py-2 text-gray-800 hover:text-bulsca-red flex-1"
              @click="mobileOpen = false"
            >
              {{ item.label }}
            </a>
            <span
              v-else
              class="py-2 text-gray-800 flex-1 cursor-pointer"
              @click="toggleMobileItem(i)"
            >
              {{ item.label }}
            </span>

            <button
              v-if="item.children"
              @click="toggleMobileItem(i)"
              class="p-2 text-gray-600 focus:outline-none"
              aria-label="Toggle submenu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 transition-transform duration-200"
                :class="{ 'rotate-180': mobileOpenItems[i] }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <!-- Mobile sub-items accordion -->
          <ul
            v-if="item.children && mobileOpenItems[i]"
            class="mobile-dropdown pl-4 space-y-1 py-1"
          >
            <li v-for="(c, j) in item.children" :key="j">
              <RouterLink
                v-if="!c.external && c.to"
                :to="c.to"
                class="block py-1 text-gray-600 hover:text-bulsca-red text-base"
                @click="mobileOpen = false"
              >
                {{ c.label }}
              </RouterLink>
              <a
                v-else-if="c.external"
                :href="c.href || c.to"
                target="_blank"
                rel="noopener noreferrer"
                class="block py-1 text-gray-600 hover:text-bulsca-red text-base"
                @click="mobileOpen = false"
              >
                {{ c.label }}
              </a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

export interface NavLinkItem {
  label: string
  to?: string
  href?: string
  external?: boolean
  children?: NavLinkItem[]
}

const mobileOpen = ref(false)
const mobileOpenItems = reactive<Record<number, boolean>>({})

function toggleMobileItem(i: number) {
  mobileOpenItems[i] = !mobileOpenItems[i]
}

const isScrolled = ref(false)

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const links: NavLinkItem[] = [
  { label: 'Latest', to: '/latest' },
  {
    label: 'Competitions',
    to: '/competitions',
    children: [
      { label: 'Current League', to: '/competitions/league' },
      { label: 'Calendar', to: '/competitions/calendar' },
      { label: 'Champs', to: '/competitions/champs' },
    ],
  },
  {
    label: 'Get Involved',
    to: '/get-involved',
    children: [
      { label: 'Freshers', to: '/get-involved/freshers' },
      { label: 'Clubs', to: '/get-involved/clubs' },
      { label: 'Create a Club', to: '/get-involved/create-club' },
      { label: 'Committee', to: '/get-involved/committee' },
    ],
  },
  {
    label: 'Welfare',
    to: '/welfare',
    children: [
      { label: 'Home', to: '/welfare' },
      { label: 'Support and Reporting', to: '/welfare/help-and-reporting' },
      { label: 'Inclusion and Accessibility', to: '/welfare/inclusion-and-accessibility' },
    ],
  },
  {
    label: 'Resources',
    to: '/resources',
    children: [
      { label: 'All', to: '/resources' },
      { label: 'SERCs', to: '/resources/sercs' },
      { label: 'Casualties', to: '/resources/casualties' },
    ],
  },
  {
    label: 'About',
    to: '/about',
    children: [
      { label: 'About', to: '/about' },
      { label: 'Records', to: '/about/records' },
    ],
  },
  {
    label: 'Account',
    to: '/account',
    children: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Settings', to: '/settings' },
      { label: 'Admin', to: '/admin' },
    ],
  },
]

const route = useRoute()

function isActive(item: NavLinkItem) {
  if (item.external || !item.to) return false
  if (item.to === '/') return route.path === '/'
  return route.path.startsWith(item.to)
}

const navStyle = computed(() => (isScrolled.value ? 'nav-scrolled' : 'bg-transparent'))
</script>