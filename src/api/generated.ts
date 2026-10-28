// Generated from BULSCA/bulsca-site docs/api/openapi.json. Do not edit.
// Contract SHA-256: 62a1ef9e71e57edc94303fc9022e99fc25cd784cf9481cf7b4bf9072eb594315

export type Tag = { "id": number; "name": string; "slug": string }
export type Article = { "id": number; "slug": string; "title": string; "author": string | null; "excerpt": string; "pinned": boolean; "created_at": string | null; "updated_at": string | null; "views": number; "thumbs_up": number; "thumbs_down": number; "tags": Array<Tag> }
export type ArticleDetail = { "id": number; "slug": string; "title": string; "author": string | null; "excerpt": string; "pinned": boolean; "created_at": string | null; "updated_at": string | null; "views": number; "thumbs_up": number; "thumbs_down": number; "tags": Array<Tag>; "content": string }
export type ArticleList = { "data": { "pinned": Array<Article>; "articles": Array<Article> }; "meta": { "current_page": number; "last_page": number; "per_page": 8; "total": number }; "links": { "prev": string | null; "next": string | null } }
export type ArticleResponse = { "data": ArticleDetail }
export type ApiError = { "message": string; "code": string; "request_id": string; "errors"?: { [key: string]: Array<string> } }
export type ClientErrorReport = { "app": "public" | "portal"; "app_version": string; "event_id": string; "category": "network" | "server" | "invalid_response" | "component" | "route" | "unhandled"; "message": "Request failed" | "Unexpected interface error"; "route_template": string; "status"?: number | null; "request_id"?: string | null }
export type PublicKind = "clubs" | "competitions" | "committees" | "members" | "championships" | "seasons" | "resource-pages" | "resources" | "sercs" | "casualties" | "social"
export type PublicLink = { "label": string; "url": string }
export type ContentSection = { "heading": string; "paragraphs": Array<string>; "bullets"?: Array<string>; "html"?: string }
export type ContentTable = { "caption": string; "columns": Array<string>; "rows": Array<Array<string | number>> }
export type PublicEntry = { "id": string | number; "slug": string; "title": string; "kind": PublicKind; "summary"?: string; "date"?: string; "location"?: string; "image_url"?: string; "parent"?: string; "tags"?: Array<string>; "links"?: Array<PublicLink>; "results_link"?: PublicLink; "role_label"?: string; "role_order"?: number }
export type PublicDocument = { "id": string | number; "slug": string; "title": string; "kind": PublicKind; "summary"?: string; "date"?: string; "location"?: string; "image_url"?: string; "parent"?: string; "tags"?: Array<string>; "links"?: Array<PublicLink>; "results_link"?: PublicLink; "role_label"?: string; "role_order"?: number; "sections": Array<ContentSection>; "entries"?: Array<PublicEntry>; "table"?: ContentTable; "tables"?: Array<ContentTable>; "images"?: Array<PublicLink>; "downloadable"?: boolean; "role_sections"?: Array<ContentSection> }
export type PublicCollection = { "data": Array<PublicEntry>; "meta": { "current_page": number; "last_page": number; "total": number }; "stale"?: boolean; "filters"?: { "tags"?: Array<string>; "years"?: Array<number>; "locations"?: Array<string>; "groups"?: Array<{ "id": number; "name": string }> } }
export type DocumentResponse = { "data": PublicDocument }
export type AccessResponse = { "data": { "url": string; "filename"?: string; "expires_at"?: string | null } }
export type ContactConfig = { "data": { "turnstile_site_key": string | null; "accepts_submissions": boolean } }
export type ContactSubmission = { "name": string; "email": string; "department": "chair" | "secretary" | "treasurer" | "development" | "recruitment" | "data" | "championships" | "social" | "welfare" | "league" | "judges" | "general"; "subject": string; "message": string; "cf-turnstile-response": string }
export type ContactReceipt = { "data": { "message": string } }
export type PresentationConfig = { "version": string; "banner_pool": Array<{ "id": string; "url": string; "alt": string }>; "banner_overrides": { [key: string]: string }; "campaigns": Array<{ "id": string; "title": string; "description"?: string; "image_url": string; "order": number; "starts_at"?: string | null; "ends_at"?: string | null; "link"?: PublicLink }>; "championship_campaign"?: { "id": string; "title": string; "start_date": string; "end_date": string; "location": string; "colours": Array<string>; "logo_url"?: string | null; "link"?: PublicLink } }
export type PresentationResponse = { "data": PresentationConfig }
export type NoticeResponse = { "data": { "heading": string; "paragraphs": Array<string>; "bullets"?: Array<string>; "html"?: string } | null }
export type ArticleCounters = { "views": number; "thumbs_up": number; "thumbs_down": number }
export type ArticleInteractionResponse = { "data": ArticleCounters }
export type ArticleViewEvent = { "event_id": string }
export type ArticleRatingEvent = { "event_id": string; "type": "up" | "down" }
