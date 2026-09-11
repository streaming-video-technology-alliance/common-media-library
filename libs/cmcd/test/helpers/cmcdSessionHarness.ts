import type { HttpRequest } from '@svta/cml-utils'

export type MockRequester = {
	requester: (request: HttpRequest) => Promise<{ status: number }>
	requests: HttpRequest[]
	bodies: () => string[]
	status: number
}

/** A requester that records every POST and answers with `status`. Change `status` between calls. */
export function createMockRequester(status: number = 200): MockRequester {
	const requests: HttpRequest[] = []
	const mock: MockRequester = {
		requests,
		status,
		bodies: () => requests.map(request => request.body as string),
		requester: async (request) => {
			requests.push(request)
			return { status: mock.status }
		},
	}
	return mock
}

/** Lets the requester promises settle. `setImmediate` is not part of the mocked timers. */
export function flushPromises(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}

/** The `CMCD` query value of a decorated URL, decoded. */
export function queryValue(url: string): string {
	const match = /[?&]CMCD=([^&#]*)/.exec(url)
	return match ? decodeURIComponent(match[1]) : ''
}
