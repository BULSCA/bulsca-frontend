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

The endpoint catalogue is `src/api/public/contract.json`; backend `docs/api/openapi.json` owns the contract and generates `src/api/generated.ts`. Public DTOs are re-exported from `src/api/public/types.ts`, with runtime validation in `validation.ts`. The paired public API implementation is in the Laravel repository. Both API base URLs point to that backend for the first public release.

Directory endpoints accept `q`, `tag` and `page` and return `{ data: PublicEntry[], meta: { current_page, last_page, total } }`. Detail endpoints return `{ data: PublicDocument }`, containing structured text sections, optional tables, related entries and safe links. Plain text is rendered as text. Optional rich section HTML, including club/member biographies and notices, comes exclusively from the versioned backend allowlist sanitizer, as article HTML already does. Malformed rich blocks/tables are rejected. League responses can supply multiple A/B/historical overall tables; casualty details can supply a safe media gallery.

Competition entries can include `results_link: { label, url }` for a published result destination. This may be a public result service or a resource detail page that prepares document access. Missing links keep the date-based status visible; tags never imply that results exist. Competition cards use London calendar dates for countdowns and update while the page remains open. Existing entry responses without this optional field remain supported.

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

### Full-width championship campaign

The same presentation response can optionally include `data.championship_campaign`:

```json
{
  "id": "champs-2027",
  "title": "Champs 2027",
  "start_date": "2027-03-06",
  "end_date": "2027-03-07",
  "location": "Alan Higgs Centre, Coventry",
  "colours": ["#070660", "#9e0d06"],
  "logo_url": null,
  "link": { "label": "Explore the Championships", "url": "/competitions/championships" }
}
```

This renders below the homepage highlights as a full-width striped campaign band, separate from carousel slides. `logo_url` and `link` are optional. Without artwork, the title acts as the identity panel; broken logos fall back to the title. Colours must be two six-digit hex values. Dates must be real ISO calendar dates with the end on or after the start; they describe the event, not the publication window. The API controls publication by returning, omitting or setting this field to `null`. Invalid championship data is omitted without losing the remaining presentation configuration.

Preview always supplies the legacy Champs 2027 announcement through the presentation consumer, including its dates and venue, for layout demonstration. Live mode uses only API/cached campaign data. The existing metadata cache also retains valid championship data while the API is unavailable; a successful response without the field removes it. No extra request is made for this band.

## Shared public layouts

`PageLayout` supplies the page banner and a constrained content body by default. Use `full-width` when composing a page from full-width sections; each `PageSection` still aligns its content through `ContentContainer`. The homepage demonstrates this composition. Keep one H1 per page; section headings use H2 and directory cards use H3.

```vue
<PageLayout title="A new section" full-width>
  <PageSection title="Get involved" tone="soft">
    <IconTextRow title="Help your community" icon="people">
      <p>Section content goes here.</p>
    </IconTextRow>
  </PageSection>
</PageLayout>
```

Use `PageSection` tones `plain`, `soft` or `brand`; `IconTextRow` supports alternating desktop placement with `reverse`. `NavigationTile` provides a large link with optional photo and a gradient fallback. `CardFrame` separates its content slot from an optional `footer` action slot. `PublicCards` selects the competition template, section-navigation tiles or standard record frame according to the entry kind. These components are shared by directories, details, articles and contact cards, while informational text uses `ContentSections` and records/standings use `PublicTable`.

Shared visual tokens and component styles live in `src/assets/css/shared.css`. Use `action-button`, `form-control` and `form-label` for new forms and actions. Avoid styling every link or input beneath a page wrapper: each component owns its colours and spacing so photo tiles, campaign actions and the footer retain their contrast. Footer forms use the same controls, preserve live Mailchimp fields and prevent submissions in preview. Social artwork is bundled with the frontend.

### Committee profiles

Member entries use `CommitteeProfileCard`: a circular portrait, centred name and full-width blue role strip matching the legacy committee pages. The whole card links to the member in its own committee season. `CommitteeProfiles` orders cards by optional nonnegative integer `role_order`, retaining API order for ties/missing ranks. Use `role_label` for the visible role; older responses can still supply the role through the first tag. `image_url` supplies a public portrait URL; missing/broken images fall back to the bundled BULSCA logo and then initials.

Member details use the existing member endpoint and `sections` for structured biography content. Optional `role_sections: ContentSection[]` supplies the role description for the full-width blue section below the biography. Empty bios and role descriptions have explicit fallback text. No arbitrary profile HTML is rendered. Current and historical committee pages share the cards, and a member's Back link returns to that same season. Preview people remain fictional and use the logo rather than attaching real committee photographs to invented names.

## Verification

```sh
npm run test:run
npm run lint:check
node_modules/.bin/vue-tsc --noEmit -p tsconfig.app.json
node_modules/.bin/vue-tsc --noEmit -p tsconfig.vitest.json
node_modules/.bin/vue-tsc --noEmit -p tsconfig.node.json
```

Tests mount the full application with memory routing, traverse public routes and preview records, and exercise unavailable services, consumers, contact forms, document access and recovery. They make no calls to real external services. Deployment and production acceptance are separate user-owned checks.

For actual browser acceptance, start `npm run dev:preview` and an isolated Chrome session with remote debugging on `127.0.0.1:9222`, then run `npm run test:browser`. The checker uses Node's built-in Chrome DevTools connection; it needs no browser automation dependency or production build. It visits all public preview routes at 320, 375, 640, 768, 1024 and 1440 pixels, checks rendered geometry and image loading, and exercises mouse/keyboard navigation, carousel playback, profile links, forms, downloads and browser history. Reports and screenshots are written under ignored `node_modules/.cache/bulsca-browser/`.

