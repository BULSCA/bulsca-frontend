<script setup lang="ts">
const props = defineProps<{
  year?: number
}>()

const year = props.year ?? new Date().getFullYear()
</script>

<template>
  <div class="w-full text-center text-sm text-white p-4 flex items-center justify-center">
    <span>&copy; {{ year }} British Universities Lifesaving Clubs' Association</span>
  </div>
</template>