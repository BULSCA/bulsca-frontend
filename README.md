# BULSCA public frontend

Vue 3, Vite and TypeScript public website. The separate member/management portal is linked from account and management URLs.

## Browse without backend services

With dependencies installed, start the preview-data mode:

```sh
npm run dev:preview
```

The persistent preview banner identifies fictional clubs, people, competitions and results. Preview contact submissions and newsletter signups send nothing. A bundled text attachment demonstrates document access. Historical championship text and records tables are copied from the existing website and labelled as source/archival content.

Preview mode is explicit: `VITE_PUBLIC_DATA_MODE=preview`. Live mode never falls back to sample data when services fail. Vite environment values are set when starting the dev server or building assets; restart after changing them. Do not publish preview mode as if it contains real data.

## Live integration

Copy `.env.example` to `.env.local` as needed:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_PUBLIC_DATA_MODE` | `live` | Use `preview` only to explore sample data |
| `VITE_WEBSITE_API_URL` | `/api/v1` | Website content, clubs, committee, resources and contact |
| `VITE_COMPETITION_API_URL` | `/api/v1` | Competition service, seasons and standings |
| `VITE_PORTAL_URL` | `https://portal.bulsca.co.uk` | Explicit account/management handoff |

```sh
npm run dev
```

The existing development proxy sends relative `/api` and `/storage` requests to `http://127.0.0.1:8000`. A separate competition API can use its own URL and must allow the frontend origin. No browser API keys or private storage credentials belong in Vite environment variables.

The draft endpoint catalogue is `src/api/public/contract.json`, DTOs are in `src/api/public/types.ts`, and runtime validation is in `src/api/public/validation.ts`. New endpoints are **consumers prepared for future service implementation**, not a claim that those backend endpoints already exist. The article API retains its previously generated backend contract.

Directory endpoints accept `q`, `tag` and `page` and return `{ data: PublicEntry[], meta: { current_page, last_page, total } }`. Detail endpoints return `{ data: PublicDocument }`, containing structured text sections, optional tables, related entries and safe links. Plain text is rendered as text, not arbitrary HTML. Article detail HTML continues to require the existing backend allowlist sanitizer.

Document access uses metadata and an access-link response `{ data: { url, filename?, expires_at? } }`. The URL can point to public or signed object storage; no local Laravel file path is assumed. Access failures and expired links leave the surrounding page usable.

Contact configuration supplies `accepts_submissions` and `turnstile_site_key`. Live submission requires available configuration and a verified Turnstile token; the backend must validate that token. POST fields match the existing form (`name`, `email`, `department`, `subject`, `message`, `cf-turnstile-response`). Failed or uncertain sends preserve the in-memory draft and are never retried automatically. Department email links remain available if verification or the contact API is down.

## Carousel and page photos

The homepage carousel shares one highlights request with the competition cards. It offers the nearest current/upcoming competition, active campaign slides, permanent BULSCA slides and a July–November freshers slide. Rotation runs every six seconds, pauses on hover/focus or hidden tabs, and stays paused after manual navigation until Play is selected. Reduced-motion preferences disable automatic rotation. Bundled photos and permanent slides remain usable when services fail.

Every other public page has a photo banner and one page heading. Page photos are chosen randomly from a global pool, with optional fixed-image overrides by canonical page path. Choices are stored per tab session, ignoring query strings and fragments, and reused on return visits and refreshes while the selected image remains in the pool. Blocked storage falls back to memory. Broken photos advance through other available images, then bundled photos, then a readable solid background.

The prepared website endpoint is `GET /api/v1/presentation` (relative to `VITE_WEBSITE_API_URL`):

```json
{
  "data": {
    "version": "2026-10-28-1",
    "banner_pool": [
      { "id": "pool-team", "url": "https://images.example.test/pool-team-v1.jpg", "alt": "University lifesaving team" },
      { "id": "welfare", "url": "https://images.example.test/welfare-v1.jpg", "alt": "Welfare support" }
    ],
    "banner_overrides": { "/welfare": "welfare" },
    "campaigns": [
      {
        "id": "volunteers",
        "title": "Volunteer with BULSCA",
        "description": "Help support university lifesaving.",
        "image_url": "https://images.example.test/volunteers-v1.jpg",
        "link": { "label": "Get involved", "url": "/get-involved" },
        "order": 1,
        "starts_at": "2026-10-01T00:00:00Z",
        "ends_at": "2026-12-01T00:00:00Z"
      }
    ]
  }
}
```

Use unique stable IDs and public HTTP(S) or root-relative image URLs. Override values reference IDs in the pool. Campaign description, link and schedule bounds are optional; dates should include their timezone. Campaigns are ordered by ascending `order`, then ID, and their end time is exclusive. The backend should return only published content. Invalid individual entries are ignored; a malformed envelope leaves the cached/bundled configuration intact.

Configuration and selected image metadata are cached in namespaced `sessionStorage`, separated between preview and live modes. Cached configuration renders immediately and refreshes once per app session. A background refresh does not swap a currently displayed page banner; the refreshed pool is applied on later navigation or page reload. Image bytes use normal browser/CDN caching: serve stable, versioned asset URLs with suitable `Cache-Control` headers. Changing the content should change the URL. Session metadata alone does not prevent network revalidation or downloads.

Preview mode includes a sample campaign and a fixed welfare photo. The backend endpoint, image storage/CDN setup and portal editing controls are future integration work; this change implements their frontend consumer and response contract.

## Verification

```sh
npm run test:run
npm run lint:check
node_modules/.bin/vue-tsc --noEmit -p tsconfig.app.json
node_modules/.bin/vue-tsc --noEmit -p tsconfig.vitest.json
node_modules/.bin/vue-tsc --noEmit -p tsconfig.node.json
```

Tests mount the full application with memory routing, traverse public routes and preview records, and exercise unavailable services, consumers, contact forms, document access and recovery. They make no calls to real external services. Deployment and production acceptance are separate user-owned checks.

Unknown routes have a dedicated not-found screen. Missing APIs retain page headings, related navigation and recovery messages. Unavailable optional widgets do not hide static content. Legal information that was absent from the source has an explicit unavailable notice instead of invented policy text.
