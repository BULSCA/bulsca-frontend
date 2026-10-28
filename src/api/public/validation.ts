import type { AccessResponse, ContactConfig, ContactReceipt, ContentSection, ContentTable, DocumentResponse, PublicCollection, PublicDocument, PublicEntry, PublicLink } from './types'
export const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')
const kinds = ['clubs', 'competitions', 'committees', 'members', 'championships', 'seasons', 'resource-pages', 'resources', 'sercs', 'casualties', 'social']
export const isLink = (v: unknown): v is PublicLink => object(v) && typeof v.label === 'string' && typeof v.url === 'string'
export function isEntry(v: unknown): v is PublicEntry {
  return object(v) && (typeof v.id === 'string' || typeof v.id === 'number') && typeof v.slug === 'string'
    && typeof v.title === 'string' && kinds.includes(String(v.kind))
    && ['summary', 'date', 'location', 'image_url', 'parent'].every(key => v[key] === undefined || typeof v[key] === 'string')
    && (v.tags === undefined || strings(v.tags)) && (v.links === undefined || (Array.isArray(v.links) && v.links.every(isLink)))
}
export function isSection(v: unknown): v is ContentSection {
  return object(v) && typeof v.heading === 'string' && strings(v.paragraphs) && (v.bullets === undefined || strings(v.bullets))
}
export function isTable(v: unknown): v is ContentTable {
  return object(v) && typeof v.caption === 'string' && strings(v.columns) && Array.isArray(v.rows)
    && v.rows.every(row => Array.isArray(row) && row.length === (v.columns as string[]).length && row.every(cell => typeof cell === 'string' || (typeof cell === 'number' && Number.isFinite(cell))))
}
export function isDocument(v: unknown): v is PublicDocument {
  if (!object(v)) return false
  const { sections, entries, table, downloadable } = v
  return isEntry(v) && Array.isArray(sections) && sections.every(isSection)
    && (entries === undefined || (Array.isArray(entries) && entries.every(isEntry)))
    && (table === undefined || isTable(table)) && (downloadable === undefined || typeof downloadable === 'boolean')
}
export function isCollection(v: unknown): v is PublicCollection {
  if (!object(v) || !object(v.meta)) return false
  const meta = v.meta
  return Array.isArray(v.data) && v.data.every(isEntry)
    && ['current_page', 'last_page', 'total'].every(key => typeof meta[key] === 'number' && Number.isSafeInteger(meta[key]))
    && Number(meta.current_page) >= 1 && Number(meta.last_page) >= 1 && Number(meta.total) >= 0
}
export const isDocumentResponse = (v: unknown): v is DocumentResponse => object(v) && isDocument(v.data)
export const isAccess = (v: unknown): v is AccessResponse => object(v) && object(v.data) && typeof v.data.url === 'string'
  && (v.data.filename === undefined || typeof v.data.filename === 'string')
  && (v.data.expires_at === undefined || v.data.expires_at === null || typeof v.data.expires_at === 'string')
export const isContactConfig = (v: unknown): v is ContactConfig => object(v) && object(v.data)
  && (v.data.turnstile_site_key === null || typeof v.data.turnstile_site_key === 'string') && typeof v.data.accepts_submissions === 'boolean'
export const isReceipt = (v: unknown): v is ContactReceipt => object(v) && object(v.data) && typeof v.data.message === 'string'
