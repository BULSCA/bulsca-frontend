import { afterEach, describe, expect, it, vi } from 'vitest'
import apiClient from '@/api/client'
import { endpointPath, getCollection, getDocument, getResourceAccess, getContactConfig, getPresentation, submitContact, type CollectionEndpoint, type DetailEndpoint } from '../index'
import { isAccess, isCollection, isDocumentResponse } from '../validation'
import contract from '../contract.json'
import { previewResponse } from '@/preview/service'
import { safeHref } from '@/utils/links'
import * as transport from '@/api/client'
const config = vi.hoisted(() => ({ previewMode: false, websiteApiBase: '/website/v1', competitionApiBase: '/competitions/v1' }))
vi.mock('@/config', () => config)
vi.mock('@/services/diagnostics', () => ({ reportError: vi.fn<() => void>() }))
afterEach(() => { vi.restoreAllMocks(); config.previewMode = false })
const signal = () => new AbortController().signal
const params = { slug: 'example-university.1', season: '2026-27', year: '2026', id: 'sample-entry-pack' }
describe('public API contracts and consumers', () => {
  it('encodes identifiers and filters without interpolating raw paths', () => {
    expect(endpointPath('club', { slug: 'a/b?token' }, { q: 'pool & rescue' })).toBe('/clubs/a%2Fb%3Ftoken?q=pool+%26+rescue')
    expect(() => endpointPath('member', { slug: 'alex' })).toThrow('Missing endpoint parameter')
  })
  it.each(Object.entries(contract.endpoints).filter(([, spec]) => spec.response === 'collection').map(([key]) => key as CollectionEndpoint))('calls the %s directory with query state and the correct service', async endpoint => {
    const read = vi.spyOn(transport, 'read').mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } })
    await getCollection(endpoint, signal(), { q: 'pool', page: '2' })
    const args = read.mock.calls[0]!
    expect(args[0]).toContain('q=pool&page=2')
    expect(args[3]).toBe(contract.endpoints[endpoint].path)
    const client = args[4]!
    expect(client.defaults.baseURL).toBe(contract.endpoints[endpoint].service === 'competition' ? '/competitions/v1' : '/website/v1')
  })
  it.each(Object.entries(contract.endpoints).filter(([, spec]) => spec.response === 'document').map(([key]) => key as DetailEndpoint))('calls the %s detail with encoded identifiers', async endpoint => {
    const read = vi.spyOn(transport, 'read').mockResolvedValue({})
    await getDocument(endpoint, signal(), params)
    expect(read.mock.calls[0]![0]).toBe(endpointPath(endpoint, params))
  })
  it('has validated coherent preview payloads for every collection and document consumer', async () => {
    for (const [name] of Object.entries(contract.endpoints).filter(([, spec]) => spec.response === 'collection')) {
      expect(isCollection(previewResponse(name, {}, {}))).toBe(true)
    }
    for (const [name] of Object.entries(contract.endpoints).filter(([, spec]) => spec.response === 'document')) {
      const detailParams = { ...params, slug: ({ club: 'example-university.1', competition: 'example-university-2026.1', member: 'alex-example.1', 'resource-page': 'governance', serc: 'pool-rescue.1', casualty: 'sample-casualty.1' } as Record<string, string>)[name] || params.slug }
      expect(isDocumentResponse(previewResponse(name, detailParams, {}))).toBe(true)
    }
    config.previewMode = true
    expect((await getContactConfig(signal())).data.accepts_submissions).toBe(true)
    expect(isAccess(await getResourceAccess(signal(), 'sample-entry-pack'))).toBe(true)
  })
  it('rejects malformed collections and documents rather than letting views crash', () => {
    for (const value of [null, {}, { data: [], meta: { current_page: 0 } }, { data: [{ title: 'Bad' }] }]) expect(isCollection(value)).toBe(false)
    expect(isDocumentResponse({ data: { title: 'Bad' } })).toBe(false)
  })
  it('simulates contact submission in preview without sending a request', async () => {
    config.previewMode = true
    const post = vi.spyOn(apiClient, 'post')
    const receipt = await submitContact({ name: 'Sample', email: 'sample@example.test', department: 'chair', subject: 'Preview', message: 'Test' }, signal())
    expect(receipt.data.message).toContain('not sent')
    expect(post).not.toHaveBeenCalled()
  })
  it('does not silently replace failed live requests with sample data', async () => {
    vi.spyOn(transport, 'read').mockRejectedValue(new Error('Service unavailable'))
    await expect(getCollection('clubs', signal())).rejects.toThrow('Service unavailable')
  })
  it('reads presentation from the website service and supplies labelled preview configuration', async () => {
    const payload = previewResponse('presentation', {}, {})
    const read = vi.spyOn(transport, 'read').mockResolvedValue(payload)
    const live = await getPresentation(signal())
    expect(read.mock.calls[0]![0]).toBe('/presentation')
    expect(read.mock.calls[0]![4]!.defaults.baseURL).toBe('/website/v1')
    config.previewMode = true
    const preview = await getPresentation(signal())
    expect(preview).toEqual(live)
    expect(preview.banner_overrides['/welfare']).toBe('preview-welfare')
    expect(preview.campaigns[0]!.description).toContain('Sample campaign')
    expect(preview.championship_campaign?.title).toBe('Champs 2027')
    expect(read).toHaveBeenCalledTimes(1)
  })
  it('supports competition result links while accepting existing entry contracts', () => {
    const results = previewResponse('competitions', {}, {}) as { data: Array<{ results_link?: { label: string; url: string } }> }
    expect(isCollection(results)).toBe(true)
    expect(results.data[1]?.results_link?.url).toBe('/resources/view/sample-entry-pack')
    expect(isCollection({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } })).toBe(true)
  })
  it('does not replay failed writes or accept an unconfirmed success', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { unexpected: true } })
    await expect(submitContact({ name: 'Test', email: 'test@example.test', department: 'chair', subject: 'Hello', message: 'Message' }, signal())).rejects.toMatchObject({ kind: 'invalid_response' })
    expect(post).toHaveBeenCalledTimes(1)
  })
  it('allows safe document and contact links while blocking active and protocol-relative URLs', () => {
    for (const href of ['javascript:alert(1)', '//untrusted.test', 'data:text/html,hello', '/\\evil', 'java\nscript:bad']) expect(safeHref(href)).toBeNull()
    for (const href of ['/resources/view/one', 'https://storage.example.test/file?signature=abc', 'mailto:chair@bulsca.co.uk', 'tel:123']) expect(safeHref(href)).toBe(href)
  })
})
