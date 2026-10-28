import { shallowRef } from 'vue'
import { getPresentation } from '@/api/public'
import {
  isPresentationImage,
  parsePresentation,
  type PresentationConfig,
  type PresentationImage,
} from '@/api/presentation'
import { fallbackPresentation, bundledImages } from '@/content/presentation'
import { previewMode } from '@/config'

export const canonicalBannerPage = (path: string) =>
  path.split(/[?#]/)[0]!.replace(/\/+$/, '') || '/'
interface StoreOptions {
  load?: (signal: AbortSignal) => Promise<PresentationConfig>
  storage?: () => Storage | undefined
  mode?: () => string
  random?: () => number
}
export function createPresentationStore(options: StoreOptions = {}) {
  const config = shallowRef<PresentationConfig>(fallbackPresentation)
  let activeMode = ''
  let started = false
  let controller: AbortController | undefined
  let pending: Promise<void> | undefined
  let choices = new Map<string, PresentationImage>()
  let failedUrls = new Set<string>()
  const mode = options.mode || (() => (previewMode ? 'preview' : 'live'))
  const storage =
    options.storage || (() => (typeof window === 'undefined' ? undefined : window.sessionStorage))
  const key = (part: string) => `bulsca:presentation:v1:${activeMode}:${part}`
  function read(part: string): unknown {
    try {
      const value = storage()?.getItem(key(part))
      return value ? JSON.parse(value) : undefined
    } catch {
      return undefined
    }
  }
  function write(part: string, value: unknown) {
    try {
      storage()?.setItem(key(part), JSON.stringify(value))
    } catch {
      /* Memory state remains usable when storage is blocked or full. */
    }
  }
  function setupMode() {
    if (activeMode === mode()) return
    controller?.abort()
    pending = undefined
    started = false
    activeMode = mode()
    config.value = parsePresentation({ data: read('config') }) || fallbackPresentation
    choices = new Map()
    const saved = read('choices')
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const [page, image] of Object.entries(saved))
        if (page.startsWith('/') && isPresentationImage(image)) choices.set(page, image)
    }
    const failed = read('failed-images')
    failedUrls = new Set(
      Array.isArray(failed) ? failed.filter((url): url is string => typeof url === 'string') : [],
    )
  }
  function ensure(): Promise<void> {
    setupMode()
    if (pending) return pending
    if (started) return Promise.resolve()
    started = true
    const requestMode = activeMode
    const requestController = new AbortController()
    controller = requestController
    pending = Promise.resolve()
      .then(() => (options.load || getPresentation)(requestController.signal))
      .then((value) => {
        if (requestMode !== activeMode || requestController.signal.aborted) return
        // Cached/API data is checked again at the state boundary, including injected test loaders.
        const safe = parsePresentation({ data: value })
        if (safe) {
          config.value = safe
          write('config', safe)
        }
      })
      .catch(() => {
        /* The API reader reports failures. Keep cached/local presentation usable. */
      })
      .finally(() => {
        if (requestMode === activeMode) pending = undefined
      })
    return pending
  }
  function choose(path: string): PresentationImage | null {
    setupMode()
    const page = canonicalBannerPage(path)
    const forcedId = config.value.banner_overrides[page]
    const forced = config.value.banner_pool.find(
      (image) => image.id === forcedId && !failedUrls.has(image.url),
    )
    const remote = config.value.banner_pool.filter((image) => !failedUrls.has(image.url))
    const available = forced
      ? [forced]
      : remote.length
        ? remote
        : bundledImages.filter((image) => !failedUrls.has(image.url))
    const saved = choices.get(page)
    const previous =
      saved && available.find((image) => image.id === saved.id && image.url === saved.url)
    const selected =
      previous ||
      available[
        Math.min(
          available.length - 1,
          Math.max(0, Math.floor((options.random || Math.random)() * available.length)),
        )
      ] ||
      null
    if (selected) choices.set(page, selected)
    else choices.delete(page)
    write('choices', Object.fromEntries(choices))
    return selected
  }
  function imageFailed(path: string, image: PresentationImage) {
    setupMode()
    failedUrls.add(image.url)
    choices.delete(canonicalBannerPage(path))
    write('failed-images', [...failedUrls])
    return choose(path)
  }
  return { config, ensure, choose, imageFailed }
}
export const presentation = createPresentationStore()
