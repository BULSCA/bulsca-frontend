import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import HomeCarousel from '@/components/HomeCarousel.vue'
import { presentation } from '@/services/presentation'
import { fallbackPresentation } from '@/content/presentation'

vi.mock('@/services/presentation', async () => {
  const { shallowRef } = await import('vue')
  const { fallbackPresentation } = await import('@/content/presentation')
  return {
    presentation: {
      config: shallowRef(fallbackPresentation),
      ensure: vi.fn<() => Promise<void>>(async () => {}),
    },
  }
})
let wrapper: VueWrapper
let motionChanged: (() => void) | undefined
let reduced = false
const removeMotion = vi.fn<(...args: unknown[]) => void>()
const activeId = () => wrapper.get('[aria-roledescription="slide"]').attributes('data-slide-id')
const button = (label: string) => wrapper.get(`button[aria-label="${label}"]`)
function show() {
  wrapper = mount(HomeCarousel, {
    props: { highlights: [] },
    global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
  })
  return wrapper
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-10T12:00:00Z'))
  presentation.config.value = fallbackPresentation
  reduced = false
  motionChanged = undefined
  removeMotion.mockClear()
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return reduced
      },
      addEventListener: (_event: string, callback: () => void) => {
        motionChanged = callback
      },
      removeEventListener: removeMotion,
    })),
  )
})
afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
describe('accessible homepage carousel', () => {
  it('rotates every six seconds and exposes only the active slide link', async () => {
    show()
    expect(activeId()).toBe('brand-swimmer')
    expect(wrapper.findAll('.carousel-slide a')).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(5999)
    expect(activeId()).toBe('brand-swimmer')
    await vi.advanceTimersByTimeAsync(1)
    expect(activeId()).toBe('brand-clubs')
    expect(wrapper.findAll('.carousel-slide')).toHaveLength(1)
    expect(wrapper.get('[aria-current="true"]').attributes('aria-label')).toContain('By students')
  })
  it('pauses after manual navigation, supports dots and arrows, and resumes with Play', async () => {
    show()
    await button('Next slide').trigger('click')
    expect(activeId()).toBe('brand-clubs')
    await vi.advanceTimersByTimeAsync(18_000)
    expect(activeId()).toBe('brand-clubs')
    await wrapper.get('.home-carousel').trigger('keydown', { key: 'ArrowLeft' })
    expect(activeId()).toBe('brand-swimmer')
    await wrapper.get('button[aria-label^="Show slide 2"]').trigger('click')
    expect(activeId()).toBe('brand-clubs')
    await button('Play slideshow').trigger('click')
    await vi.advanceTimersByTimeAsync(6000)
    expect(activeId()).toBe('brand-swimmer')
    await button('Previous slide').trigger('click')
    expect(activeId()).toBe('brand-clubs')
    expect(wrapper.get('[aria-roledescription="slide"]').attributes('aria-live')).toBe('polite')
  })
  it('pauses on hover and keyboard focus, then resumes after leaving', async () => {
    show()
    await wrapper.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(6000)
    expect(activeId()).toBe('brand-swimmer')
    await wrapper.trigger('mouseleave')
    await wrapper.trigger('focusin')
    await vi.advanceTimersByTimeAsync(6000)
    expect(activeId()).toBe('brand-swimmer')
    await wrapper.trigger('focusout', { relatedTarget: null })
    await vi.advanceTimersByTimeAsync(6000)
    expect(activeId()).toBe('brand-clubs')
  })
  it('pauses while the document is hidden', async () => {
    show()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    await vi.advanceTimersByTimeAsync(6000)
    expect(activeId()).toBe('brand-swimmer')
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    await vi.advanceTimersByTimeAsync(6000)
    expect(activeId()).toBe('brand-clubs')
  })
  it('honours reduced motion initially and when the preference changes', async () => {
    reduced = true
    show()
    await nextTick()
    expect(
      button('Automatic rotation disabled for reduced motion').attributes('disabled'),
    ).toBeDefined()
    await vi.advanceTimersByTimeAsync(12_000)
    expect(activeId()).toBe('brand-swimmer')
    await button('Next slide').trigger('click')
    expect(activeId()).toBe('brand-clubs')
    reduced = false
    motionChanged!()
    await nextTick()
    await button('Play slideshow').trigger('click')
    await vi.advanceTimersByTimeAsync(6000)
    expect(activeId()).toBe('brand-swimmer')
    reduced = true
    motionChanged!()
    await vi.advanceTimersByTimeAsync(12_000)
    expect(activeId()).toBe('brand-swimmer')
  })
  it('preserves the active slide when asynchronous competition and campaign data arrive', async () => {
    show()
    await button('Next slide').trigger('click')
    presentation.config.value = {
      ...fallbackPresentation,
      campaigns: [{ id: 'new', title: 'Volunteer', image_url: '/team.jpg', order: 0 }],
    }
    await wrapper.setProps({
      highlights: [
        { id: 1, slug: 'event.1', kind: 'competitions', title: 'Event', date: '2026-06-11' },
      ],
    })
    expect(activeId()).toBe('brand-clubs')
    expect(wrapper.findAll('.carousel-dots button')).toHaveLength(4)
  })
  it('moves safely to a remaining slide when the current campaign expires', async () => {
    presentation.config.value = {
      ...fallbackPresentation,
      campaigns: [
        {
          id: 'short',
          title: 'Today only',
          image_url: '/team.jpg',
          order: 0,
          ends_at: '2026-06-10T12:01:00Z',
        },
      ],
    }
    show()
    await button('Pause slideshow').trigger('click')
    expect(activeId()).toBe('campaign:short')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(activeId()).toBe('brand-swimmer')
    expect(wrapper.text()).not.toContain('Today only')
  })
  it('falls back from a broken campaign image and stops if every bundled image fails', async () => {
    presentation.config.value = {
      ...fallbackPresentation,
      campaigns: [{ id: 'photo', title: 'Campaign', image_url: '/missing.jpg', order: 0 }],
    }
    show()
    await wrapper.get('.hero-photo').trigger('error')
    expect(wrapper.get('.hero-photo').attributes('src')).not.toBe('/missing.jpg')
    for (let i = 0; i < 3; i++) await wrapper.get('.hero-photo').trigger('error')
    expect(wrapper.find('.hero-photo').exists()).toBe(false)
    expect(wrapper.text()).toContain('Campaign')
    expect(wrapper.find('button[aria-label="Next slide"]').exists()).toBe(true)
  })
  it('cleans up timers and media/visibility listeners when navigating away', async () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    show()
    await flushPromises()
    expect(vi.getTimerCount()).toBe(2)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
    expect(removeMotion).toHaveBeenCalledWith('change', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})
