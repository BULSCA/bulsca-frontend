<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, watchEffect } from 'vue'
import type { PublicEntry } from '@/api/public/types'
import { presentation } from '@/services/presentation'
import { buildHeroSlides } from '@/services/carousel'
import { bundledImages } from '@/content/presentation'
import { publicImageUrl } from '@/api/presentation'
import logo from '@/assets/blogo.png'
import SafeLink from './SafeLink.vue'
const props = defineProps<{ highlights: PublicEntry[] }>()
const now = ref(Date.now())
const slides = computed(() =>
  buildHeroSlides(presentation.config.value.campaigns, props.highlights, new Date(now.value)),
)
const activeId = ref(slides.value[0]!.id)
const index = computed(() =>
  Math.max(
    0,
    slides.value.findIndex((slide) => slide.id === activeId.value),
  ),
)
const active = computed(() => slides.value[index.value]!)
const manualPause = ref(false)
const hovered = ref(false)
const focused = ref(false)
const hidden = ref(false)
const reducedMotion = ref(false)
const playing = computed(
  () =>
    !manualPause.value && !hovered.value && !focused.value && !hidden.value && !reducedMotion.value,
)
const failedImages = shallowRef(new Set<string>())
const image = computed(() => {
  if (publicImageUrl(active.value.image) && !failedImages.value.has(active.value.image))
    return active.value.image
  return bundledImages.find((photo) => !failedImages.value.has(photo.url))?.url || null
})
let rotation: ReturnType<typeof setTimeout> | undefined
let clock: ReturnType<typeof setInterval> | undefined
let media: MediaQueryList | undefined
watch(slides, (next) => {
  if (!next.some((slide) => slide.id === activeId.value)) activeId.value = next[0]!.id
})
function select(value: number, manual = true) {
  activeId.value = slides.value[(value + slides.value.length) % slides.value.length]!.id
  if (manual) manualPause.value = true
}
watchEffect(() => {
  clearTimeout(rotation)
  const current = index.value
  if (playing.value && slides.value.length > 1)
    rotation = setTimeout(() => select(current + 1, false), 6000)
})
function failed() {
  if (image.value) failedImages.value = new Set([...failedImages.value, image.value])
}
function visibility() {
  hidden.value = document.visibilityState === 'hidden'
  now.value = Date.now()
}
function motion() {
  reducedMotion.value = media?.matches || false
}
function focusOut(event: FocusEvent) {
  if (
    !(event.currentTarget instanceof HTMLElement) ||
    !(event.relatedTarget instanceof Node) ||
    !event.currentTarget.contains(event.relatedTarget)
  )
    focused.value = false
}
function keyboard(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    select(index.value - 1)
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    select(index.value + 1)
  }
}
onMounted(() => {
  void presentation.ensure()
  if (typeof window.matchMedia === 'function') {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    motion()
    media.addEventListener('change', motion)
  }
  visibility()
  document.addEventListener('visibilitychange', visibility)
  clock = setInterval(() => {
    now.value = Date.now()
  }, 60_000)
})
onBeforeUnmount(() => {
  clearTimeout(rotation)
  clearInterval(clock)
  media?.removeEventListener('change', motion)
  document.removeEventListener('visibilitychange', visibility)
})
</script>
<template>
  <section
    class="home-carousel"
    role="region"
    aria-roledescription="carousel"
    aria-label="Featured BULSCA updates"
    tabindex="0"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="focusOut"
    @keydown="keyboard"
  >
    <img
      v-if="image"
      :key="image"
      class="hero-photo"
      :src="image"
      alt=""
      aria-hidden="true"
      fetchpriority="high"
      @error="failed"
    />
    <div class="hero-shade" />
    <div
      class="carousel-slide"
      role="group"
      aria-roledescription="slide"
      :aria-label="`Slide ${index + 1} of ${slides.length}`"
      :aria-live="playing ? 'off' : 'polite'"
      :data-slide-id="active.id"
    >
      <img v-if="active.type === 'brand'" class="carousel-logo" :src="logo" alt="BULSCA" />
      <p class="carousel-title">{{ active.title }}</p>
      <p v-if="active.description" class="carousel-description">{{ active.description }}</p>
      <SafeLink v-if="active.link" class="carousel-link" :to="active.link.url">{{
        active.link.label
      }}</SafeLink>
    </div>
    <div class="carousel-controls" aria-label="Slideshow controls">
      <button type="button" aria-label="Previous slide" @click="select(index - 1)">‹</button>
      <div class="carousel-dots">
        <button
          v-for="(slide, i) in slides"
          :key="slide.id"
          type="button"
          :aria-label="`Show slide ${i + 1}: ${slide.title}`"
          :aria-current="i === index ? 'true' : undefined"
          @click="select(i)"
        >
          <span aria-hidden="true">●</span>
        </button>
      </div>
      <button type="button" aria-label="Next slide" @click="select(index + 1)">›</button>
      <button
        type="button"
        class="carousel-play"
        :disabled="reducedMotion"
        :aria-label="
          reducedMotion
            ? 'Automatic rotation disabled for reduced motion'
            : manualPause
              ? 'Play slideshow'
              : 'Pause slideshow'
        "
        @click="manualPause = !manualPause"
      >
        {{ reducedMotion ? 'Manual slides' : manualPause ? 'Play' : 'Pause' }}
      </button>
    </div>
  </section>
</template>
