import type { HttpRequest } from '@svta/cml-utils'

/** POSTs through `fetch` with `keepalive` for bodies under 64 KB, so a flush on `pagehide` completes. */
export function defaultRequester(request: HttpRequest): Promise<{ status: number }> {
	const body = typeof request.body === 'string' ? request.body : ''
	return fetch(request.url, { method: request.method, headers: request.headers, body, keepalive: body.length < 65536 })
}
