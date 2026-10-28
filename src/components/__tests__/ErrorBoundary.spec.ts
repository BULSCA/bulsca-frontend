import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ErrorBoundary from '../ErrorBoundary.vue'
vi.mock('@/services/diagnostics', () => ({ reportError: vi.fn<() => void>() }))
describe('section error boundary', () => {
  it('isolates a crashing child, preserves siblings, and can recover', async () => {
    let broken = true
    const Child = defineComponent({ setup: () => () => { if (broken) throw new Error('private detail'); return h('p', 'Recovered') } })
    const wrapper = mount(defineComponent({ render: () => h('div', [h('nav', 'Navigation'), h(ErrorBoundary, {}, { default: () => h(Child) }), h('footer', 'Footer')]) }))
    await nextTick()
    expect(wrapper.text()).toContain('temporarily unavailable')
    expect(wrapper.text()).toContain('Navigation')
    expect(wrapper.text()).toContain('Footer')
    expect(wrapper.text()).not.toContain('private detail')
    broken = false
    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toContain('Recovered')
  })
  it('provides a retry action to a custom page fallback', async () => {
    let broken = true
    const Child = defineComponent({ setup: () => () => { if (broken) throw new Error('private detail'); return h('p', 'Recovered') } })
    const wrapper = mount(ErrorBoundary, { slots: {
      default: () => h(Child),
      fallback: ({ retry }: { retry: () => void }) => h('main', [h('h1', 'Page unavailable'), h('button', { onClick: retry }, 'Retry page')]),
    } })
    await nextTick()
    expect(wrapper.get('h1').text()).toBe('Page unavailable')
    broken = false
    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toBe('Recovered')
    wrapper.unmount()
  })
})
