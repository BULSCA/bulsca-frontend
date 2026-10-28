import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LatestView from '../LatestView.vue'
import ArticleView from '../ArticleView.vue'
import { getArticles, getArticleBySlug } from '@/api/articles/articles'
import { ApiFailure } from '@/api/errors'
import { recordView } from '@/api/articles/interactions'
import { article, articleList } from '@/test/fixtures'
vi.mock('@/api/articles/articles', () => ({
  getArticles: vi.fn<typeof import('@/api/articles/articles').getArticles>(),
  getArticleBySlug: vi.fn<typeof import('@/api/articles/articles').getArticleBySlug>(),
}))
afterEach(() => vi.resetAllMocks())
vi.mock('@/api/articles/interactions', () => ({ recordView: vi.fn<typeof import('@/api/articles/interactions').recordView>().mockResolvedValue({ views: 1, thumbs_up: 0, thumbs_down: 0 }), rateArticle: vi.fn<typeof import('@/api/articles/interactions').rateArticle>() }))
async function screen(path = '/latest') {
  vi.mocked(recordView).mockResolvedValue({ views: 1, thumbs_up: 0, thumbs_down: 0 })
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/latest', component: LatestView }, { path: '/article/:slug', name: 'article', component: ArticleView },
  ] })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(path.startsWith('/latest') ? LatestView : ArticleView, { global: { plugins: [router], stubs: { PageBanner: true } } })
  await flushPromises()
  return { wrapper, router }
}
describe('public news screens', () => {
  it('retains the actual article title after a canonical slug redirect', async () => {
    vi.mocked(getArticleBySlug).mockResolvedValue({ data: { ...article(), slug: 'canonical-news.1', content: '<p>Published</p>' } })
    const { router } = await screen('/article/old-title.1')
    await flushPromises()
    expect(router.currentRoute.value.params.slug).toBe('canonical-news.1')
    expect(document.title).toBe('Rescue news | BULSCA')
  })
  it('renders canonical links, URL tag filters and pagination', async () => {
    vi.mocked(getArticles).mockResolvedValue(articleList())
    const { wrapper, router } = await screen('/latest?tag=competition')
    expect(getArticles).toHaveBeenCalledWith(expect.any(AbortSignal), 1, 'competition')
    expect(wrapper.get('a[href="/article/rescue-news.1"]').text()).toContain('Rescue news')
    const next = wrapper.get('nav[aria-label="News pages"] a')
    expect(next.attributes('href')).toBe('/latest?tag=competition&page=2')
    await next.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.page).toBe('2')
    expect(getArticles).toHaveBeenLastCalledWith(expect.any(AbortSignal), 2, 'competition')
  })
  it('preserves loaded news when a later page request fails', async () => {
    vi.mocked(getArticles).mockResolvedValueOnce(articleList()).mockRejectedValueOnce(new ApiFailure('server', 'Temporarily unavailable'))
    const { wrapper, router } = await screen()
    await router.push('/latest?page=2')
    await flushPromises()
    expect(wrapper.text()).toContain('Rescue news')
    expect(wrapper.get('[role="alert"]').text()).toContain('previously loaded')
  })
  it('can retry a failed initial load without losing the page shell', async () => {
    vi.mocked(getArticles).mockRejectedValueOnce(new ApiFailure('network', 'Unavailable')).mockResolvedValueOnce(articleList())
    const { wrapper } = await screen()
    expect(wrapper.find('main').exists()).toBe(true)
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Rescue news')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
  it('renders an empty result distinctly from a missing article', async () => {
    vi.mocked(getArticles).mockResolvedValue({ ...articleList(), data: { pinned: [], articles: [] } })
    const list = await screen()
    expect(list.wrapper.find('[role="alert"]').exists()).toBe(false)
    list.wrapper.unmount()
    vi.mocked(getArticleBySlug).mockRejectedValue(new ApiFailure('not_found', 'This content could not be found.'))
    const detail = await screen('/article/missing.99')
    expect(detail.wrapper.text()).toContain('Back to news')
    expect(detail.wrapper.get('[role="alert"]').text()).toContain('could not be found')
  })
  it('renders the safe detail contract and removes old detail on a new-article failure', async () => {
    vi.mocked(getArticleBySlug).mockResolvedValueOnce({ data: { ...article(), content: '<p>Safe content</p>' } })
      .mockRejectedValueOnce(new ApiFailure('server', 'Unavailable'))
    const { wrapper, router } = await screen('/article/rescue-news.1')
    expect(wrapper.text()).toContain('Safe content')
    expect(document.title).toBe('Rescue news | BULSCA')
    await router.push('/article/different.2')
    await flushPromises()
    expect(wrapper.text()).not.toContain('Safe content')
    expect(document.title).toBe('Article | BULSCA')
    expect(wrapper.text()).toContain('Unavailable')
  })
})
