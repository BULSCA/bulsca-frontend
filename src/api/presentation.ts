import { safeHref } from '@/utils/links'
import { object } from './public/validation'
import { isCalendarDate } from '@/utils/dates'

export interface ChampionshipCampaign {
  id: string
  title: string
  start_date: string
  end_date: string
  location: string
  colours: [string, string]
  logo_url?: string | null
  link?: { label: string; url: string }
}

export interface PresentationImage {
  id: string
  url: string
  alt: string
}
export interface CampaignSlide {
  id: string
  title: string
  description?: string
  image_url: string
  link?: { label: string; url: string }
  order: number
  starts_at?: string | null
  ends_at?: string | null
}
export interface PresentationConfig {
  version: string
  banner_pool: PresentationImage[]
  banner_overrides: Record<string, string>
  campaigns: CampaignSlide[]
  championship_campaign?: ChampionshipCampaign
}
export function isChampionshipCampaign(value: unknown): value is ChampionshipCampaign {
  return (
    object(value) &&
    typeof value.id === 'string' &&
    /^[a-zA-Z0-9_-]{1,128}$/.test(value.id) &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    value.title.length <= 200 &&
    isCalendarDate(value.start_date) &&
    isCalendarDate(value.end_date) &&
    value.end_date >= value.start_date &&
    typeof value.location === 'string' &&
    value.location.trim().length > 0 &&
    value.location.length <= 500 &&
    Array.isArray(value.colours) &&
    value.colours.length === 2 &&
    value.colours.every((colour) => typeof colour === 'string' && /^#[0-9a-f]{6}$/i.test(colour)) &&
    (value.logo_url === undefined || value.logo_url === null || publicImageUrl(value.logo_url)) &&
    (value.link === undefined ||
      (object(value.link) &&
        typeof value.link.label === 'string' &&
        !!value.link.label.trim() &&
        typeof value.link.url === 'string' &&
        !!safeHref(value.link.url)))
  )
}
export function publicImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !safeHref(value)) return false
  return value.startsWith('/') || /^https?:\/\//i.test(value)
}
export function isPresentationImage(value: unknown): value is PresentationImage {
  return (
    object(value) &&
    typeof value.id === 'string' &&
    /^[a-zA-Z0-9_-]{1,128}$/.test(value.id) &&
    publicImageUrl(value.url) &&
    typeof value.alt === 'string' &&
    value.alt.length <= 500
  )
}
function dateValid(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T/.test(value) &&
      Number.isFinite(Date.parse(value)))
  )
}
export function isCampaign(value: unknown): value is CampaignSlide {
  if (!object(value)) return false
  return (
    typeof value.id === 'string' &&
    /^[a-zA-Z0-9_-]{1,128}$/.test(value.id) &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    value.title.length <= 200 &&
    (value.description === undefined ||
      (typeof value.description === 'string' && value.description.length <= 1000)) &&
    publicImageUrl(value.image_url) &&
    typeof value.order === 'number' &&
    Number.isFinite(value.order) &&
    dateValid(value.starts_at) &&
    dateValid(value.ends_at) &&
    !(
      typeof value.starts_at === 'string' &&
      typeof value.ends_at === 'string' &&
      Date.parse(value.ends_at) <= Date.parse(value.starts_at)
    ) &&
    (value.link === undefined ||
      (object(value.link) &&
        typeof value.link.label === 'string' &&
        value.link.label.trim().length > 0 &&
        typeof value.link.url === 'string' &&
        !!safeHref(value.link.url)))
  )
}
/** Invalid individual images/campaigns are omitted; malformed top-level contracts fail closed. */
export function parsePresentation(value: unknown): PresentationConfig | null {
  if (!object(value) || !object(value.data)) return null
  const data = value.data
  if (
    typeof data.version !== 'string' ||
    !Array.isArray(data.banner_pool) ||
    !object(data.banner_overrides) ||
    !Array.isArray(data.campaigns)
  )
    return null
  const imageIds = new Set<string>()
  const banner_pool = data.banner_pool.filter(isPresentationImage).filter((image) => {
    if (imageIds.has(image.id)) return false
    imageIds.add(image.id)
    return true
  })
  const banner_overrides = Object.fromEntries(
    Object.entries(data.banner_overrides).filter(
      ([path, id]) =>
        path.startsWith('/') &&
        !/[?#]/.test(path) &&
        !!safeHref(path) &&
        typeof id === 'string' &&
        imageIds.has(id),
    ),
  ) as Record<string, string>
  const campaignIds = new Set<string>()
  const campaigns = data.campaigns.filter(isCampaign).filter((campaign) => {
    if (campaignIds.has(campaign.id)) return false
    campaignIds.add(campaign.id)
    return true
  })
  return {
    version: data.version,
    banner_pool,
    banner_overrides,
    campaigns,
    ...(isChampionshipCampaign(data.championship_campaign)
      ? { championship_campaign: data.championship_campaign }
      : {}),
  }
}
export const isPresentationEnvelope = (value: unknown): value is { data: unknown } =>
  parsePresentation(value) !== null
