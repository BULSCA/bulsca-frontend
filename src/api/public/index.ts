import axios from 'axios'
import apiClient, { read } from '../client'
import { ApiFailure, normalizeFailure } from '../errors'
import { competitionApiBase, previewMode } from '@/config'
import { reportError } from '@/services/diagnostics'
import contract from './contract.json'
import { isAccess, isCollection, isContactConfig, isDocumentResponse, isReceipt } from './validation'
import type { ContactSubmission } from './types'

export type Endpoint = keyof typeof contract.endpoints
export type CollectionEndpoint = 'highlights' | 'social' | 'clubs' | 'committees' | 'competitions' | 'championships' | 'seasons' | 'resource-pages' | 'resources' | 'sercs' | 'casualties'
export type DetailEndpoint = 'club' | 'committee' | 'member' | 'competition' | 'championship' | 'league' | 'resource-page' | 'resource' | 'serc' | 'casualty'
export type Params = Record<string, string>
const competitionClient = axios.create({ baseURL: competitionApiBase, timeout: 8000, headers: { Accept: 'application/json' } })

export function endpointPath(endpoint: Endpoint, params: Params = {}, query: Params = {}) {
  const path = contract.endpoints[endpoint].path.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!params[key]) throw new Error(`Missing endpoint parameter: ${key}`)
    return encodeURIComponent(params[key])
  })
  const suffix = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== '')).toString()
  return path + (suffix ? `?${suffix}` : '')
}
async function request<T>(endpoint: Endpoint, valid: (value: unknown) => value is T, signal: AbortSignal, params: Params = {}, query: Params = {}): Promise<T> {
  signal.throwIfAborted()
  if (previewMode) {
    const { previewResponse } = await import('@/preview/service')
    signal.throwIfAborted()
    const result: unknown = structuredClone(previewResponse(endpoint, params, query))
    if (!valid(result)) throw new ApiFailure('invalid_response', 'This preview data is unavailable.')
    return result
  }
  return read(endpointPath(endpoint, params, query), valid, signal, contract.endpoints[endpoint].path, contract.endpoints[endpoint].service === 'competition' ? competitionClient : apiClient)
}
export const getCollection = (endpoint: CollectionEndpoint, signal: AbortSignal, query: Params = {}) => request(endpoint, isCollection, signal, {}, query)
export const getDocument = (endpoint: DetailEndpoint, signal: AbortSignal, params: Params) => request(endpoint, isDocumentResponse, signal, params)
export const getResourceAccess = (signal: AbortSignal, id: string) => request('resource-access', isAccess, signal, { id })
export const getContactConfig = (signal: AbortSignal) => request('contact-config', isContactConfig, signal)
export async function submitContact(payload: ContactSubmission, signal: AbortSignal) {
  signal.throwIfAborted()
  if (previewMode) return { data: { message: 'Preview only: your message was not sent.' } }
  try {
    const response = await apiClient.post<unknown>(endpointPath('contact-submit'), payload, { signal })
    if (!isReceipt(response.data)) throw new ApiFailure('invalid_response', 'We could not confirm delivery. Please contact the department directly before sending again.')
    return response.data
  } catch (error) {
    if (signal.aborted || axios.isCancel(error)) throw new DOMException('Request cancelled', 'AbortError')
    const failure = normalizeFailure(error)
    if (failure.kind === 'server' || failure.kind === 'network' || failure.kind === 'invalid_response') reportError(failure.kind, '/contact-form', failure.status, failure.requestId)
    throw failure
  }
}
