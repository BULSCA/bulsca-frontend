<script setup lang="ts">
import MailingList from './footer/MailingList.vue'
import QuickLinks from './footer/QuickLinks.vue'
import SocialLinks from './footer/SocialLinks.vue'
import Copyright from './footer/Copyright.vue'
import { useReferrer } from '@/composables/useReferrer'
import type { LinkItem, SocialItem } from '@/types/footer'

const props = defineProps<{
  quickLinks?: LinkItem[]
  socialLinks?: SocialItem[]
  mailingAction?: string
  mailingPlaceholder?: string
  year?: number
}>()

const { hostEncoded } = useReferrer()

const defaultQuick: LinkItem[] = [
  { label: 'Contact', to: '/contact' },
  { label: 'Welfare', to: '/welfare' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Scoring.Events', href: `https://scoring.events?ref=${hostEncoded}`, external: true }
]

const defaultSocial: SocialItem[] = [
  { href: 'https://www.facebook.com/BULSCA/', imgSrc: '/storage/logo/f_logo_RGB-Blue_1024.png', alt: 'Facebook' },
  { href: 'https://www.instagram.com/bulsca', imgSrc: '/storage/logo/Instagram_Glyph_Gradient_RGB.png', alt: 'Instagram' }
]

const quick = props.quickLinks ?? defaultQuick
const social = props.socialLinks ?? defaultSocial
</script>

<template>
  <div class="bg-bulsca-blue">
    <div class="w-full container-responsive">
      <div class="flex flex-col md:flex-row gap-8 items-stretch md:items-start mx-2">
        <div class="md:flex-[2] p-6">
          <MailingList :action="props.mailingAction" :placeholder="props.mailingPlaceholder" />
        </div>
        <div class="flex flex-col items-center justify-center md:flex-[1] flex-1 border-0 text-center">
          <QuickLinks :links="quick" />
          <SocialLinks :links="social" />
        </div>
      </div>
    </div>
    <Copyright :year="props.year" />
  </div>
</template>