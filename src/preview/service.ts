import { ApiFailure } from '@/api/errors'
import type { PublicCollection, PublicDocument, PublicEntry } from '@/api/public/types'
import * as data from './data'
import { previewPresentation } from '@/content/presentation'

function find(entries: PublicEntry[], slug: string) {
  const found = entries.find(item => item.slug === slug || String(item.id) === slug)
  if (!found) throw new ApiFailure('not_found', 'This sample record could not be found.', 404)
  return found
}
function collection(entries: PublicEntry[], query: Record<string, string>): PublicCollection {
  const q = (query.q || '').toLowerCase()
  const filtered = entries.filter(item => (!q || `${item.title} ${item.summary || ''}`.toLowerCase().includes(q))
    && (!query.tag || item.tags?.includes(query.tag)))
  const page = Math.max(1, Number(query.page) || 1)
  return { data: filtered.slice((page - 1) * 6, page * 6), meta: { current_page: page, last_page: Math.max(1, Math.ceil(filtered.length / 6)), total: filtered.length } }
}
export function previewResponse(endpoint: string, params: Record<string, string>, query: Record<string, string>): unknown {
  const directories: Record<string, PublicEntry[]> = {
    highlights: data.competitions, social: data.social, clubs: data.clubs, committees: data.committees,
    competitions: data.competitions, championships: data.championships, seasons: data.seasons,
    'resource-pages': data.resourcePages, resources: data.resources, sercs: data.sercs, casualties: data.casualties,
  }
  if (directories[endpoint]) return collection(directories[endpoint], query)
  const season = params.season === 'current' ? '2026-27' : params.season || '2026-27'
  let item: PublicDocument
  switch (endpoint) {
    case 'presentation': return { data: previewPresentation }
    case 'club': item = data.document(find(data.clubs, params.slug!), { entries: data.competitions, links: [{ label: 'Contact this sample club', url: '/contact-form?department=recruitment' }] }); break
    case 'committee': item = data.document(find(data.committees, season), { sections: [], entries: data.members(season) }); break
    case 'member': find(data.committees, season); item = data.document(find(data.members(season), params.slug!), {
      sections: [{ heading: '', paragraphs: ['This is a fictional committee profile for exploring the website. Real member biographies will be supplied by the public API.'] }],
      role_sections: [{ heading: 'About this sample role', paragraphs: ['This sample demonstrates where the published role description will appear. It is not a statement about a real committee member.'] }],
      links: [{ label: 'Contact the committee', url: '/contact' }],
    }); break
    case 'competition': item = data.document(find(data.competitions, params.slug!), { entries: data.resources, links: [{ label: 'League standings', url: '/competitions/league' }, { label: 'Scoring.events', url: 'https://scoring.events' }] }); break
    case 'championship': item = data.document(find(data.championships, params.year!), { entries: data.resources }); break
    case 'league': item = data.document(find(data.seasons, season), { entries: data.competitions,
      table: { caption: 'Sample league standings', columns: ['Position', 'Club', 'Competitions', 'Points'], rows: [[1, 'Example University', 2, 20], [2, 'Coastal University', 2, 18]] } }); break
    case 'resource-page': item = data.document(find(data.resourcePages, params.slug!), { entries: data.resources }); break
    case 'resource': item = data.document(find(data.resources, params.id!), { downloadable: true }); break
    case 'serc': item = data.document(find(data.sercs, params.slug!), { entries: [...data.casualties, ...data.resources] }); break
    case 'casualty': item = data.document(find(data.casualties, params.slug!), { entries: data.sercs }); break
    case 'resource-access': find(data.resources, params.id!); return { data: { url: '/preview/sample-resource.txt', filename: 'bulsca-preview-resource.txt', expires_at: null } }
    case 'contact-config': return { data: { turnstile_site_key: null, accepts_submissions: true } }
    default: throw new ApiFailure('not_found', 'This preview is not available.', 404)
  }
  return { data: item }
}
