import { createSteeringEngine, DEFAULT_TTL, SteeringErrorType, type SteeringEngineConfig, type SteeringError } from '@svta/cml-content-steering'
import { deepEqual, equal, ok } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

const NOW = Date.parse('Sun, 06 Nov 1994 08:49:37 GMT')
const MANIFEST = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }

type RequestError = Exclude<SteeringError, { type: typeof SteeringErrorType.CALLBACK }>

function setup(protocol: 'hls' | 'dash', ...responses: StubResponse[]) {
	const stub = createStubRequester(...responses)
	const errors: RequestError[] = []
	const manifests: unknown[] = []
	const config: SteeringEngineConfig = {
		protocol,
		uri: 'https://steering.example.com/a/manifest.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		requester: stub.requester,
		onError: (error) => {
			if (error.type !== SteeringErrorType.CALLBACK) {
				errors.push(error)
			}
		},
		onManifest: (manifest) => manifests.push(manifest),
	}
	const engine = createSteeringEngine(config)

	return { ...stub, engine, errors, manifests }
}

async function advance(ms: number): Promise<void> {
	mock.timers.tick(ms)
	await flush()
}

describe('createSteeringEngine responses', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: NOW })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	describe('valid Steering Manifest', () => {
		it('applies the Steering Manifest and requests again after TTL seconds', async () => {
			//#region example
			const { engine, requests, manifests } = setup('hls', manifestResponse(MANIFEST), manifestResponse(MANIFEST))

			await engine.start()

			deepEqual(manifests, [MANIFEST])
			equal(engine.pathway, 'CDN-B')

			await advance(59999)
			equal(requests.length, 1)

			await advance(1)
			equal(requests.length, 2)
			engine.stop()
			//#endregion example
		})

		it('accepts an empty PATHWAY-CLONES array', async () => {
			const { engine, errors } = setup('hls', manifestResponse({ ...MANIFEST, 'PATHWAY-CLONES': [] }))

			await engine.start()
			engine.stop()

			equal(errors.length, 0)
			equal(engine.pathway, 'CDN-B')
		})

		it('keeps the first of each pathway ID in PATHWAY-PRIORITY', async () => {
			// @ts-expect-error - a pathway ID that is not a string
			const { engine } = setup('hls', manifestResponse({ ...MANIFEST, 'PATHWAY-PRIORITY': ['CDN-B', 7, 'CDN-B', 'CDN-A'] }))

			await engine.start()
			engine.stop()

			deepEqual(engine.priority, ['CDN-B', 'CDN-A'])
		})

		it('treats a response without status as status 200', async () => {
			const { engine } = setup('hls', { data: JSON.stringify(MANIFEST) })

			await engine.start()
			engine.stop()

			equal(engine.pathway, 'CDN-B')
		})

		it('passes the response URI and the next request URI to onManifest', async () => {
			const contexts: unknown[] = []
			const manifest = { ...MANIFEST, 'RELOAD-URI': 'next.json' }
			const engine = createSteeringEngine({
				protocol: 'hls',
				uri: 'https://steering.example.com/a/manifest.json',
				pathways: ['CDN-A', 'CDN-B'],
				requester: async (request) => ({ request, status: 200, url: 'https://cdn.example.com/b/manifest.json', data: JSON.stringify(manifest) }),
				onManifest: (_manifest, _clones, context) => contexts.push(context),
			})

			await engine.start()
			engine.stop()

			deepEqual(contexts, [{ url: 'https://cdn.example.com/b/manifest.json', reloadUri: 'https://cdn.example.com/b/next.json' }])
		})

		it('accepts a body that is already parsed', async () => {
			const { engine } = setup('hls', { status: 200, data: MANIFEST })

			await engine.start()
			engine.stop()

			equal(engine.pathway, 'CDN-B')
		})

		it('resolves a relative RELOAD-URI against the response URI', async () => {
			const manifest = { ...MANIFEST, 'RELOAD-URI': 'next.json?session=1' }
			const { engine, requests } = setup('hls', manifestResponse(manifest, 'https://cdn.example.com/b/manifest.json'), manifestResponse(MANIFEST))

			await engine.start()
			await advance(60000)
			engine.stop()

			equal(requests[1].url, 'https://cdn.example.com/b/next.json?session=1&_HLS_pathway=%22CDN-B%22')
		})

		it('resolves a relative RELOAD-URI against the request URI without a response URI', async () => {
			const manifest = { ...MANIFEST, 'RELOAD-URI': '../reload.json' }
			const { engine, requests } = setup('hls', manifestResponse(manifest), manifestResponse(MANIFEST))

			await engine.start()
			await advance(60000)
			engine.stop()

			equal(requests[1].url, 'https://steering.example.com/reload.json?_HLS_pathway=%22CDN-B%22')
		})

		it('reports a relative RELOAD-URI of a data URI as a parse error', async () => {
			const manifest = { ...MANIFEST, 'RELOAD-URI': 'next.json' }
			const uri = `data:application/json,${encodeURIComponent(JSON.stringify(manifest))}`
			const errors: RequestError[] = []
			const engine = createSteeringEngine({
				protocol: 'hls',
				uri,
				pathways: ['CDN-A', 'CDN-B'],
				requester: async (request) => ({ request, status: 200, url: request.url, data: JSON.stringify(manifest) }),
				onError: (error) => {
			if (error.type !== SteeringErrorType.CALLBACK) {
				errors.push(error)
			}
		},
			})

			await engine.start()
			engine.stop()

			equal(errors[0].type, 'parse')
			ok(errors[0].message.includes('RELOAD-URI'))
			equal(engine.pathway, undefined)
		})
	})

	describe('invalid Steering Manifest', () => {
		it('reports a parse error for a body that is not JSON and requests again after DEFAULT_TTL', async () => {
			const { engine, errors, requests } = setup('hls', { status: 200, data: '<html>' }, manifestResponse(MANIFEST))

			await engine.start()

			equal(errors[0].type, 'parse')
			equal(errors[0].status, 200)
			ok(errors[0].cause instanceof SyntaxError)
			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
			equal(engine.pathway, 'CDN-A')

			await advance(DEFAULT_TTL * 1000)
			engine.stop()

			equal(requests.length, 2)
		})

		it('reports a parse error for a Steering Manifest without a positive TTL', async () => {
			const { engine, errors } = setup('hls', manifestResponse({ ...MANIFEST, TTL: 0 }))

			await engine.start()
			engine.stop()

			equal(errors[0].type, 'parse')
			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
		})

		it('keeps the previous state after an invalid Steering Manifest', async () => {
			const { engine, errors } = setup('hls', manifestResponse(MANIFEST), manifestResponse({ ...MANIFEST, 'PATHWAY-PRIORITY': [] }))

			await engine.start()
			await advance(60000)
			engine.stop()

			equal(errors[0].type, 'parse')
			equal(errors[0].retryDelay, 60000)
			equal(engine.pathway, 'CDN-B')
		})

		it('retries after a VERSION other than 1 for HLS', async () => {
			const { engine, errors } = setup('hls', manifestResponse({ ...MANIFEST, VERSION: 2 }))

			await engine.start()
			engine.stop()

			equal(errors[0].type, 'parse')
			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
		})

		it('reports a parse error and retries when the DASH response body is a Uint8Array', async () => {
			const { engine, errors, requests } = setup('dash', { status: 200, data: new Uint8Array([1, 2, 3]) }, manifestResponse(MANIFEST))

			await engine.start()

			equal(errors[0].type, 'parse')
			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
			equal(engine.pathway, 'CDN-A')

			await advance(DEFAULT_TTL * 1000)
			engine.stop()

			equal(requests.length, 2)
		})

		it('ends the requests after a VERSION other than 1 for DASH and uses the fallback priority list', async () => {
			const { engine, errors, requests } = setup('dash', manifestResponse(MANIFEST), manifestResponse({ ...MANIFEST, VERSION: 2 }))

			await engine.start()
			equal(engine.pathway, 'CDN-B')

			await advance(60000)
			equal(errors[0].type, 'parse')
			equal(errors[0].retryDelay, undefined)

			engine.penalize()
			equal(engine.pathway, 'CDN-A')

			await advance(3600000)
			engine.stop()

			equal(requests.length, 2)
		})
	})

	describe('HTTP 410', () => {
		it('ends the requests and uses the fallback priority list when no Steering Manifest arrived', async () => {
			const { engine, errors, requests } = setup('hls', { status: 410 })

			await engine.start()

			equal(errors[0].type, 'load')
			equal(errors[0].status, 410)
			equal(errors[0].retryDelay, undefined)
			equal(engine.pathway, 'CDN-A')

			engine.penalize()
			equal(engine.pathway, 'CDN-B')

			await advance(3600000)
			engine.stop()

			equal(requests.length, 1)
		})

		it('keeps the priority list of the last valid Steering Manifest', async () => {
			const { engine } = setup('hls', manifestResponse({ ...MANIFEST, 'PATHWAY-PRIORITY': ['CDN-B'] }), { status: 410 })

			await engine.start()
			await advance(60000)

			engine.penalize()
			engine.stop()

			equal(engine.pathway, 'CDN-B')
		})

		it('keeps a priority list from update() when a 410 ends steering', async () => {
			const { requester } = createStubRequester({ status: 410 })
			const engine = createSteeringEngine({
				protocol: 'hls',
				uri: 'https://steering.example.com/a/manifest.json',
				pathways: ['CDN-A', 'CDN-B', 'CDN-C'],
				pathway: 'CDN-A',
				requester,
			})

			engine.update({ priority: ['CDN-A', 'CDN-C', 'CDN-B'] })
			await engine.start()
			engine.stop()

			deepEqual(engine.priority, ['CDN-A', 'CDN-C', 'CDN-B'])
		})
	})

	describe('HTTP 429', () => {
		it('requests again after the Retry-After seconds', async () => {
			const { engine, errors, requests } = setup('hls', { status: 429, headers: { 'Retry-After': '120' } }, manifestResponse(MANIFEST))

			await engine.start()

			equal(errors[0].status, 429)
			equal(errors[0].retryDelay, 120000)

			await advance(119999)
			equal(requests.length, 1)

			await advance(1)
			engine.stop()

			equal(requests.length, 2)
		})

		it('requests again at the Retry-After HTTP date', async () => {
			const { engine, errors } = setup('hls', { status: 429, headers: { 'retry-after': 'Sun, 06 Nov 1994 08:51:37 GMT' } })

			await engine.start()
			engine.stop()

			equal(errors[0].retryDelay, 120000)
		})

		it('uses the previous TTL for a Retry-After HTTP date in the past', async () => {
			const { engine, errors } = setup('hls', { status: 429, headers: { 'retry-after': 'Sun, 06 Nov 1994 08:00:00 GMT' } })

			await engine.start()
			engine.stop()

			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
		})

		it('uses the previous TTL without a valid Retry-After', async () => {
			const { engine, errors } = setup('hls', { status: 429, headers: { 'retry-after': 'soon' } })

			await engine.start()
			engine.stop()

			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
		})

		it('does not change the TTL for HLS', async () => {
			const { engine, errors } = setup('hls', manifestResponse(MANIFEST), { status: 429, headers: { 'retry-after': '5' } }, { status: 500 })

			await engine.start()
			await advance(60000)
			await advance(5000)
			engine.stop()

			equal(errors[1].status, 500)
			equal(errors[1].retryDelay, 60000)
		})

		it('replaces the TTL with the Retry-After value for DASH', async () => {
			const { engine, errors } = setup('dash', manifestResponse(MANIFEST), { status: 429, headers: { 'retry-after': '5' } }, { status: 500 })

			await engine.start()
			await advance(60000)
			await advance(5000)
			engine.stop()

			equal(errors[1].status, 500)
			equal(errors[1].retryDelay, 5000)
		})

		it('ignores a Retry-After of 0 for DASH and keeps the previous TTL for retries and penalties', async () => {
			const { engine, errors, requests } = setup('dash', manifestResponse(MANIFEST), { status: 429, headers: { 'retry-after': '0' } }, { status: 503 })

			await engine.start()
			equal(engine.pathway, 'CDN-B')

			await advance(60000)
			equal(errors[0].status, 429)
			equal(errors[0].retryDelay, 60000)
			equal(requests.length, 2)

			await advance(60000)
			equal(errors[1].status, 503)
			equal(errors[1].retryDelay, 60000)
			equal(requests.length, 3)

			engine.penalize()
			equal(engine.pathway, 'CDN-A')

			await advance(59999)
			equal(engine.pathway, 'CDN-A')

			await advance(1)
			engine.stop()

			equal(engine.pathway, 'CDN-B')
		})
	})

	describe('other failures', () => {
		it('reports a load error for another status and requests again after the previous TTL', async () => {
			const { engine, errors } = setup('hls', manifestResponse(MANIFEST), { status: 503 })

			await engine.start()
			await advance(60000)
			engine.stop()

			equal(errors[0].type, 'load')
			equal(errors[0].status, 503)
			equal(errors[0].retryDelay, 60000)
			equal(engine.pathway, 'CDN-B')
		})

		it('reports a load error for a network error', async () => {
			const cause = new TypeError('Failed to fetch')
			const { engine, errors } = setup('hls', cause)

			await engine.start()
			engine.stop()

			equal(errors[0].type, 'load')
			equal(errors[0].status, undefined)
			equal(errors[0].cause, cause)
			equal(errors[0].url, 'https://steering.example.com/a/manifest.json?_HLS_pathway=%22CDN-A%22')
		})

		it('reports a load error and requests again when the requester resolves a value that is not a response object', async () => {
			const errors: RequestError[] = []
			const engine = createSteeringEngine({
				protocol: 'hls',
				uri: 'https://steering.example.com/a/manifest.json',
				pathways: ['CDN-A', 'CDN-B'],
				pathway: 'CDN-A',
				// @ts-expect-error - a requester that forgets to return a response
				requester: async () => undefined,
				onError: (error) => {
					if (error.type !== SteeringErrorType.CALLBACK) {
						errors.push(error)
					}
				},
			})

			await engine.start()
			engine.stop()

			equal(errors[0].type, 'load')
			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
			equal(engine.pathway, 'CDN-A')
		})
	})
})
