type Category = 'network' | 'server' | 'invalid_response' | 'component' | 'route' | 'unhandled'
type Report = { app: 'public'; app_version: string; event_id: string; category: Category; message: string; route_template: string; status?: number; request_id?: string }
type Queued = { report: Report; time: number }
const queue: Queued[] = []
const recent = new Map<string, number>()
let running = false
let timer: ReturnType<typeof setTimeout> | undefined
let retryDelay = 5000
const lifetime = 30 * 60 * 1000

// Memory-only. No raw exception text, URLs, credentials or form data are accepted.
export function reportError(category: Category, routeTemplate = '/unknown', status?: number, requestId?: string) {
  try {
    const route = /^\/[a-zA-Z0-9_/:{}-]{0,127}$/.test(routeTemplate) ? routeTemplate : '/unknown'
    const id = requestId && /^[0-9a-f-]{36}$/i.test(requestId) ? requestId : undefined
    const fingerprint = `${category}:${route}:${status ?? ''}:${id ?? ''}`
    const now = Date.now()
    for (const [key, time] of recent) if (now - time > lifetime) recent.delete(key)
    if (recent.has(fingerprint)) return
    if (recent.size >= 100) recent.delete(recent.keys().next().value!)
    recent.set(fingerprint, now)
    while (queue.length >= 20) queue.shift()
    queue.push({ time: now, report: {
      app: 'public', app_version: 'dev', event_id: crypto.randomUUID(), category,
      message: ['network', 'server', 'invalid_response'].includes(category) ? 'Request failed' : 'Unexpected interface error',
      route_template: route, ...(status !== undefined && status >= 400 && status <= 599 ? { status } : {}),
      ...(id ? { request_id: id } : {}),
    } })
    schedule(0)
  } catch { /* Telemetry must never break rendering, even without browser APIs. */ }
}
function schedule(delay: number) {
  if (timer !== undefined || typeof window === 'undefined') return
  timer = setTimeout(() => { timer = undefined; void flushReports() }, delay)
}
export async function flushReports() {
  if (running || typeof navigator === 'undefined' || !navigator.onLine) return
  if (timer !== undefined) { clearTimeout(timer); timer = undefined }
  running = true
  try {
    while (queue.length) {
      const entry = queue[0]!
      if (Date.now() - entry.time > lifetime) { queue.shift(); continue }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      try {
        // Independent transport: failures here cannot re-enter API error reporting.
        const response = await fetch('/api/v1/client-errors', {
          method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(entry.report), signal: controller.signal,
        })
        if (!response.ok && ![400, 413, 422].includes(response.status)) {
          const seconds = Number(response.headers?.get('Retry-After'))
          if (Number.isFinite(seconds) && seconds > 0) retryDelay = Math.max(retryDelay, Math.min(seconds * 1000, 300_000))
          break
        }
        const index = queue.indexOf(entry)
        if (index !== -1) queue.splice(index, 1)
        retryDelay = 5000
      } catch { break } finally { clearTimeout(timeout) }
    }
  } finally {
    running = false
    if (queue.length) { schedule(retryDelay); retryDelay = Math.min(retryDelay * 2, 60_000) }
  }
}
export function installDiagnostics() {
  window.addEventListener('online', () => { void flushReports() })
  window.addEventListener('unhandledrejection', event => {
    if (event.reason?.name !== 'AbortError' && event.reason?.code !== 'ERR_CANCELED') reportError('unhandled')
  })
}
