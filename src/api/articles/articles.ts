import apiClient from '../client'
import type { ApiResponse } from '../types'
import type { Article } from './types'
import type { AxiosResponse } from 'axios'


export function getAssets(): Promise<AxiosResponse<ApiResponse<Article[]>>> {
  return apiClient.get<ApiResponse<Article[]>>('/articles')
}