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
