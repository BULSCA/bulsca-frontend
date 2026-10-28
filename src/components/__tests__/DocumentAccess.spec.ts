import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DocumentAccess from '../DocumentAccess.vue'
import { getResourceAccess } from '@/api/public'
import { ApiFailure } from '@/api/errors'
vi.mock('@/api/public', () => ({ getResourceAccess: vi.fn<typeof import('@/api/public').getResourceAccess>() }))
afterEach(() => vi.resetAllMocks())
describe('object-storage access links', () => {
  it('accepts signed HTTPS links without assuming a Laravel filesystem path', async () => {
    vi.mocked(getResourceAccess).mockResolvedValue({ data: { url: 'https://files.example.test/object?signature=abc', expires_at: '2099-01-01T00:00:00Z' } })
    const wrapper = mount(DocumentAccess, { props: { id: 'resource-1' } })
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(wrapper.get('a').attributes('href')).toBe('https://files.example.test/object?signature=abc')
    wrapper.unmount()
  })
  it('rejects unsafe links and keeps the document page usable', async () => {
    vi.mocked(getResourceAccess).mockResolvedValue({ data: { url: 'javascript:alert(1)' } })
    const wrapper = mount(DocumentAccess, { props: { id: 'resource-1' } })
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('usable download link was not returned')
    wrapper.unmount()
  })
  it('does not navigate using an expired signed link', async () => {
    vi.mocked(getResourceAccess).mockResolvedValue({ data: { url: 'https://files.example.test/old', expires_at: '2000-01-01T00:00:00Z' } })
    const wrapper = mount(DocumentAccess, { props: { id: 'resource-1' } })
    await wrapper.get('button').trigger('click'); await flushPromises()
    await wrapper.get('a').trigger('click')
    expect(wrapper.text()).toContain('link has expired')
    expect(wrapper.find('a').exists()).toBe(false)
    wrapper.unmount()
  })
  it('handles rejected access and resets data on a different document', async () => {
    vi.mocked(getResourceAccess).mockRejectedValue(new ApiFailure('forbidden', 'Access denied', 403))
    const wrapper = mount(DocumentAccess, { props: { id: 'private' } })
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(wrapper.text()).toContain('Access denied')
    await wrapper.setProps({ id: 'another' })
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
