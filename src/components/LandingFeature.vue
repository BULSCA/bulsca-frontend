<template>
  <div :class="['flex flex-col md:flex-row items-center justify-center md:space-x-12 space-y-6 md:space-y-0 text-center md:text-left w-full', reversed ? 'md:flex-row-reverse' : '']">
    <div class="h-16 w-16 flex-shrink-0" aria-hidden="true">
      <slot name="icon">
        <!-- default icon (simple placeholder) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </slot>
    </div>

    <div class="flex flex-col max-w-3xl">
      <h2 class="text-2xl font-semibold">{{ title }}</h2>
      <p v-if="text" class="mt-1" v-html="text"></p>
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  text?: string
  reversed?: boolean
}>()

const { title, text, reversed = false } = props
</script>