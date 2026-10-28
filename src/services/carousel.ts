import type { CampaignSlide } from '@/api/presentation'
import type { PublicEntry, PublicLink } from '@/api/public/types'
import { bundledImages, freshersImage } from '@/content/presentation'
import { entryPath } from '@/utils/links'
import { londonDay } from '@/utils/dates'
export interface HeroSlide {
  id: string
  title: string
  description: string
  image: string
  link?: PublicLink
  type: 'competition' | 'campaign' | 'brand' | 'seasonal'
}
export function buildHeroSlides(
  campaigns: CampaignSlide[],
  highlights: PublicEntry[],
  now: Date,
): HeroSlide[] {
  const today = londonDay(now)
  const competition = highlights
    .filter(
      (item) =>
        item.kind === 'competitions' &&
        item.date &&
        Number.isFinite(Date.parse(item.date)) &&
        londonDay(new Date(item.date)) >= today,
    )
    .sort(
      (a, b) =>
        Date.parse(a.date!) - Date.parse(b.date!) || String(a.id).localeCompare(String(b.id)),
    )[0]
  const slides: HeroSlide[] = []
  if (competition) {
    const date = new Date(competition.date!)
    slides.push({
      id: `competition:${competition.id}`,
      title: competition.title,
      description: `${londonDay(date) === today ? 'Today' : 'Upcoming competition'} · ${new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', dateStyle: 'long' }).format(date)}${competition.location ? ` · ${competition.location}` : ''}`,
      image: competition.image_url || bundledImages[1]!.url,
      link: { label: 'Competition information', url: entryPath(competition) },
      type: 'competition',
    })
  }
  campaigns
    .filter(
      (campaign) =>
        (!campaign.starts_at || Date.parse(campaign.starts_at) <= now.getTime()) &&
        (!campaign.ends_at || Date.parse(campaign.ends_at) > now.getTime()),
    )
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .forEach((campaign) => {
      slides.push({
        id: `campaign:${campaign.id}`,
        title: campaign.title,
        description: campaign.description || '',
        image: campaign.image_url,
        link: campaign.link,
        type: 'campaign',
      })
    })
  slides.push(
    {
      id: 'brand-swimmer',
      title: 'University lifesaving, together',
      description: 'Swimming, first aid, teamwork and a welcoming community.',
      image: bundledImages[2]!.url,
      link: { label: 'Discover lifesaving', url: '/about' },
      type: 'brand',
    },
    {
      id: 'brand-clubs',
      title: 'By students, for students',
      description: 'Find your club, develop your skills and get involved.',
      image: bundledImages[0]!.url,
      link: { label: 'Find a club', url: '/get-involved/clubs' },
      type: 'brand',
    },
  )
  const month = Number(today.slice(5, 7))
  if (month >= 7 && month <= 11)
    slides.push({
      id: 'freshers',
      title: 'Hello freshers',
      description: 'Welcome to university lifesaving.',
      image: freshersImage,
      link: { label: 'Find my club and more', url: '/freshers' },
      type: 'seasonal',
    })
  return slides
}
