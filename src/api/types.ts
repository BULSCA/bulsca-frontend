export interface Asset {
  id: number
  name: string
  type: string
}

export interface ApiResponse<T> {
  data: T
  meta?: { total: number; page: number }
}