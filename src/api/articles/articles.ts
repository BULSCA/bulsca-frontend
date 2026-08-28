import apiClient from '../client'
import type { ApiResponse } from '../types'
import type { Article } from './types'
import type { AxiosResponse } from 'axios'

export function getArticles(): Promise<AxiosResponse<ApiResponse<Article[]>>> {
  return apiClient.get<ApiResponse<Article[]>>('/articles')
}

// Alias for backwards compatibility
export const getAssets = getArticles

export function getArticleBySlug(slug: string): Promise<AxiosResponse<ApiResponse<Article>>> {
  return apiClient.get<ApiResponse<Article>>(`/articles/${slug}`)
}