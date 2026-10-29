import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import ArticleActions from '@/components/ArticleActions.vue'
import { recordView, rateArticle } from '@/api/articles/interactions'
import { getArticleBySlug } from '@/api/articles/articles'
import type { Article } from '@/api/articles/types'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
vi.mock('@/api/articles/interactions', () => ({ recordView: vi.fn<typeof import('@/api/articles/interactions').recordView>(), rateArticle: vi.fn<typeof import('@/api/articles/interactions').rateArticle>() }))
vi.mock('@/api/articles/articles', () => ({ getArticleBySlug: vi.fn<typeof import('@/api/articles/articles').getArticleBySlug>() }))
vi.mock('@/config', () => ({ previewMode: false }))
const counters = { views: 10, thumbs_up: 2, thumbs_down: 1 }
const article: Article = { id: 1, slug: 'news.1', title: 'News', author: null, excerpt: '', pinned: false, created_at: null, updated_at: null, tags: [], ...counters }
let wrapper: VueWrapper
beforeEach(() => { vi.resetAllMocks(); vi.mocked(recordView).mockResolvedValue({ ...counters, views: 11 }) })
afterEach(() => wrapper?.unmount())
describe('article interactions', () => {
  it('never records a view while rendering on the server', async () => {
    const html = await renderToString(createSSRApp(ArticleActions, { article }))
    expect(html).toContain('10 views')
    expect(recordView).not.toHaveBeenCalled()
    expect(rateArticle).not.toHaveBeenCalled()
  })
  it('records a real visit once and keeps rating controls usable after view failure', async () => {
    vi.mocked(recordView).mockRejectedValue(new Error('unavailable'))
    wrapper = mount(ArticleActions, { props: { article } }); await flushPromises()
    expect(recordView).toHaveBeenCalledOnce()
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined()
    await wrapper.setProps({ article: { ...article, slug: 'canonical-news.1' } })
    expect(recordView).toHaveBeenCalledOnce()
  })
  it('prevents duplicate pending ratings and does not let late view totals overwrite the result', async () => {
    let finishView!: (result: typeof counters) => void
    let finishVote!: (result: typeof counters) => void
    vi.mocked(recordView).mockReturnValue(new Promise(resolve => { finishView = resolve }))
    vi.mocked(rateArticle).mockReturnValue(new Promise(resolve => { finishVote = resolve }))
    wrapper = mount(ArticleActions, { props: { article } })
    await wrapper.get('button').trigger('click'); await wrapper.get('button').trigger('click')
    expect(rateArticle).toHaveBeenCalledOnce()
    finishVote({ ...counters, thumbs_up: 3 }); await flushPromises()
    finishView(counters); await flushPromises()
    expect(wrapper.get('button').text()).toContain('Helpful (3)')
  })
  it('offers a read-only totals refresh after an uncertain write without replaying it', async () => {
    vi.mocked(rateArticle).mockRejectedValue(new Error('uncertain'))
    vi.mocked(getArticleBySlug).mockResolvedValue({ data: { ...article, content: '', thumbs_up: 3 } })
    wrapper = mount(ArticleActions, { props: { article } }); await flushPromises()
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(wrapper.text()).toContain('could not confirm your rating')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    await wrapper.findAll('button')[2]!.trigger('click'); await flushPromises()
    expect(getArticleBySlug).toHaveBeenCalledOnce()
    expect(rateArticle).toHaveBeenCalledOnce()
    expect(wrapper.get('button').text()).toContain('Helpful (3)')
  })
  it('cancels requests and ignores results belonging to a previous article', async () => {
    let finish!: (result: typeof counters) => void
    vi.mocked(rateArticle).mockReturnValue(new Promise(resolve => { finish = resolve }))
    wrapper = mount(ArticleActions, { props: { article } }); await flushPromises()
    await wrapper.get('button').trigger('click')
    const previousSignal = vi.mocked(rateArticle).mock.calls[0]![3]
    await wrapper.setProps({ article: { ...article, id: 2, slug: 'other.2', thumbs_up: 0 } }); await flushPromises()
    expect(previousSignal.aborted).toBe(true)
    finish({ ...counters, thumbs_up: 999 }); await flushPromises()
    expect(wrapper.text()).not.toContain('999')
  })
})
