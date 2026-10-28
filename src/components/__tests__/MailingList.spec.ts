import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import MailingList from '@/components/footer/MailingList.vue'
const config = vi.hoisted(() => ({ previewMode: false }))
vi.mock('@/config', () => config)
let wrapper: VueWrapper
beforeEach(() => {
  config.previewMode = false
})
afterEach(() => wrapper?.unmount())
describe('mailing-list form', () => {
  it('associates the email field with a visible label and consent wording', () => {
    wrapper = mount(MailingList)
    const input = wrapper.get('input[name="EMAIL"]')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('required')).toBeDefined()
    expect(input.attributes('autocomplete')).toBe('email')
    expect(wrapper.get(`#${input.attributes('aria-describedby')}`).text()).toContain('unsubscribe')
  })
  it('retains the live Mailchimp action and hidden subscription fields', () => {
    wrapper = mount(MailingList)
    expect(wrapper.get('form').attributes('method')).toBe('post')
    expect(wrapper.get('form').attributes('action')).toContain(
      'https://bulsca.us15.list-manage.com/subscribe/post?',
    )
    expect(
      wrapper.get('input[name="b_1b1c9887c1e5ff377f6979e66_94c67a5f8d"]').attributes('tabindex'),
    ).toBe('-1')
    expect((wrapper.get('input[name="gdpr[3427]"]').element as HTMLInputElement).checked).toBe(true)
    // Verify markup only: live submissions must never contact Mailchimp in tests.
  })
  it('prevents network submission and announces the preview outcome', async () => {
    config.previewMode = true
    wrapper = mount(MailingList)
    expect(wrapper.get('form').attributes('action')).toBeUndefined()
    const event = new Event('submit', { bubbles: true, cancelable: true })
    wrapper.get('form').element.dispatchEvent(event)
    await wrapper.vm.$nextTick()
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.get('[role="status"]').text()).toContain(
      'no mailing-list subscription was submitted',
    )
  })
  it('preserves caller-supplied form action and placeholder', () => {
    wrapper = mount(MailingList, {
      props: { action: 'https://mail.example.test/subscribe', placeholder: 'you@example.test' },
    })
    expect(wrapper.get('form').attributes('action')).toBe('https://mail.example.test/subscribe')
    expect(wrapper.get('input[type="email"]').attributes('placeholder')).toBe('you@example.test')
  })
})
