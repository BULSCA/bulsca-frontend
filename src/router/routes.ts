import type { RouteRecordRaw } from 'vue-router'
import { pages } from '@/content/pages'
import { browsePages } from '@/content/browse'
const StaticPage = () => import('@/views/StaticPageView.vue')
const BrowsePage = () => import('@/views/PublicBrowseView.vue')
const PortalPage = () => import('@/views/PortalView.vue')
const staticRoute = (path: string, name: string, content: string): RouteRecordRaw => ({ path, name, component: StaticPage, meta: { content, title: pages[content]!.title } })
const browseRoute = (path: string, name: string, browse: string): RouteRecordRaw => ({ path, name, component: BrowsePage, meta: { browse, title: browsePages[browse]!.title } })
const handoff = (path: string, name: string): RouteRecordRaw => ({ path, name, component: PortalPage, meta: { title: 'Member and management portal' } })
export const routes: RouteRecordRaw[] = [
  staticRoute('/', 'home', 'home'), staticRoute('/about', 'about', 'about'),
  { path: '/about/records', name: 'records', component: () => import('@/views/RecordsView.vue'), meta: { title: 'BULSCA records' } },
  staticRoute('/freshers', 'freshers', 'freshers'), staticRoute('/get-involved', 'get-involved', 'involved'),
  staticRoute('/get-involved/clubs/create', 'create-club', 'create-club'),
  browseRoute('/get-involved/clubs', 'clubs', 'clubs'), browseRoute('/get-involved/clubs/:slug', 'club', 'club'),
  browseRoute('/get-involved/committee', 'committee-current', 'committee'),
  browseRoute('/get-involved/previous-committees', 'committees', 'committees'),
  browseRoute('/get-involved/committee/:season(\\d{4}-\\d{2})', 'committee', 'committee'),
  browseRoute('/get-involved/committee/:season(current|\\d{4}-\\d{2})/:slug', 'committee-member', 'member'),
  staticRoute('/competitions', 'competitions', 'competitions'), browseRoute('/competitions/calendar', 'calendar', 'calendar'),
  browseRoute('/competitions/championships', 'championships', 'championships'),
  browseRoute('/competitions/championships/:year(\\d{4})', 'championship', 'championship'),
  browseRoute('/competitions/league', 'league-current', 'league'),
  browseRoute('/competitions/league/:season(\\d{4}-\\d{2})', 'league', 'league'),
  browseRoute('/competitions/previous-leagues', 'seasons', 'seasons'),
  browseRoute('/competitions/:slug', 'competition', 'competition'),
  browseRoute('/resources', 'resources', 'resources'), staticRoute('/resources/forms', 'forms', 'forms'),
  browseRoute('/resources/search', 'resource-search', 'resource-search'),
  { path: '/resources/search/:search', redirect: to => ({ path: '/resources/search', query: { ...to.query, q: String(to.params.search) } }) },
  browseRoute('/resources/sercs', 'sercs', 'sercs'), browseRoute('/resources/sercs/:slug', 'serc', 'serc'),
  browseRoute('/resources/casualties', 'casualties', 'casualties'), browseRoute('/resources/casualties/:slug', 'casualty', 'casualty'),
  { path: '/resources/sercs/search', redirect: to => ({ path: '/resources/sercs', query: to.query }) },
  { path: '/resources/casualties/search', redirect: to => ({ path: '/resources/casualties', query: to.query }) },
  browseRoute('/resources/view/:id', 'resource', 'resource'), browseRoute('/resources/:slug', 'resource-page', 'resource-page'),
  staticRoute('/welfare', 'welfare', 'welfare'), staticRoute('/welfare/support-and-reporting', 'support', 'support'),
  staticRoute('/welfare/inclusion-and-accessibility', 'inclusion', 'inclusion'), staticRoute('/contact', 'contact', 'contact'),
  { path: '/contact-form', name: 'contact-form', component: () => import('@/views/ContactFormView.vue'), meta: { title: 'Contact BULSCA' } },
  staticRoute('/privacy-policy', 'privacy', 'privacy'), staticRoute('/data-deletion', 'data-deletion', 'deletion'),
  staticRoute('/cookies', 'cookies', 'cookies'), staticRoute('/terms-of-service', 'terms', 'terms'),
  { path: '/latest', name: 'latest', component: () => import('@/views/LatestView.vue'), meta: { title: 'Latest news' } },
  { path: '/article/:slug', name: 'article', component: () => import('@/views/ArticleView.vue'), meta: { title: 'Article' } },
  browseRoute('/meta-content/feed', 'social', 'social'),
  { path: '/landing', redirect: '/' }, { path: '/privacy', redirect: '/privacy-policy' },
  { path: '/get-involved/freshers', redirect: '/freshers' }, { path: '/get-involved/create-club', redirect: '/get-involved/clubs/create' },
  { path: '/get-involved/committee/index', redirect: '/get-involved/committee' },
  { path: '/get-involved/committee2', redirect: '/get-involved/committee' },
  { path: '/competitions/champs', redirect: '/competitions/championships' },
  { path: '/welfare/help-and-reporting', redirect: '/welfare/support-and-reporting' },
  { path: '/articles/tag/:tag', redirect: to => ({ path: '/latest', query: { ...to.query, tag: String(to.params.tag) } }) },
  { path: '/articles/:slug', redirect: to => ({ name: 'article', params: { slug: to.params.slug } }) },
  handoff('/portal', 'portal'), handoff('/account', 'account'), handoff('/dashboard', 'dashboard'), handoff('/settings', 'settings'),
  handoff('/admin/:pathMatch(.*)*', 'admin'), handoff('/bpadmin/:pathMatch(.*)*', 'backpack'),
  handoff('/login/:pathMatch(.*)*', 'login'), handoff('/register', 'register'), handoff('/forgot-password', 'forgot-password'),
  handoff('/reset-password/:token', 'reset-password'), handoff('/auth/:pathMatch(.*)*', 'auth'),
  handoff('/article/create', 'article-create'), handoff('/article/:slug/edit', 'article-edit'), handoff('/editor', 'editor'),
  handoff('/get-involved/clubs/:slug/edit', 'club-edit'), handoff('/competitions/:slug/manage/:pathMatch(.*)*', 'competition-manage'),
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'Page not found' } },
]

