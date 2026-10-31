import type { HttpRequest, HttpResponse } from '@svta/cml-utils'

/**
 * A requester that sends the request with `fetch`.
 *
 * The response has the response text as `data`. The response has every
 * response header in `headers`.
 *
 * @param request - The Steering Manifest request.
 * @returns A promise of the response.
 *
 * @beta
 */
export function fetchRequester(request: HttpRequest): Promise<HttpResponse> {
	const { url, method, headers, credentials, mode } = request

	return fetch(url, { method, headers, credentials, mode }).then(response =>
		response.text().then(data => {
			const responseHeaders: Record<string, string> = {}

			response.headers.forEach((value, key) => {
				responseHeaders[key] = value
			})

			return { request, url: response.url, status: response.status, headers: responseHeaders, data }
		}),
	)
}
