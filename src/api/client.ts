import axios from 'axios'
import { ApiFailure, normalizeFailure } from './errors'
import { reportError } from '@/services/diagnostics'

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 8000,
  headers: { Accept: 'application/json' },
})

function wait(delay: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Request cancelled', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, delay)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}

/** Read-only retry policy. Mutations use apiClient directly and are never replayed. */
export async function read<T>(path: string, valid: (value: unknown) => value is T, signal: AbortSignal, routeTemplate: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await apiClient.get<unknown>(path, { signal })
      if (!valid(response.data)) throw new ApiFailure('invalid_response', 'This content could not be loaded. Please try again.')
      return response.data
    } catch (error) {
      if (signal.aborted || axios.isCancel(error)) throw new DOMException('Request cancelled', 'AbortError')
      const failure = normalizeFailure(error)
      if (attempt < 2 && (failure.kind === 'network' || [502, 503, 504].includes(failure.status ?? 0))) {
        await wait((attempt === 0 ? 500 : 1500) + Math.floor(Math.random() * 100), signal)
        continue
      }
      if (failure.kind === 'network' || failure.kind === 'server' || failure.kind === 'invalid_response') {
        reportError(failure.kind, routeTemplate, failure.status, failure.requestId)
      }
      throw failure
    }
  }
}
export default apiClient
