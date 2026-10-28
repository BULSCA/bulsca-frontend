import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import ContactFormView from '../ContactFormView.vue'
import { getContactConfig, submitContact } from '@/api/public'
import { ApiFailure } from '@/api/errors'
const config = vi.hoisted(() => ({ previewMode: false }))
vi.mock('@/config', () => config)
vi.mock('@/api/public', () => ({
  getContactConfig: vi.fn<typeof import('@/api/public').getContactConfig>(),
  submitContact: vi.fn<typeof import('@/api/public').submitContact>(),
}))
let wrapper: VueWrapper | undefined
beforeEach(() => { config.previewMode = false; vi.mocked(getContactConfig).mockResolvedValue({ data: { turnstile_site_key: 'test-key', accepts_submissions: true } }) })
afterEach(() => { wrapper?.unmount(); vi.resetAllMocks() })
async function form(query = '') {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/contact-form', component: ContactFormView }, { path: '/contact', component: { template: '<p>Contact</p>' } }, { path: '/', component: { template: '<p>Home</p>' } }] })
  await router.push(`/contact-form${query}`); await router.isReady()
  wrapper = mount(ContactFormView, { global: { plugins: [router], stubs: { ContactVerification: { template: '<button type="button" data-verify @click="$emit(\'token\', \'verified\')">Verify</button>', emits: ['token'] } } } })
  await flushPromises()
  return wrapper
}
async function fill(wrapper: VueWrapper) {
  await wrapper.get('#name').setValue('Test Person'); await wrapper.get('#email').setValue('test@example.test')
  await wrapper.get('#subject').setValue('An enquiry'); await wrapper.get('#message').setValue('Please send information.')
}
describe('contact form', () => {
  it('uses department query state and provides direct email when the API is unavailable', async () => {
    vi.mocked(getContactConfig).mockRejectedValue(new ApiFailure('network', 'Unavailable'))
    const app = await form('?department=welfare')
    expect((app.get('#department').element as HTMLSelectElement).value).toBe('welfare')
    expect(app.find('a[href="mailto:welfare@bulsca.co.uk"]').exists()).toBe(true)
    expect(app.get('button[type="submit"]').attributes()).toHaveProperty('disabled')
    await app.get('#message').setValue('A draft')
    expect((app.get('#message').element as HTMLTextAreaElement).value).toBe('A draft')
  })
  it('validates required fields without sending a request', async () => {
    const app = await form(); await app.get('[data-verify]').trigger('click'); await app.get('form').trigger('submit')
    expect(app.get('#name-error').text()).toContain('complete')
    expect(submitContact).not.toHaveBeenCalled()
  })
  it('requires verification for live submission', async () => {
    const app = await form(); await fill(app)
    expect(app.get('button[type="submit"]').attributes()).toHaveProperty('disabled')
    await app.get('[data-verify]').trigger('click')
    expect(app.get('button[type="submit"]').attributes()).not.toHaveProperty('disabled')
  })
  it('keeps the draft and maps validation errors after a failed submission', async () => {
    vi.mocked(submitContact).mockRejectedValue(new ApiFailure('validation', 'Check fields', 422, undefined, undefined, { email: ['Invalid'] }))
    const app = await form(); await fill(app); await app.get('[data-verify]').trigger('click'); await app.get('form').trigger('submit'); await flushPromises()
    expect((app.get('#message').element as HTMLTextAreaElement).value).toBe('Please send information.')
    expect(app.get('#email-error').text()).toBe('Please check this field.')
  })
  it('prevents duplicate writes and does not claim success after an uncertain failure', async () => {
    let reject!: (reason: unknown) => void
    vi.mocked(submitContact).mockImplementation(() => new Promise((_resolve, failure) => { reject = failure }))
    const app = await form(); await fill(app); await app.get('[data-verify]').trigger('click')
    await app.get('form').trigger('submit'); await app.get('form').trigger('submit')
    expect(submitContact).toHaveBeenCalledTimes(1)
    reject(new ApiFailure('network', 'Unavailable')); await flushPromises()
    expect(app.text()).toContain('Delivery could not be confirmed')
    expect(app.text()).not.toContain('Your message was accepted')
  })
  it('clearly marks simulated submissions in preview mode', async () => {
    config.previewMode = true
    vi.mocked(submitContact).mockResolvedValue({ data: { message: 'Preview only' } })
    const app = await form(); await fill(app); await app.get('form').trigger('submit'); await flushPromises()
    expect(app.text()).toContain('Preview only: your message was not sent.')
  })
})
