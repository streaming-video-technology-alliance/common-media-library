import {
	createSteeringEngine,
	SteeringErrorType,
	type SteeringError,
} from '@svta/cml-content-steering'
import { fetchRequester } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it, vi } from 'vite-plus/test'

const MANIFEST = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }
const URI = 'https://steering.example.com/manifest.json'

type RequestError = Exclude<SteeringError, { type: typeof SteeringErrorType.CALLBACK }>

function stubFetch(response: Response) {
	return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
}

describe('createSteeringEngine with fetchRequester', () => {
	it('requests the Steering Manifest with fetch', async () => {
		const fetchMock = stubFetch(new Response(JSON.stringify(MANIFEST), { status: 200 }))
		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: URI,
			pathways: ['CDN-A', 'CDN-B'],
			pathway: 'CDN-A',
			requester: fetchRequester,
		})

		await engine.start()
		engine.stop()

		equal(fetchMock.mock.calls.length, 1)
		equal(engine.pathway, 'CDN-B')
	})

	it('passes a 429 response with Retry-After to the engine', async () => {
		stubFetch(new Response(null, { status: 429, headers: { 'Retry-After': '120' } }))
		const errors: RequestError[] = []
		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: URI,
			pathways: ['CDN-A', 'CDN-B'],
			pathway: 'CDN-A',
			requester: fetchRequester,
			onError: error => {
				if (error.type !== SteeringErrorType.CALLBACK) {
					errors.push(error)
				}
			},
		})

		await engine.start()
		engine.stop()

		equal(errors.length, 1)
		equal(errors[0].type, SteeringErrorType.LOAD)
		equal(errors[0].status, 429)
		equal(errors[0].retryDelay, 120000)
	})
})
