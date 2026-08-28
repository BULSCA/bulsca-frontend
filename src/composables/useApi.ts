// src/composables/useApi.ts
import { ref, type Ref } from 'vue'
import type { AxiosResponse } from 'axios'
import type { ApiResponse } from '@/api/types'

export function useApi<T, Args extends unknown[] = unknown[]>(
  requestFn: (...args: Args) => Promise<AxiosResponse<ApiResponse<T> | T>>,
) {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function execute(...args: Args) {
    loading.value = true
    error.value = null
    try {
      const response = await requestFn(...args)
      const resData = response.data as ApiResponse<T> | T
      if (resData && typeof resData === 'object' && 'data' in resData) {
        data.value = (resData as ApiResponse<T>).data
      } else {
        data.value = resData as T
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      error.value = axiosErr.response?.data?.message ?? 'Could not reach the server.'
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}