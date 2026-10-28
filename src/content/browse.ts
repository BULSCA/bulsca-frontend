import type { CollectionEndpoint, DetailEndpoint } from '@/api/public'
import type { PublicLink } from '@/api/public/types'
export interface BrowsePage { title: string; intro: string; endpoint: CollectionEndpoint | DetailEndpoint; mode: 'collection' | 'detail'; links: PublicLink[]; search?: boolean }
const competitions = [{ label: 'Calendar', url: '/competitions/calendar' }, { label: 'League standings', url: '/competitions/league' }, { label: 'Championships', url: '/competitions/championships' }]
const involved = [{ label: 'Clubs', url: '/get-involved/clubs' }, { label: 'Current committee', url: '/get-involved/committee' }, { label: 'Previous committees', url: '/get-involved/previous-committees' }]
const resources = [{ label: 'Resource categories', url: '/resources' }, { label: 'Search resources', url: '/resources/search' }, { label: 'Forms', url: '/resources/forms' }, { label: 'SERCs', url: '/resources/sercs' }, { label: 'Casualties', url: '/resources/casualties' }]
export const browsePages: Record<string, BrowsePage> = {
  clubs: { title: 'University clubs', intro: 'Find a university lifesaving club and learn how to get involved.', endpoint: 'clubs', mode: 'collection', search: true, links: [...involved, { label: 'Start a club', url: '/get-involved/clubs/create' }] },
  club: { title: 'Club details', intro: 'Club information, training and useful links.', endpoint: 'club', mode: 'detail', links: involved },
  committees: { title: 'Previous committees', intro: 'Browse the volunteers who have supported BULSCA over the years.', endpoint: 'committees', mode: 'collection', links: involved },
  committee: { title: 'BULSCA committee', intro: 'Meet the people helping university lifesaving happen.', endpoint: 'committee', mode: 'detail', links: involved },
  member: { title: 'Committee member', intro: 'Learn about a committee role and its volunteer.', endpoint: 'member', mode: 'detail', links: involved },
  calendar: { title: 'Competition calendar', intro: 'Explore competition dates, hosts, locations and published results.', endpoint: 'competitions', mode: 'collection', search: true, links: competitions },
  competition: { title: 'Competition details', intro: 'Event information, published documents and results.', endpoint: 'competition', mode: 'detail', links: competitions },
  championships: { title: 'Championships', intro: 'Explore BULSCA championships and previous championship years.', endpoint: 'championships', mode: 'collection', links: competitions },
  championship: { title: 'Championship details', intro: 'Published championship information and resources. Historical entry forms and prices are archival information, not current offers.', endpoint: 'championship', mode: 'detail', links: [...competitions, ...['2026', '2025', '2024', '2023'].map(year => ({ label: `Championships ${year}`, url: `/competitions/championships/${year}` }))] },
  seasons: { title: 'Previous leagues', intro: 'Browse historical league seasons and their published standings.', endpoint: 'seasons', mode: 'collection', links: competitions },
  league: { title: 'League standings', intro: 'Season standings and the competitions contributing to the league.', endpoint: 'league', mode: 'detail', links: [...competitions, { label: 'Previous leagues', url: '/competitions/previous-leagues' }] },
  resources: { title: 'Resources', intro: 'Browse competition, governance and training resources.', endpoint: 'resource-pages', mode: 'collection', links: resources },
  'resource-search': { title: 'Search resources', intro: 'Find published documents by name or description.', endpoint: 'resources', mode: 'collection', search: true, links: resources },
  'resource-page': { title: 'Resource category', intro: 'Browse the documents and sections in this resource category.', endpoint: 'resource-page', mode: 'detail', links: resources },
  resource: { title: 'Document', intro: 'Document information and access. Some documents may require permission to download.', endpoint: 'resource', mode: 'detail', links: resources },
  sercs: { title: 'SERCs', intro: 'Search Simulated Emergency Response Competition scenarios and related training resources.', endpoint: 'sercs', mode: 'collection', search: true, links: resources },
  serc: { title: 'SERC details', intro: 'Scenario details, supporting resources and casualty information.', endpoint: 'serc', mode: 'detail', links: resources },
  casualties: { title: 'Casualties', intro: 'Browse casualty briefings and supporting training resources.', endpoint: 'casualties', mode: 'collection', search: true, links: resources },
  casualty: { title: 'Casualty details', intro: 'Casualty briefing and related SERC information.', endpoint: 'casualty', mode: 'detail', links: resources },
  social: { title: 'Community updates', intro: 'Updates from the university lifesaving community.', endpoint: 'social', mode: 'collection', links: [{ label: 'Latest news', url: '/latest' }, { label: 'Instagram', url: 'https://www.instagram.com/bulsca/' }] },
}
