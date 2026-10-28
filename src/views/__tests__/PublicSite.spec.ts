import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import App from '@/App.vue'
import { createSiteRouter } from '@/router'
import { publicPageCases } from '@/router/routes'
import { navigation } from '@/content/navigation'
import { pages } from '@/content/pages'
import { browsePages } from '@/content/browse'
import { ApiFailure } from '@/api/errors'
import apiClient from '@/api/client'
import { previewResponse } from '@/preview/service'
const config = vi.hoisted(() => ({ previewMode: true, websiteApiBase: '/api/v1', competitionApiBase: '/api/v1', portalUrl: 'https://portal.bulsca.co.uk' }))
vi.mock('@/config', () => config)
vi.mock('@/services/diagnostics', () => ({ reportError: vi.fn<() => void>() }))
let wrapper: VueWrapper | undefined
beforeEach(() => { config.previewMode = true })
afterEach(() => { wrapper?.unmount(); wrapper = undefined; vi.restoreAllMocks() })
async function visit(path: string) {
  const router = createSiteRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  wrapper = mount(App, { global: { plugins: [router] } })
  await flushPromises()
  return { router, app: wrapper }
}

describe('complete public browsing in preview mode', () => {
  it.each(publicPageCases)('%s renders its public page', async (path, title) => {
    const { router, app } = await visit(path)
    await vi.waitFor(() => expect(app.text()).toContain(title))
    expect(router.currentRoute.value.name).not.toBe('not-found')
    expect(app.find('main').exists()).toBe(true)
    expect(app.findAll('h1')).toHaveLength(1)
    expect(app.find('.page-banner').exists()).toBe(path !== '/')
    expect(app.find('.home-carousel').exists()).toBe(path === '/')
    expect(app.find('footer.site-footer .mailing-list').exists()).toBe(true)
    expect(app.find('footer.site-footer .content-container').exists()).toBe(true)
    expect(app.find('main > .content-container, main > .page-body').exists()).toBe(true)
    expect(app.find('[aria-label="Main navigation"]').exists()).toBe(true)
    expect(app.text()).toContain('Preview — sample data')
    expect(app.text()).not.toContain('This section is temporarily unavailable')
    expect(app.text()).not.toContain('You did it!')
    expect(document.title).toContain('BULSCA')
  })

  it('all navigation and content links resolve without falling through to the catch-all', async () => {
    const router = createSiteRouter(createMemoryHistory())
    const links = [...navigation.flatMap(item => [item.to, ...(item.children || []).map(child => child.to)]),
      ...Object.values(pages).flatMap(page => page.links.map(link => link.url)),
      ...Object.values(browsePages).flatMap(page => page.links.map(link => link.url))]
    for (const path of links.filter(link => link.startsWith('/'))) {
      const match = router.resolve(path)
      expect({ path, name: match.name }).not.toEqual({ path, name: 'not-found' })
    }
  })

  it('traverses from a club directory into a detail and then a competition', async () => {
    const { router, app } = await visit('/get-involved/clubs')
    await vi.waitFor(() => expect(app.find('a[href="/get-involved/clubs/example-university.1"]').exists()).toBe(true))
    await app.get('a[href="/get-involved/clubs/example-university.1"]').trigger('click')
    await vi.waitFor(() => expect(app.get('h1').text()).toBe('Example University Lifesaving'))
    await flushPromises()
    await vi.waitFor(() => expect(app.findAll('a').some(link => link.attributes('href') === '/competitions/example-university-2026.1')).toBe(true))
    await app.findAll('a').find(link => link.attributes('href') === '/competitions/example-university-2026.1')!.trigger('click')
    await vi.waitFor(() => expect(app.get('h1').text()).toBe('Example University Competition'))
    router.back()
    await vi.waitFor(() => expect(app.get('h1').text()).toBe('Example University Lifesaving'))
    router.forward()
    await vi.waitFor(() => expect(app.get('h1').text()).toBe('Example University Competition'))
  })

  it('supports filtering, empty searches, and restoring URL state', async () => {
    const { router, app } = await visit('/resources/search?q=not-a-real-document')
    await vi.waitFor(() => expect(app.text()).toContain('No matching items'))
    await app.get('input[name="q"]').setValue('entry')
    await app.get('form[role="search"]').trigger('submit')
    await vi.waitFor(() => expect(app.text()).toContain('Sample entry pack'))
    expect(router.currentRoute.value.query.q).toBe('entry')
  })

  it('prepares a bundled sample download without contacting any service', async () => {
    const get = vi.spyOn(apiClient, 'get')
    const { app } = await visit('/resources/view/sample-entry-pack')
    await vi.waitFor(() => expect(app.find('section[aria-label="Document access"] button').exists()).toBe(true))
    await app.get('section[aria-label="Document access"] button').trigger('click')
    await vi.waitFor(() => expect(app.find('a[href="/preview/sample-resource.txt"]').exists()).toBe(true))
    expect(get).not.toHaveBeenCalled()
  })

  it('does not send newsletter subscriptions from preview mode', async () => {
    const { app } = await visit('/')
    const newsletter = app.findAll('form').find(form => form.find('input[name="EMAIL"]').exists())!
    expect(newsletter.attributes('action')).toBeUndefined()
    await newsletter.trigger('submit')
    expect(app.text()).toContain('no mailing-list subscription was submitted')
  })

  it('shares a single highlights read between the carousel and competition cards', async () => {
    const publicApi = await import('@/api/public')
    const requests = vi.spyOn(publicApi, 'getCollection')
    const { app } = await visit('/')
    await vi.waitFor(() => expect(app.find('a[href="/competitions/example-university-2026.1"]').exists()).toBe(true))
    expect(requests.mock.calls.filter(call => call[0] === 'highlights')).toHaveLength(1)
    expect(app.find('.home-carousel').exists()).toBe(true)
    expect(app.findAll('.competition-card')).toHaveLength(2)
  })

  it('restores the icon rows and supplies the full-width Champs campaign through presentation data', async () => {
    const { app } = await visit('/')
    await vi.waitFor(() => expect(app.find('.championship-band').exists()).toBe(true))
    expect(app.findAll('.icon-text-row h2').map(heading => heading.text())).toEqual(['Acting Governing Body', 'By Students, For Students', 'Our Aims'])
    expect(app.get('main > .page-body > .championship-band').text()).toContain('Champs 2027')
    expect(app.get('.championship-band').text()).toContain('6th–7th March')
    expect(app.get('.championship-band').text()).toContain('@ Alan Higgs Centre, Coventry')
    expect(app.get('.championship-band a').attributes('href')).toBe('/competitions/championships')
    expect(app.get('footer.site-footer img[alt="Facebook"]').attributes('src')).not.toContain('/storage/')
  })

  it.each(['/competitions/calendar', '/competitions/league', '/get-involved/clubs/example-university.1'])('uses the same competition tiles on %s', async path => {
    const { app } = await visit(path)
    await vi.waitFor(() => expect(app.find('.competition-card .card-action').exists()).toBe(true))
    expect(app.find('.competition-card .card-date').exists()).toBe(true)
  })

  it.each(['/resources', '/competitions/championships', '/competitions/previous-leagues', '/get-involved/previous-committees'])('uses large section tiles on %s', async path => {
    const { app } = await visit(path)
    await vi.waitFor(() => expect(app.find('.navigation-tiles .navigation-tile').exists()).toBe(true))
  })

  it('closes the mobile menu and submenus when navigating or pressing Escape', async () => {
    const { app, router } = await visit('/')
    await app.get('.menu-toggle').trigger('click')
    expect(app.get('.menu-toggle').attributes('aria-expanded')).toBe('true')
    await router.push('/about')
    expect(app.get('.menu-toggle').attributes('aria-expanded')).toBe('false')
    await app.get('.menu-toggle').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(app.get('.menu-toggle').attributes('aria-expanded')).toBe('false')
  })

  it.each([
    ['/landing', '/'], ['/get-involved/freshers', '/freshers'], ['/get-involved/create-club', '/get-involved/clubs/create'],
    ['/get-involved/committee/index', '/get-involved/committee'], ['/competitions/champs', '/competitions/championships'],
    ['/welfare/help-and-reporting', '/welfare/support-and-reporting'], ['/privacy', '/privacy-policy'],
    ['/resources/sercs/search?q=pool', '/resources/sercs'], ['/articles/tag/preview', '/latest'],
  ])('preserves the legacy alias %s', async (old, canonical) => {
    const { router } = await visit(old)
    expect(router.currentRoute.value.path).toBe(canonical)
  })

  it.each(['/dashboard', '/settings', '/admin/users', '/article/create', '/competitions/example.1/manage', '/get-involved/clubs/example.1/edit'])('hands management URL %s to the portal', async path => {
    const { app } = await visit(path)
    expect(app.get('h1').text()).toBe('Member and management portal')
    expect(app.find('.page-banner').exists()).toBe(true)
    expect(app.get(`a[href="https://portal.bulsca.co.uk${path}"]`).text()).toContain('Open the portal')
  })

  it('keeps genuinely unknown routes distinct from unavailable content', async () => {
    const { router, app } = await visit('/this-page-does-not-exist')
    expect(router.currentRoute.value.name).toBe('not-found')
    expect(app.get('h1').text()).toBe('Page not found')
    expect(app.find('.page-banner').exists()).toBe(true)
  })
})

