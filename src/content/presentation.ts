import pool from '@/assets/photos/pool-team.jpg'
import competition from '@/assets/photos/competition.jpg'
import swimmer from '@/assets/photos/manikin-swimmer.jpg'
import freshers from '@/assets/photos/freshers.jpg'
import welfare from '@/assets/photos/welfare.png'
import type { PresentationConfig, PresentationImage } from '@/api/presentation'

export const bundledImages: PresentationImage[] = [
  { id: 'bundled-pool', url: pool, alt: 'University lifesavers beside the pool' },
  { id: 'bundled-competition', url: competition, alt: 'University lifesaving competition' },
  { id: 'bundled-swimmer', url: swimmer, alt: 'Lifesaving manikin training in the pool' },
]
export const freshersImage = freshers
export const previewPresentation: PresentationConfig = {
  version: 'preview-1',
  banner_pool: [
    ...bundledImages,
    { id: 'preview-welfare', url: welfare, alt: 'Welfare and inclusion at university lifesaving' },
  ],
  banner_overrides: { '/welfare': 'preview-welfare' },
  championship_campaign: {
    id: 'preview-champs-2027',
    title: 'Champs 2027',
    start_date: '2027-03-06',
    end_date: '2027-03-07',
    location: 'Alan Higgs Centre, Coventry',
    colours: ['#070660', '#9e0d06'],
    link: { label: 'Explore the Championships', url: '/competitions/championships' },
  },
  campaigns: [
    {
      id: 'preview-volunteers',
      title: 'Make a difference in university lifesaving',
      description:
        'Sample campaign: discover ways to volunteer with your club and at competitions.',
      image_url: competition,
      link: { label: 'Get involved', url: '/get-involved' },
      order: 1,
    },
  ],
}
export const fallbackPresentation: PresentationConfig = {
  version: 'bundled-1',
  banner_pool: bundledImages,
  banner_overrides: {},
  campaigns: [],
}
