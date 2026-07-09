<template>
  <div :id="props.snowContainer ? 'page-banner' : undefined" :data-snow-container="props.snowContainer || undefined" :class="[props.height, 'w-screen bg-gray-100 overflow-hidden']">
    <div class="h-full w-full overflow-hidden relative">
      <div
        class="absolute top-0 right-0 w-full h-full head-bg-3 flex items-center justify-center"
        :style="props.backgroundImage
          ? {
              backgroundImage: `linear-gradient(${props.backgroundOverlay}, ${props.backgroundOverlay}), url('${props.backgroundImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}"
      >
        <img v-if="props.logo" :src="props.logo" class="w-[10%] hidden md:block" alt="Logo" />
        <div class="md:border-l-2 border-white md:ml-12 md:pl-12 py-8">
          <h2 class="md:text-6xl text-4xl font-bold text-white">{{ props.title }}</h2>
          <p v-if="props.subtitle" class="text-white">{{ props.subtitle }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    logo?: string
    height?: string
    snowContainer?: boolean
    backgroundImage?: string | null
    backgroundOverlay?: string
  }>(),
  {
    title: '',
    subtitle: '',
    logo: '@/assets/blogo.png',
    height: 'h-[40vh]',
    snowContainer: false,
    backgroundImage: null,
    backgroundOverlay: 'rgba(0, 0, 0, 0)',
  }
)
</script>