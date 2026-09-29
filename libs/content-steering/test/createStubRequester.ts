import type { SteeringManifest, SteeringRequester } from '@svta/cml-content-steering'
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'

export type StubResponse = Omit<HttpResponse, 'request'> | Error

export type StubRequester = {
	readonly requester: SteeringRequester;
	readonly requests: HttpRequest[];
	respond(...responses: StubResponse[]): void;
};

/**
 * Creates a requester that records each request and answers it with the
 * next queued response. An `Error` in the queue rejects the request. An
 * empty queue answers with status 500.
 */
export function createStubRequester(...responses: StubResponse[]): StubRequester {
	const requests: HttpRequest[] = []
	const queue = [...responses]

	return {
		requests,
		requester: async (request) => {
			requests.push(request)

			const next = queue.shift() ?? { status: 500 }

			if (next instanceof Error) {
				throw next
			}

			return { request, ...next }
		},
		respond: (...more) => {
			queue.push(...more)
		},
	}
}

/**
 * Creates a status 200 response with a Steering Manifest body.
 */
export function manifestResponse(manifest: Partial<SteeringManifest> & Record<string, unknown>, url?: string): StubResponse {
	return { status: 200, url, data: JSON.stringify(manifest) }
}

/**
 * Waits for the pending promise callbacks of the engine.
 */
export function flush(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}
