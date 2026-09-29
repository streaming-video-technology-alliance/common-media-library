import { createSteeringEngine, type SteeringEngineConfig } from '@svta/cml-content-steering'
import { deepEqual, equal, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse } from './createStubRequester.ts'

const MANIFEST = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }

function hlsConfig(overrides: Partial<SteeringEngineConfig> = {}): SteeringEngineConfig {
	return {
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		...overrides,
	}
}

describe('createSteeringEngine', () => {
	it('provides a valid example', async () => {
		//#region example
		const manifest = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }
		const changes: string[] = []

		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: 'https://steering.example.com/manifest.json',
			pathways: ['CDN-A', 'CDN-B'],
			pathway: 'CDN-A',
			requester: async (request) => ({ request, status: 200, data: JSON.stringify(manifest) }),
			onPathwayChange: (pathway) => changes.push(pathway),
		})

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
		deepEqual(changes, ['CDN-B'])
		//#endregion example
	})

	describe('configuration', () => {
		it('throws for an unknown protocol', () => {
			// @ts-expect-error - invalid protocol
			throws(() => createSteeringEngine(hlsConfig({ protocol: 'smooth' })), { name: 'TypeError', message: /protocol must be 'hls' or 'dash'. Received "smooth"/ })
		})

		it('throws for a relative uri', () => {
			throws(() => createSteeringEngine(hlsConfig({ uri: '/steering' })), { name: 'TypeError', message: /uri must be an absolute URI. Received "\/steering"/ })
		})

		it('throws for empty pathways', () => {
			throws(() => createSteeringEngine(hlsConfig({ pathways: [], pathway: undefined })), { name: 'TypeError', message: /pathways must be a non-empty array of strings/ })
		})

		it('throws for a pathway that is not in pathways', () => {
			throws(() => createSteeringEngine(hlsConfig({ pathway: 'CDN-C' })), { name: 'TypeError', message: /pathway must be one of pathways. Received "CDN-C"/ })
		})

		it('throws for a negative penalty', () => {
			throws(() => createSteeringEngine(hlsConfig({ penalty: -1 })), { name: 'TypeError', message: /penalty must be a finite number/ })
		})

		it('starts with the configured pathway', () => {
			equal(createSteeringEngine(hlsConfig()).pathway, 'CDN-A')
			equal(createSteeringEngine(hlsConfig({ pathway: undefined })).pathway, undefined)
		})
	})

	describe('requests', () => {
		beforeEach(() => {
			mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
		})

		afterEach(() => {
			mock.timers.reset()
		})

		it('sends no request before start()', async () => {
			const { requester, requests } = createStubRequester()

			createSteeringEngine(hlsConfig({ requester }))
			await flush()

			equal(requests.length, 0)
		})

		it('sends a GET request with responseType text', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester }))

			await engine.start()
			engine.stop()

			equal(requests[0].method, 'GET')
			equal(requests[0].responseType, 'text')
		})

		it('adds the HLS pathway in quotes and the rounded throughput', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester, getThroughput: () => 6000000.4 }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22&_HLS_throughput=6000000')
		})

		it('omits the parameters when no pathway is selected', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester, pathway: undefined, getThroughput: () => 1000 }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json')
		})

		it('omits a throughput that is unknown, negative, or not finite', async () => {
			for (const value of [undefined, -1, NaN, Infinity]) {
				const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
				const engine = createSteeringEngine(hlsConfig({ requester, getThroughput: () => value }))

				await engine.start()
				engine.stop()

				equal(requests[0].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22')
			}
		})

		it('replaces a parameter of the same name and keeps the other parameters', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const uri = 'https://steering.example.com/manifest.json?video=a%20b&_HLS_pathway=old'
			const engine = createSteeringEngine(hlsConfig({ requester, uri }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json?video=a%20b&_HLS_pathway=%22CDN-A%22')
		})

		it('adds no parameters to a data URI', async () => {
			const uri = `data:application/json,${encodeURIComponent(JSON.stringify(MANIFEST))}`
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester, uri, getThroughput: () => 1000 }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, uri)
		})

		it('lists every DASH pathway selected since the previous request', async () => {
			const manifest = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['alpha', 'beta'] }
			const { requester, requests } = createStubRequester(manifestResponse(manifest), manifestResponse(manifest))
			const engine = createSteeringEngine({
				protocol: 'dash',
				uri: 'https://steering.example.com/dash',
				pathways: ['alpha', 'beta'],
				pathway: 'alpha',
				requester,
				getThroughput: (pathway) => pathway === 'alpha' ? 5140000 : undefined,
			})

			await engine.start()
			engine.penalize('alpha')
			mock.timers.tick(60000)
			await flush()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/dash?_DASH_pathway=%22alpha%22&_DASH_throughput=5140000')
			equal(requests[1].url, 'https://steering.example.com/dash?_DASH_pathway=%22alpha,beta%22&_DASH_throughput=5140000,')
		})

		it('sends no steering parameters on the first request with queryBeforeStart', async () => {
			const manifest = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }
			const { requester, requests } = createStubRequester(manifestResponse(manifest), manifestResponse(manifest))
			const engine = createSteeringEngine(hlsConfig({ requester, queryBeforeStart: true, getThroughput: () => 1000 }))

			await engine.start()
			mock.timers.tick(60000)
			await flush()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json')
			equal(requests[1].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-B%22&_HLS_throughput=1000')
		})

		it('lists the pathways of getReportedPathways for DASH', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine({
				protocol: 'dash',
				uri: 'https://steering.example.com/dash',
				pathways: ['alpha', 'beta'],
				pathway: 'alpha',
				requester,
				getReportedPathways: () => ['beta', 'alpha', 'beta'],
				getThroughput: (pathway) => pathway === 'beta' ? 2000 : 1000,
			})

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/dash?_DASH_pathway=%22beta,alpha%22&_DASH_throughput=2000,1000')
		})

		it('omits the DASH parameters when getReportedPathways returns an empty list', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine({
				protocol: 'dash',
				uri: 'https://steering.example.com/dash',
				pathways: ['alpha'],
				pathway: 'alpha',
				requester,
				getReportedPathways: () => [],
			})

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/dash')
		})

		it('ignores getReportedPathways for HLS', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester, getReportedPathways: () => ['CDN-B'] }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22')
		})

		it('uses fetch when no requester is configured', async (t) => {
			const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(MANIFEST), { status: 200 }))
			const engine = createSteeringEngine(hlsConfig())

			await engine.start()
			engine.stop()

			equal(fetchMock.mock.callCount(), 1)
			equal(fetchMock.mock.calls[0].arguments[0], 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22')
			equal(engine.pathway, 'CDN-B')
		})
	})
})
