export function useReferrer() {
  const ref = typeof document !== 'undefined' ? document.referrer : ''
  const host = (() => {
    try {
      if (!ref) return 'direct'
      const u = new URL(ref)
      return u.hostname
    } catch {
      return 'direct'
    }
  })()
  return { hostEncoded: encodeURIComponent(host) }
}