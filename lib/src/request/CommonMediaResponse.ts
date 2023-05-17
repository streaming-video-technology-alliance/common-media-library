import { ResourceTiming } from './ResourceTiming'

/**
 * Common response API.
 * 
 * @group Request
 */

export interface CommonMediaResponse {
  /**
   * The final URL obtained after any redirects.
   */
  url?: string

  /**
   * Indicates whether or not the request was redirected.
   */
  redirected?: boolean

  /**
   * The HTTP status code of the response.
   */
  status?: number

  /**
   * The status message corresponding to the HTTP status code.
   */
  statusText?: string

  /**
   * The type of the response.
   */
  type?: string

  /**
   * The length as number of bytes of the response body payload.
   */
  length?: number

  /**
   * The response headers.
   */
  headers?: Record<string, string>

  /**
   * The response data.
   */
  data?: any

  /**
   * The network timing of the request/response.
   */
  resourceTiming: ResourceTiming
}