For example, start the isolated browser in a separate terminal:

```sh
google-chrome --headless=new --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222 --user-data-dir=/tmp/bulsca-browser-verification about:blank
```

To verify unavailable live APIs, start a second dev server with `VITE_PUBLIC_DATA_MODE=live npm run dev -- --host 127.0.0.1 --port 5174`, then run `npm run test:browser -- --live`. API responses are intercepted locally to simulate 404/500/503, invalid payloads, recovery and reconnection; telemetry is captured rather than sent to a backend. The runner accepts loopback origins only and does not submit live forms. Run preview and live checks sequentially so each tab retains visibility for carousel tests.

Unknown routes have a dedicated not-found screen. Missing APIs retain page headings, related navigation and recovery messages. Unavailable optional widgets do not hide static content. Legal information that was absent from the source has an explicit unavailable notice instead of invented policy text.

## Pull request checks

`.github/workflows/tests.yml` runs on every PR (including drafts and retargeting), pushes to main/release branches, and merge queues. `Required CI` succeeds only if both unit/type/lint checks and complete Chrome acceptance succeed; failures, cancellations and skipped prerequisites fail the gate. Browser logs, screenshots and reports are retained for seven days.

Run `bash scripts/ci-browser.sh` after installing dependencies to start isolated Chrome plus preview/live Vite servers and run both acceptance suites. It requires Node 24 and Google Chrome (`CHROME_BIN` may override the executable). Ports 9222, 5173 and 5174 must be available. Startup failures fail the command and child processes are cleaned up. No production assets are built.

GitHub rulesets require PRs and an up-to-date `Required CI` from GitHub Actions on the default branch and `release/` branches, including nested release names. There are no bypass actors or required human approvals; force pushes and branch deletion are blocked. These settings live in GitHub, independently of workflow files. Existing PRs without the workflow remain blocked until updated; do not bypass the gate to merge them. CODEX development branches remain pushable.

## Public-site launch integration

The first release retains the existing Laravel administration and file storage. Set `VITE_PUBLIC_DATA_MODE=live`, point both API bases at the Laravel `/api/v1`, and set `VITE_PORTAL_URL` to the existing Laravel administration origin. Management handoffs preserve the requested path; account/portal links lead to the existing dashboard, and OAuth callbacks start a fresh login without forwarding callback secrets. Serve/proxy `/api`, `/storage` and `/img` as required by the backend origin. Vite values are configuration for the owner’s later build; restart dev servers after changing them.

Public data includes advanced SERC year/location/author/casualty-count filters, casualty groups, archived championship content/downloads, sanitized biographies and global notices. Contact sends require configured server-side Turnstile/mail; unavailable configuration leaves email links available. Article feedback records explicit browser visits and user ratings, keeps the article readable after failure, prevents overlapping writes, and offers a read-only totals refresh after an uncertain rating. Preview interactions remain local. Browser metadata follows loaded titles and clears old record metadata during navigation; prerendering remains separate.

Run `bash scripts/ci-api-integration.sh ../bulsca-site` after locked PHP/Node dependencies are installed. Supply `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, test credentials and a dedicated database ending in `_test`; the backend guard also rejects the application database. The script resets only that guarded test database, starts Laravel on 8000, Vite on 5175 and isolated Chrome on 9223, fakes captcha/mail externally, and exercises actual API responses with no API stubbing. Reports, screenshots and logs live under ignored `node_modules/.cache/bulsca-api-integration`. Keep those ports available. CI runs this suite against a pinned counterpart commit alongside the existing preview/outage suites and fails `Required CI` if any prerequisite fails or is skipped. Coordinate counterpart pins and generated types when changing API contracts.

Before deployment, the owner should check real data, media/download URLs, captcha/mail delivery, old URLs and administration handoffs. Missing approved privacy/cookie/terms text remains an explicit content gap. No builds, deployment, new portal, authentication migration or S3 migration are performed by these checks.

## Podman release candidate

`release/public-site-v1` is the release target in this repository and `BULSCA/bulsca-site`; `main`/`master` remain unchanged. Release branches are the sole exception to the `CODEX/` branch prefix. Container implementation is published in focused, reviewable commits on a `CODEX/` PR; the owner performs final merges.

`Containerfile` builds with Node 24 and serves static Vue assets with unprivileged Nginx on 8080. The owner runs image builds later. Build arguments are `VITE_PUBLIC_DATA_MODE=live`, `VITE_WEBSITE_API_URL=/api/v1`, `VITE_COMPETITION_API_URL=/api/v1` and `VITE_PORTAL_URL=https://portal.bulsca.co.uk`; deployment credentials never belong in these values. The production image refuses preview mode. Changes to these settings require a new image.

The backend repository's `compose.yml` coordinates both sibling checkouts, PHP/web, MySQL 8.4, shared storage and the scheduler. Its README contains configuration, explicit build/import commands, backups, proxy setup, smoke acceptance, reboot recovery and rollback. Use `www.bulsca.co.uk` for Vue, `api.bulsca.co.uk` for public API/media/downloads and `portal.bulsca.co.uk` for the existing Laravel administration. Set runtime `PUBLIC_API_HOST` for the frontend proxy; it resolves the backend using Podman's network DNS when requests arrive, allowing the static site to start during backend downtime. It strips browser authentication/cookies, does not cache or retry API requests, preserves status/request IDs and never substitutes Vue HTML for API responses or missing assets.

CI additionally requires `Container configuration`: checksum-pinned Hadolint, shell/Compose checks, 25 real Nginx HTTP routing scenarios with temporary fixtures, and smoke-tool unit tests. The backend checker runs against this PR's frontend and a pinned backend commit. These checks build no application assets/images. Owner acceptance of built containers, real data and providers is still required before release.
