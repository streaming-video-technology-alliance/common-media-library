import type { HttpRequest } from '@svta/cml-utils'

/**
 * Sends one event-mode POST and resolves with the response status. The default uses `fetch` with `keepalive`.
 * A requester should reject when the network request fails. The session then reports that error as the `cause`.
 *
 * @public
 */
export type CmcdRequester = (request: HttpRequest) => Promise<{ status: number }>
