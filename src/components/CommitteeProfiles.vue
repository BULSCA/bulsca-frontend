<script setup lang="ts">
import { computed } from 'vue'
import type { PublicEntry } from '@/api/public/types'
import CommitteeProfileCard from './CommitteeProfileCard.vue'
const props = defineProps<{ members: PublicEntry[] }>()
const ordered = computed(() =>
  props.members
    .map((member, index) => ({ member, index }))
    .sort(
      (a, b) =>
        (a.member.role_order ?? Number.MAX_SAFE_INTEGER) -
          (b.member.role_order ?? Number.MAX_SAFE_INTEGER) || a.index - b.index,
    )
    .map((item) => item.member),
)
</script>
<template>
  <div class="committee-profiles">
    <CommitteeProfileCard v-for="member in ordered" :key="member.id" :member="member" />
  </div>
</template>
