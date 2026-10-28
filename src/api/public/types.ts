/** Generated from the backend OpenAPI contract. Runtime validators remain mandatory. */
export type { PublicKind, PublicLink, ContentSection, ContentTable, PublicEntry, PublicDocument, PublicCollection, DocumentResponse, AccessResponse, ContactConfig, ContactReceipt } from '../generated'
import type { ContactSubmission as WireContactSubmission } from '../generated'
/** Forms may be incomplete until verification; the server requires the token on submission. */
export type ContactSubmission = Omit<WireContactSubmission, 'cf-turnstile-response' | 'department'> & { department: string; 'cf-turnstile-response'?: string }
