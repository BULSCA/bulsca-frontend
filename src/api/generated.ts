// Generated from BULSCA/bulsca-site docs/api/openapi.json. Do not edit.
// Contract SHA-256: ee923c0d7d408e2b34dd48d966319bb78855e473ec931917691f76054eddb0d1

export type Tag = { "id": number; "name": string; "slug": string }
export type Article = { "id": number; "slug": string; "title": string; "author": string | null; "excerpt": string; "pinned": boolean; "created_at": string | null; "updated_at": string | null; "views": number; "thumbs_up": number; "thumbs_down": number; "tags": Array<Tag> }
export type ArticleDetail = { "id": number; "slug": string; "title": string; "author": string | null; "excerpt": string; "pinned": boolean; "created_at": string | null; "updated_at": string | null; "views": number; "thumbs_up": number; "thumbs_down": number; "tags": Array<Tag>; "content": string }
export type ArticleList = { "data": { "pinned": Array<Article>; "articles": Array<Article> }; "meta": { "current_page": number; "last_page": number; "per_page": 8; "total": number }; "links": { "prev": string | null; "next": string | null } }
export type ArticleResponse = { "data": ArticleDetail }
export type ApiError = { "message": string; "code": string; "request_id": string; "errors"?: { [key: string]: Array<string> } }
export type ClientErrorReport = { "app": "public" | "portal"; "app_version": string; "event_id": string; "category": "network" | "server" | "invalid_response" | "component" | "route" | "unhandled"; "message": "Request failed" | "Unexpected interface error"; "route_template": string; "status"?: number | null; "request_id"?: string | null }