/** Canonical public pages, including representative detail identifiers, for parity tests. */
export const publicPageCases: Array<[string, string]> = [
  ['/', 'University lifesaving, together'], ['/about', 'About BULSCA'], ['/about/records', 'BULSCA records'],
  ['/freshers', 'New to university lifesaving?'], ['/get-involved', 'Get involved'], ['/get-involved/clubs/create', 'Start a lifesaving club'],
  ['/get-involved/clubs', 'University clubs'], ['/get-involved/clubs/example-university.1', 'Example University Lifesaving'],
  ['/get-involved/committee', 'Committee 2026-27'], ['/get-involved/previous-committees', 'Previous committees'],
  ['/get-involved/committee/2025-26', 'Committee 2025-26'], ['/get-involved/committee/2026-27/alex-example.1', 'Alex Example'],
  ['/competitions', 'Competitions'], ['/competitions/calendar', 'Competition calendar'],
  ['/competitions/example-university-2026.1', 'Example University Competition'],
  ['/competitions/championships', 'Championships'], ...['2023', '2024', '2025', '2026'].map(year => [`/competitions/championships/${year}`, `Championships ${year}`] as [string, string]),
  ['/competitions/league', 'League 2026-27'], ['/competitions/league/2025-26', 'League 2025-26'], ['/competitions/previous-leagues', 'Previous leagues'],
  ['/resources', 'Resources'], ['/resources/forms', 'Forms'], ['/resources/search', 'Search resources'],
  ['/resources/governance', 'Governance'], ['/resources/view/sample-entry-pack', 'Sample entry pack'],
  ['/resources/sercs', 'SERCs'], ['/resources/sercs/pool-rescue.1', 'Pool rescue practice'],
  ['/resources/casualties', 'Casualties'], ['/resources/casualties/sample-casualty.1', 'Sample casualty briefing'],
  ['/welfare', 'Welfare'], ['/welfare/support-and-reporting', 'Support and reporting'], ['/welfare/inclusion-and-accessibility', 'Inclusion and accessibility'],
  ['/contact', 'Contact BULSCA'], ['/contact-form', 'Contact BULSCA'], ['/privacy-policy', 'Privacy information'],
  ['/data-deletion', 'Data deletion'], ['/cookies', 'Cookie information'], ['/terms-of-service', 'Terms of service'],
  ['/latest', 'Latest'], ['/article/welcome-to-the-preview.1', 'Welcome to the public site preview'], ['/meta-content/feed', 'Community updates'], ['/portal', 'Member and management portal'],
]
