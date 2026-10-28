import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ContactVerification from '../ContactVerification.vue'
import { loadTurnstile, type TurnstileOptions } from '@/services/turnstile'
vi.mock('@/services/turnstile', () => ({ loadTurnstile: vi.fn<typeof import('@/services/turnstile').loadTurnstile>() }))
afterEach(() => vi.resetAllMocks())
describe('contact verification lifecycle', () => {
  it('emits a verified token, clears it on expiry, and removes its widget on unmount', async () => {
    let options!: TurnstileOptions
    const remove = vi.fn<(id: string) => void>()
    vi.mocked(loadTurnstile).mockResolvedValue({ render: (_el, config) => { options = config; return 'widget' }, remove })
    const wrapper = mount(ContactVerification, { props: { sitekey: 'public-key' } }); await flushPromises()
    options.callback('token'); expect(wrapper.emitted('token')?.pop()).toEqual(['token'])
    options['expired-callback'](); await flushPromises()
    expect(wrapper.text()).toContain('expired')
    wrapper.unmount(); expect(remove).toHaveBeenCalledWith('widget')
  })
  it('contains script/widget failures and offers manual recovery', async () => {
    vi.mocked(loadTurnstile).mockRejectedValueOnce(new Error('script unavailable')).mockResolvedValue({ render: () => 'widget', remove: () => {} })
    const wrapper = mount(ContactVerification, { props: { sitekey: 'public-key' } }); await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Verification is unavailable')
    await wrapper.get('button').trigger('click'); await flushPromises()
    expect(loadTurnstile).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
