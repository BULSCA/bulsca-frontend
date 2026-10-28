<script setup lang="ts">
defineOptions({ name: 'SiteFooter' })
import MailingList from './footer/MailingList.vue'
import QuickLinks from './footer/QuickLinks.vue'
import SocialLinks from './footer/SocialLinks.vue'
import Copyright from './footer/Copyright.vue'
import { useReferrer } from '@/composables/useReferrer'
import type { LinkItem, SocialItem } from '@/types/footer'
import ContentContainer from './ContentContainer.vue'
import facebook from '@/assets/social/facebook.png'
import instagram from '@/assets/social/instagram.png'

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
  { label: 'Cookies', to: '/cookies' },
  { label: 'Terms', to: '/terms-of-service' },
  { label: 'Data deletion', to: '/data-deletion' },
  { label: 'Scoring.Events', href: `https://scoring.events?ref=${hostEncoded}`, external: true },
]

const defaultSocial: SocialItem[] = [
  { href: 'https://www.facebook.com/BULSCA/', imgSrc: facebook, alt: 'Facebook' },
  { href: 'https://www.instagram.com/bulsca', imgSrc: instagram, alt: 'Instagram' },
]

const quick = props.quickLinks ?? defaultQuick
const social = props.socialLinks ?? defaultSocial
</script>

<template>
  <footer class="site-footer">
    <ContentContainer>
      <div class="footer-grid">
        <MailingList :action="props.mailingAction" :placeholder="props.mailingPlaceholder" />
        <div class="footer-links">
          <QuickLinks :links="quick" />
          <SocialLinks :links="social" />
        </div>
      </div>
    </ContentContainer>
    <Copyright :year="props.year" />
  </footer>
</template>
