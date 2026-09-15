import type { HttpRequest } from '@svta/cml-utils'
import type { CmcdRequestDeliver, CmcdTransportAdapter } from './CmcdTransportAdapter.ts'

async function toHttpRequest(request: Request): Promise<HttpRequest> {
	const headers: Record<string, string> = {}
	request.headers.forEach((value, name) => {
		headers[name.toLowerCase()] = value
	})

	let body: string | undefined
	if (request.body) {
		try {
			body = await request.text()
		} catch {
			body = undefined
		}
	}

	return {
		url: request.url,
		method: request.method,
		headers,
		body,
	}
}

/**
 * Create a transport adapter for `CmcdReportRecorder` that patches
 * `globalThis.fetch` to capture requests with CMCD data. The patched
 * `fetch` normalizes each request to `HttpRequest` (lowercase headers,
 * body read as a UTF-8 string).
 *
 * The patched `fetch` reads each body once with `Request.text()` for
 * inspection. This read is safe for the body types that CMCD reports use
 * in practice: `string`, `Blob`, `ArrayBuffer`, `FormData`, and
 * `URLSearchParams`. The underlying `fetch` can read those bodies again.
 * Do not pass a `ReadableStream` as `init.body`. The patched `fetch`
 * consumes the stream, and the underlying `fetch` receives an
 * already-disturbed stream.
 *
 * @public
 */
export function createFetchTransport(): CmcdTransportAdapter {
	return {
		attach(deliver: CmcdRequestDeliver): () => void {
			const origFetch = globalThis.fetch

			globalThis.fetch = async (
				input: RequestInfo | URL,
				init?: RequestInit,
			): Promise<Response> => {
				const inspect = input instanceof Request
					? input.clone()
					: new Request(input, init)
				const httpRequest = await toHttpRequest(inspect)
				const synthetic = deliver(httpRequest)
				if (synthetic) {
					return synthetic
				}
				return origFetch.call(globalThis, input as RequestInfo, init)
			}

			return () => {
				globalThis.fetch = origFetch
			}
		},
	}
}
