export interface Tag {
  id?: number
  name: string
  slug: string
}

export interface Article {
  id: number
  slug?: string
  title: string
  content?: string
  excerpt?: string
  author?: string | null
  pinned?: boolean | number
  created_at?: string | null
  updated_at?: string | null
  views?: number
  thumbs_up?: number
  thumbs_down?: number
  tags?: Tag[]
}