import apiClient from './client'
import type { ApiResponse, Asset } from './types'
import type { AxiosResponse } from 'axios'

const MOCK = import.meta.env.VITE_API_MOCK === 'true'

const mockAssets: ApiResponse<Asset[]> = {
  data: [
    { id: 1, name: 'Annual Report 2025', type: 'pdf' },
    { id: 2, name: 'Org Logo Pack', type: 'zip' },
  ],
}

export function getAssets(): Promise<AxiosResponse<ApiResponse<Asset[]>>> {
  if (MOCK) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ data: mockAssets } as AxiosResponse), 400),
    )
  }
  return apiClient.get<ApiResponse<Asset[]>>('/assets')
}