describe('live services may be unavailable', () => {
  it('keeps successful directory data when a new filter fails', async () => {
    config.previewMode = false
    const transport = await import('@/api/client')
    vi.spyOn(transport, 'read').mockImplementation(async path => {
      if (path.split('?')[0] === '/clubs' && !path.includes('q=')) return previewResponse('clubs', {}, {})
      throw new ApiFailure('server', 'Unavailable', 500)
    })
    const { app, router } = await visit('/get-involved/clubs')
    await vi.waitFor(() => expect(app.text()).toContain('Example University Lifesaving'))
    await router.push('/get-involved/clubs?q=updated-filter')
    await vi.waitFor(() => expect(app.text()).toContain('previously loaded'))
    expect(app.text()).toContain('Example University Lifesaving')
    expect(app.text()).toContain('may not match your latest search')
  })

  it.each(['/get-involved/clubs', '/get-involved/committee', '/competitions/calendar', '/competitions/league', '/resources', '/resources/governance', '/resources/sercs', '/resources/casualties'])('%s retains a usable page when the endpoint returns 404', async path => {
    config.previewMode = false
    // Mock both clients through the common read-only transport rather than real requests.
    const transport = await import('@/api/client')
    vi.spyOn(transport, 'read').mockRejectedValue(new ApiFailure('not_found', 'Missing', 404))
    const { app } = await visit(path)
    await vi.waitFor(() => expect(app.find('[role="alert"]').exists()).toBe(true))
    expect(app.find('h1').exists()).toBe(true)
    expect(app.find('.page-banner .hero-photo').exists()).toBe(true)
    expect(app.find('[aria-label="Related pages"]').exists()).toBe(true)
    expect(app.text()).not.toContain('Example University Lifesaving')
    expect(app.text()).not.toContain('Preview — sample data')
    expect(app.find('[aria-label="Main navigation"]').exists()).toBe(true)
  })

  it('isolates unavailable homepage widgets from static content', async () => {
    config.previewMode = false
    const transport = await import('@/api/client')
    vi.spyOn(transport, 'read').mockRejectedValue(new ApiFailure('server', 'Service unavailable', 500))
    const { app } = await visit('/')
    await vi.waitFor(() => expect(app.findAll('[role="alert"]').length).toBe(2))
    expect(app.get('h1').text()).toBe('University lifesaving, together')
    expect(app.find('.home-carousel .hero-photo').exists()).toBe(true)
    expect(app.text()).toContain('By Students, For Students')
    expect(app.text()).toContain('Find a club')
    expect(app.find('.championship-band').exists()).toBe(false)
  })

  it('can navigate to another page after a section error', async () => {
    config.previewMode = false
    const transport = await import('@/api/client')
    vi.spyOn(transport, 'read').mockRejectedValue(new ApiFailure('invalid_response', 'Unavailable'))
    const { app, router } = await visit('/resources')
    await router.push('/about')
    await flushPromises()
    expect(app.get('h1').text()).toBe('About BULSCA')
    expect(app.find('[role="alert"]').exists()).toBe(false)
  })
})
