// src/composables/useApi.ts
import { ref, type Ref } from 'vue'
import type { AxiosResponse } from 'axios'
import type { ApiResponse } from '@/api/types'

export function useApi<T>(requestFn: (...args: any[]) => Promise<AxiosResponse<ApiResponse<T>>>) {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function execute(...args: any[]) {
    loading.value = true
    error.value = null
    try {
      const response = await requestFn(...args)
      data.value = response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.message ?? 'Could not reach the server.'
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}