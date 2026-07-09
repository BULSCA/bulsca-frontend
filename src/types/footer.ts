export interface LinkItem {
  label: string
  to?: string      // internal router path
  href?: string    // external link
  external?: boolean
}

export interface SocialItem {
  href: string
  imgSrc: string
  alt?: string
}