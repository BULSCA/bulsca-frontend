/** Draft public-service DTOs. Consumers validate these before adapting them for display. */
export type PublicKind = 'clubs' | 'competitions' | 'committees' | 'members' | 'championships' | 'seasons' | 'resource-pages' | 'resources' | 'sercs' | 'casualties' | 'social'
export interface PublicLink { label: string; url: string }
export interface ContentSection { heading: string; paragraphs: string[]; bullets?: string[] }
export interface ContentTable { caption: string; columns: string[]; rows: Array<Array<string | number>> }
export interface PublicEntry {
  id: string | number
  slug: string
  title: string
  kind: PublicKind
  summary?: string
  date?: string
  location?: string
  image_url?: string
  parent?: string
  tags?: string[]
  links?: PublicLink[]
}
export interface PublicDocument extends PublicEntry {
  sections: ContentSection[]
  entries?: PublicEntry[]
  table?: ContentTable
  links?: PublicLink[]
  downloadable?: boolean
}
export interface PublicCollection {
  data: PublicEntry[]
  meta: { current_page: number; last_page: number; total: number }
}
export interface DocumentResponse { data: PublicDocument }
export interface AccessResponse { data: { url: string; filename?: string; expires_at?: string | null } }
export interface ContactConfig { data: { turnstile_site_key: string | null; accepts_submissions: boolean } }
export interface ContactSubmission { name: string; email: string; department: string; subject: string; message: string; 'cf-turnstile-response'?: string }
export interface ContactReceipt { data: { message: string } }
