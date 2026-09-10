import type { HttpRequest } from '@svta/cml-utils'

/**
 * Sends one event-mode POST and resolves with the response status. The default uses `fetch` with `keepalive`.
 *
 * @public
 */
export type CmcdRequester = (request: HttpRequest) => Promise<{ status: number }>
