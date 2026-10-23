import axios from 'axios'

export type FailureKind = 'network' | 'server' | 'invalid_response' | 'not_found' | 'forbidden' | 'session' | 'validation' | 'rate_limited'
export class ApiFailure extends Error {
  constructor(public kind: FailureKind, message: string, public status?: number, public requestId?: string, public retryAfter?: number) { super(message) }
}
export function normalizeFailure(error: unknown): ApiFailure {
  if (error instanceof ApiFailure) return error
  if (!axios.isAxiosError(error)) return new ApiFailure('network', 'We could not load this content. Please try again.')
  const status = error.response?.status
  const candidate = error.response?.headers['x-request-id']
  const requestId = typeof candidate === 'string' && /^[0-9a-f-]{36}$/i.test(candidate) ? candidate : undefined
  const header = error.response?.headers['retry-after']
  const seconds = typeof header === 'string' ? (/^\d+$/.test(header) ? Number(header) : Math.ceil((Date.parse(header) - Date.now()) / 1000)) : undefined
  const retryAfter = seconds !== undefined && Number.isFinite(seconds) ? Math.max(0, seconds) : undefined
  if (status === 404) return new ApiFailure('not_found', 'This content could not be found.', status, requestId)
  if (status === 403) return new ApiFailure('forbidden', 'You do not have access to this content.', status, requestId)
  if (status === 401 || status === 419) return new ApiFailure('session', 'Your session has expired. Please sign in again.', status, requestId)
  if (status === 422) return new ApiFailure('validation', 'Please check the submitted fields.', status, requestId)
  if (status === 429) return new ApiFailure('rate_limited', 'Too many requests. Please wait before trying again.', status, requestId, retryAfter)
  return new ApiFailure(status ? 'server' : 'network', 'This content is temporarily unavailable. Please try again.', status, requestId)
}
