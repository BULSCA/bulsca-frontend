import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RequestError from '../RequestError.vue'
import { ApiFailure } from '@/api/errors'
afterEach(() => vi.useRealTimers())
describe('request recovery messages', () => {
  it('shows safe request references and preserves a stale-content explanation', () => {
    const wrapper = mount(RequestError, { props: { error: new ApiFailure('server', 'Unavailable', 500, 'reference'), stale: true } })
    expect(wrapper.get('[role="alert"]').text()).toContain('previously loaded')
    expect(wrapper.text()).toContain('reference')
  })
  it('respects Retry-After before allowing a manual retry', async () => {
    vi.useFakeTimers()
    const wrapper = mount(RequestError, { props: { error: new ApiFailure('rate_limited', 'Please wait', 429, undefined, 30) } })
    expect(wrapper.get('button').attributes()).toHaveProperty('disabled')
    await vi.advanceTimersByTimeAsync(30_000)
    expect(wrapper.get('button').attributes()).not.toHaveProperty('disabled')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    wrapper.unmount()
  })
  it('does not offer a retry for missing or forbidden content', () => {
    for (const kind of ['not_found', 'forbidden'] as const) {
      const wrapper = mount(RequestError, { props: { error: new ApiFailure(kind, 'Unavailable') } })
      expect(wrapper.find('button').exists()).toBe(false)
      wrapper.unmount()
    }
  })
})
