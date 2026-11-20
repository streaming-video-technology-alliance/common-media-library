import type { HttpRequest } from './HttpRequest.ts'
import type { HttpResponse } from './HttpResponse.ts'

/**
 * A function that sends an `HttpRequest` and resolves with an `HttpResponse`.
 *
 * `fetchRequester` is a requester that uses `fetch`. A player passes a
 * requester of its own to use its network stack and its request hooks.
 *
 * @public
 */
export type HttpRequester = (request: HttpRequest) => Promise<HttpResponse>
