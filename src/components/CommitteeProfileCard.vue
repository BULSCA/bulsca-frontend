<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PublicEntry } from '@/api/public/types'
import { publicImageUrl } from '@/api/presentation'
import { entryPath } from '@/utils/links'
import logo from '@/assets/blogo.png'
import SafeLink from './SafeLink.vue'
const props = withDefaults(defineProps<{ member: PublicEntry; linked?: boolean }>(), {
  linked: true,
})
const photoFailed = ref(false)
const logoFailed = ref(false)
watch(
  () => props.member.image_url,
  () => {
    photoFailed.value = false
    logoFailed.value = false
  },
)
const portrait = computed(() =>
  publicImageUrl(props.member.image_url) && !photoFailed.value
    ? props.member.image_url
    : !logoFailed.value
      ? logo
      : null,
)
const role = computed(() => props.member.role_label || props.member.tags?.[0] || 'Committee member')
const initials = computed(() =>
  props.member.title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join(''),
)
function failed() {
  if (portrait.value === logo) {
    photoFailed.value = true
    logoFailed.value = true
  } else photoFailed.value = true
}
</script>
<template>
  <component
    :is="linked ? SafeLink : 'article'"
    v-bind="linked ? { to: entryPath(member) } : {}"
    class="committee-profile-card"
  >
    <div class="committee-portrait">
      <img
        v-if="portrait"
        :key="portrait"
        :src="portrait"
        alt=""
        loading="lazy"
        @error="failed"
      /><span v-else aria-hidden="true">{{ initials }}</span>
    </div>
    <component :is="linked ? 'h3' : 'h2'" class="committee-profile-name">{{
      member.title
    }}</component>
    <div class="committee-role">{{ role }}</div>
  </component>
</template>
