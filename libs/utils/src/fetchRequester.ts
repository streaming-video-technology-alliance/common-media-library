import type { HttpRequest } from './HttpRequest.ts'
import type { HttpResponse } from './HttpResponse.ts'

/**
 * Sends the request with `fetch`.
 *
 * The function passes `url`, `method`, `headers`, `body`, `credentials`, and
 * `mode` to `fetch`. The response has the response text as `data`, every
 * response header in `headers`, and the URL after redirects in `url`. The
 * function ignores `responseType` and `timeout`.
 *
 * @example
 * {@includeCode ../test/fetchRequester.test.ts#example}
 *
 * @param request - The request
 * @returns A promise of the response
 *
 * @public
 */
export function fetchRequester(request: HttpRequest): Promise<HttpResponse> {
	const { url, method, headers, body, credentials, mode } = request

	return fetch(url, { method, headers, body, credentials, mode }).then(response =>
		response.text().then(data => {
			const responseHeaders: Record<string, string> = {}

			response.headers.forEach((value, key) => {
				responseHeaders[key] = value
			})

			return { request, url: response.url, status: response.status, headers: responseHeaders, data }
		}),
	)
}
