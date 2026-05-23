import type { HttpRequest } from '@svta/cml-utils'
import type { CmcdRequestDeliver, CmcdTransportAdapter } from './CmcdTransportAdapter.ts'

async function toHttpRequest(request: Request): Promise<HttpRequest> {
	const headers: Record<string, string> = {}
	request.headers.forEach((value, name) => {
		headers[name] = value
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
 * Create a transport adapter that patches `globalThis.fetch` to capture
 * CMCD-bearing requests, normalizing each to `HttpRequest` (lowercase
 * headers, body read as UTF-8 string). Returns the adapter object
 * expected by `CmcdReportRecorder`.
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
				const inspect = new Request(input, init)
				const httpRequest = await toHttpRequest(inspect.clone())
				const synthetic = deliver(httpRequest)
				if (synthetic) {
					return synthetic
				}
				return origFetch.call(globalThis, inspect)
			}

			return () => {
				globalThis.fetch = origFetch
			}
		},
	}
}
