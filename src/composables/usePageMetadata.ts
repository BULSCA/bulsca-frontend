import { watch } from 'vue'
import { useRoute } from 'vue-router'
export const defaultDescription = 'University lifesaving clubs, competitions, results, training resources and news from BULSCA.'
export function setPageMetadata(title: string, description = defaultDescription) {
  if (typeof document === 'undefined') return
  document.title = `${title || 'University lifesaving'} | BULSCA`
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
  meta.content = description || defaultDescription
}
export function usePageMetadata(title: () => string, description: () => string = () => defaultDescription) {
  const route = useRoute()
  watch([title, description, () => route.fullPath], ([name, text]) => setPageMetadata(name, text), { immediate: true, flush: 'post' })
}
