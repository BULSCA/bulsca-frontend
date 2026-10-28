export interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => boolean
  retry: 'never'
}
export interface TurnstileApi { render: (container: HTMLElement, options: TurnstileOptions) => string; remove: (id: string) => void }
declare global { interface Window { turnstile?: TurnstileApi } }
let pending: Promise<TurnstileApi> | undefined
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (pending) return pending
  pending = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    const failed = () => { clearTimeout(timer); script.remove(); pending = undefined; reject(new Error('Verification unavailable')) }
    const timer = setTimeout(failed, 10_000)
    script.onerror = failed
    script.onload = () => { clearTimeout(timer); if (window.turnstile) resolve(window.turnstile); else failed() }
    document.head.appendChild(script)
  })
  return pending
}
