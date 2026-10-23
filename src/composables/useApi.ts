import { getCurrentScope, onScopeDispose, shallowRef, ref } from 'vue'
import { normalizeFailure, type ApiFailure } from '@/api/errors'

export function useApi<T, Args extends unknown[]>(request: (signal: AbortSignal, ...args: Args) => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const error = shallowRef<ApiFailure | null>(null)
  const loading = ref(false)
  let controller: AbortController | undefined
  let sequence = 0
  function cancel() { sequence++; controller?.abort(); loading.value = false }
  function clear() { cancel(); data.value = null; error.value = null }
  async function execute(...args: Args): Promise<boolean> {
    controller?.abort()
    const active = new AbortController()
    controller = active
    const current = ++sequence
    loading.value = true
    error.value = null
    try {
      const result = await request(active.signal, ...args)
      if (current !== sequence) return false
      data.value = result
      return true
    } catch (failure) {
      if (current === sequence && !active.signal.aborted) error.value = normalizeFailure(failure)
      return false
    } finally {
      if (current === sequence) loading.value = false
    }
  }
  if (getCurrentScope()) onScopeDispose(cancel)
  return { data, error, loading, execute, clear }
}
