import { describe, expect, it } from 'vitest'
import { isArticleList, isArticleResponse } from '../articles/articles'
import { article, articleList } from '@/test/fixtures'
describe('article response validation', () => {
  it('accepts the documented list and detail contracts', () => {
    expect(isArticleList(articleList())).toBe(true)
    expect(isArticleResponse({ data: { ...article(), content: '<p>News</p>' } })).toBe(true)
  })
  it('rejects incomplete or malformed responses before they reach the UI', () => {
    for (const data of [null, {}, { data: [] }, { ...articleList(), meta: { current_page: -1 } }]) expect(isArticleList(data)).toBe(false)
    expect(isArticleResponse({ data: article() })).toBe(false)
    expect(isArticleResponse({ data: { ...article(), tags: 'broken', content: '' } })).toBe(false)
  })
})
