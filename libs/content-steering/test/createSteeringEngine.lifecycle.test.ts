import { createSteeringEngine, SteeringErrorType, type SteeringEngineConfig, type SteeringError, type SteeringRequester } from '@svta/cml-content-steering'
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { deepEqual, equal, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse } from './createStubRequester.ts'

const MANIFEST = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }

function config(requester: SteeringRequester, overrides: Partial<SteeringEngineConfig> = {}): SteeringEngineConfig {
	return {
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		requester,
		...overrides,
	}
}

function createDeferredRequester() {
	const requests: HttpRequest[] = []
	const answers: ((response: Omit<HttpResponse, 'request'>) => void)[] = []
	const requester: SteeringRequester = (request) => {
		requests.push(request)
		return new Promise(resolve => answers.push(response => resolve({ request, ...response })))
	}

	return { requester, requests, answers }
}

async function advance(ms: number): Promise<void> {
	mock.timers.tick(ms)
	await flush()
}

describe('createSteeringEngine lifecycle', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('resolves the promise of start() after onManifest', async () => {
		const events: string[] = []
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, { onManifest: () => events.push('manifest') }))

		await engine.start()
		events.push('resolved')
		engine.stop()

		deepEqual(events, ['manifest', 'resolved'])
	})

	it('returns the same promise for a second start()', () => {
		const { requester } = createDeferredRequester()
		const engine = createSteeringEngine(config(requester))

		const first = engine.start()
		const second = engine.start()
		engine.stop()

		equal(first, second)
	})

	it('resolves the promise of start() when the requester fails', async () => {
		const engine = createSteeringEngine(config(async () => {
			throw new Error('offline')
		}))

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('resolves a pending promise of start() on stop() and ignores the late response', async () => {
		const { requester, answers } = createDeferredRequester()
		const changes: string[] = []
		const engine = createSteeringEngine(config(requester, { onPathwayChange: (pathway) => changes.push(pathway) }))

		const promise = engine.start()
		engine.stop()
		await promise

		answers[0]({ status: 200, data: JSON.stringify(MANIFEST) })
		await flush()

		deepEqual(changes, [])
		equal(engine.pathway, 'CDN-A')
	})

	it('waits for the rest of the TTL when it resumes', async () => {
		//#region example
		const { requester, requests } = createStubRequester(manifestResponse(MANIFEST), manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester))

		await engine.start()
		await advance(100000)
		engine.stop()
		await advance(50000)

		await engine.start()
		equal(requests.length, 1)

		await advance(149999)
		equal(requests.length, 1)

		await advance(1)
		engine.stop()

		equal(requests.length, 2)
		//#endregion example
	})

	it('requests at once when it resumes after the TTL', async () => {
		const { requester, requests } = createStubRequester(manifestResponse(MANIFEST), manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester))

		await engine.start()
		engine.stop()
		await advance(300000)

		await engine.start()
		engine.stop()

		equal(requests.length, 2)
	})

	it('selects again on start() when a penalty ended while the engine was stopped', async () => {
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, { penalty: 1000 }))

		await engine.start()
		engine.penalize()
		equal(engine.pathway, 'CDN-A')

		engine.stop()
		await advance(1000)
		equal(engine.pathway, 'CDN-A')

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})

	it('sends no request on start() after a 410', async () => {
		const { requester, requests } = createStubRequester({ status: 410 })
		const engine = createSteeringEngine(config(requester))

		await engine.start()
		engine.stop()
		await engine.start()
		engine.stop()

		equal(requests.length, 1)
	})

	it('reports a callback error without a caller to onError and continues', async () => {
		const cause = new Error('player bug')
		const errors: SteeringError[] = []
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			onManifest: () => {
				throw cause
			},
			onError: (error) => errors.push(error),
		}))

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
		deepEqual(errors, [{ type: SteeringErrorType.CALLBACK, callback: 'onManifest', cause, message: 'The onManifest callback threw.' }])
	})

	it('throws a callback error to the caller of penalize() after it selects', async () => {
		const cause = new Error('player bug')
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			onPathwayChange: (pathway) => {
				if (pathway === 'CDN-A') {
					throw cause
				}
			},
		}))

		await engine.start()

		throws(() => engine.penalize(), (error) => error === cause)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('throws a callback error from the timer callback without onError', async () => {
		const cause = new Error('player bug')
		let fail = false
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			penalty: 1000,
			onPathwayChange: () => {
				if (fail) {
					throw cause
				}
			},
		}))

		await engine.start()
		engine.penalize()
		fail = true

		throws(() => mock.timers.tick(1000), (error) => error === cause)
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})

	it('reports a getThroughput error and sends the request without throughput', async () => {
		const cause = new Error('player bug')
		const errors: SteeringError[] = []
		const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			getThroughput: () => {
				throw cause
			},
			onError: (error) => errors.push(error),
		}))

		await engine.start()
		engine.stop()

		equal(requests[0].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22')
		deepEqual(errors, [{ type: SteeringErrorType.CALLBACK, callback: 'getThroughput', cause, message: 'The getThroughput callback threw.' }])
	})

	it('throws a callback error of start() from a timer callback without onError', async () => {
		const cause = new Error('player bug')
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			getThroughput: () => {
				throw cause
			},
		}))

		await engine.start()

		throws(() => mock.timers.tick(1), (error) => error === cause)
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})
})
