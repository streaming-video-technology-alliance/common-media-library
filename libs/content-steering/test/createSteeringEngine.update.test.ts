import { createSteeringEngine, SteeringErrorType, type PathwayClone, type SteeringEngineConfig, type SteeringError, type SteeringRequester } from '@svta/cml-content-steering'
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

type RequestError = Exclude<SteeringError, { type: typeof SteeringErrorType.CALLBACK }>

function create(overrides: Partial<SteeringEngineConfig>, ...responses: StubResponse[]) {
	const stub = createStubRequester(...responses)
	const changes: string[] = []
	const engine = createSteeringEngine({
		protocol: 'dash',
		uri: 'https://steering.example.com/dash.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		requester: stub.requester,
		onPathwayChange: (pathway) => changes.push(pathway),
		...overrides,
	})

	return { ...stub, engine, changes }
}

function createDeferred(overrides: Partial<SteeringEngineConfig> = {}) {
	const requests: HttpRequest[] = []
	const answers: ((response: Omit<HttpResponse, 'request'>) => void)[] = []
	const requester: SteeringRequester = (request) => {
		requests.push(request)
		return new Promise(resolve => answers.push(response => resolve({ request, ...response })))
	}
	const engine = createSteeringEngine({
		protocol: 'dash',
		uri: 'https://steering.example.com/dash.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		requester,
		...overrides,
	})

	return { engine, requests, answers }
}

async function advance(ms: number): Promise<void> {
	mock.timers.tick(ms)
	await flush()
}

describe('createSteeringEngine update', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('selects a pathway that update() adds', async () => {
		//#region example
		const { engine, changes } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-C', 'CDN-A'] }))

		await engine.start()
		equal(engine.pathway, 'CDN-A')

		engine.update({ pathways: ['CDN-A', 'CDN-B', 'CDN-C'] })
		engine.stop()

		equal(engine.pathway, 'CDN-C')
		deepEqual(changes, ['CDN-C'])
		//#endregion example
	})

	it('moves off a pathway that update() removes', async () => {
		const { engine } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }))

		await engine.start()
		engine.update({ pathways: ['CDN-A'] })
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('checks the clones again after update()', async () => {
		const clone: PathwayClone = { 'BASE-ID': 'CDN-B', ID: 'CDN-B-CLONE', 'URI-REPLACEMENT': { HOST: 'backup.example.com' } }
		const { engine } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-B-CLONE', 'CDN-A'], 'PATHWAY-CLONES': [clone] }))

		await engine.start()
		equal(engine.pathway, 'CDN-B-CLONE')

		engine.update({ pathways: ['CDN-A'] })
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('does not select a clone that update() makes valid', async () => {
		const clone: PathwayClone = { 'BASE-ID': 'CDN-B', ID: 'CDN-B-CLONE', 'URI-REPLACEMENT': { HOST: 'backup.example.com' } }
		const { engine, changes } = create(
			{ pathways: ['CDN-A'] },
			manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-B-CLONE', 'CDN-A'], 'PATHWAY-CLONES': [clone] }),
		)

		await engine.start()
		equal(engine.pathway, 'CDN-A')

		engine.update({ pathways: ['CDN-A', 'CDN-B'] })
		engine.stop()

		equal(engine.pathway, 'CDN-A')
		deepEqual(changes, [])
	})

	it('does not select a clone through another definition that shares its ID', async () => {
		const unknownBase: PathwayClone = { 'BASE-ID': 'CDN-B', ID: 'C1', 'URI-REPLACEMENT': { HOST: 'x.example.com' } }
		const knownBase: PathwayClone = { 'BASE-ID': 'CDN-A', ID: 'C1', 'URI-REPLACEMENT': { HOST: 'y.example.com' } }
		const { engine } = create(
			{ pathways: ['CDN-A', 'CDN-Z'], pathway: 'CDN-Z' },
			manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['C1', 'CDN-Z'], 'PATHWAY-CLONES': [unknownBase, knownBase] }),
		)

		await engine.start()
		equal(engine.pathway, 'C1')

		engine.update({ pathways: ['CDN-A', 'CDN-B', 'CDN-Z'] })
		engine.update({ pathways: ['CDN-B', 'CDN-Z'] })
		engine.stop()

		equal(engine.pathway, 'CDN-Z')
	})

	it('applies new pathways and a new priority list in one call', async () => {
		const { engine } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B'] }))

		await engine.start()
		engine.update({ pathways: ['CDN-A', 'CDN-B', 'CDN-C'], priority: ['CDN-C', 'CDN-A'] })
		engine.stop()

		equal(engine.pathway, 'CDN-C')
		deepEqual(engine.priority, ['CDN-C', 'CDN-A'])
	})

	it('keeps penalties across update()', async () => {
		const { engine } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B', 'CDN-C'] }))

		await engine.start()
		engine.penalize('CDN-A')
		engine.update({ pathways: ['CDN-A', 'CDN-B', 'CDN-C'] })
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})

	it('rebuilds the fallback priority list after update()', () => {
		const { engine } = create({})

		engine.update({ pathways: ['CDN-A', 'CDN-C'] })

		deepEqual(engine.priority, ['CDN-A', 'CDN-C'])
	})

	it('uses a new uri at the next scheduled request and drops the RELOAD-URI', async () => {
		const manifest = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A'], 'RELOAD-URI': 'reload.json' }
		const { engine, requests } = create({}, manifestResponse(manifest), manifestResponse(manifest))

		await engine.start()
		engine.update({ uri: 'https://steering2.example.com/dash.json' })
		await flush()
		equal(requests.length, 1)

		await advance(60000)
		engine.stop()

		equal(requests[1].url, 'https://steering2.example.com/dash.json?_DASH_pathway=%22CDN-A%22')
	})

	it('keeps the RELOAD-URI when update() repeats the configured uri', async () => {
		const manifest = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A'], 'RELOAD-URI': 'reload.json' }
		const { engine, requests } = create({}, manifestResponse(manifest), manifestResponse(manifest))

		await engine.start()
		engine.update({ uri: 'https://steering.example.com/dash.json' })
		await advance(60000)
		engine.stop()

		equal(requests[1].url, 'https://steering.example.com/reload.json?_DASH_pathway=%22CDN-A%22')
	})

	it('resumes the requests after a 410 when update() sets a new uri', async () => {
		const { engine, requests } = create({}, { status: 410 }, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-B'] }))

		await engine.start()
		engine.update({ uri: 'https://steering2.example.com/dash.json' })
		await advance(0)
		engine.stop()

		equal(requests.length, 2)
		equal(requests[1].url, 'https://steering2.example.com/dash.json?_DASH_pathway=%22CDN-A%22')
		equal(engine.pathway, 'CDN-B')
	})

	it('ignores a stale RELOAD-URI when a response arrives after update() changes the uri', async () => {
		const { engine, requests, answers } = createDeferred()

		const promise = engine.start()
		engine.update({ uri: 'https://steering2.example.com/dash.json' })

		answers[0]({ status: 200, data: JSON.stringify({ VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A'], 'RELOAD-URI': 'reload.json' }) })
		await promise

		await advance(60000)
		engine.stop()

		equal(requests.length, 2)
		equal(requests[1].url, 'https://steering2.example.com/dash.json?_DASH_pathway=%22CDN-A%22')
	})

	it('does not end steering for a stale 410 and requests the current uri at once', async () => {
		const errors: RequestError[] = []
		const { engine, requests, answers } = createDeferred({ onError: (error) => {
			if (error.type !== SteeringErrorType.CALLBACK) {
				errors.push(error)
			}
		} })

		const promise = engine.start()
		engine.update({ uri: 'https://steering2.example.com/dash.json' })

		answers[0]({ status: 410 })
		await promise

		equal(errors.length, 1)
		equal(errors[0].status, 410)
		equal(errors[0].retryDelay, 0)
		ok(!errors[0].message.includes('No request follows'))
		equal(engine.pathway, 'CDN-A')

		await advance(0)
		engine.stop()

		equal(requests.length, 2)
		equal(requests[1].url, 'https://steering2.example.com/dash.json?_DASH_pathway=%22CDN-A%22')
	})

	it('does not end steering for a stale DASH VERSION error and requests the current uri at once', async () => {
		const errors: RequestError[] = []
		const { engine, requests, answers } = createDeferred({ onError: (error) => {
			if (error.type !== SteeringErrorType.CALLBACK) {
				errors.push(error)
			}
		} })

		const promise = engine.start()
		engine.update({ uri: 'https://steering2.example.com/dash.json' })

		answers[0]({ status: 200, data: JSON.stringify({ VERSION: 2, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A'] }) })
		await promise

		equal(errors.length, 1)
		equal(errors[0].type, 'parse')
		equal(errors[0].retryDelay, 0)
		ok(!errors[0].message.includes('No request follows'))
		equal(engine.pathway, 'CDN-A')

		await advance(0)
		engine.stop()

		equal(requests.length, 2)
		equal(requests[1].url, 'https://steering2.example.com/dash.json?_DASH_pathway=%22CDN-A%22')
	})

	it('throws for an invalid uri or pathways', () => {
		const { engine } = create({})

		throws(() => engine.update({ uri: '/relative' }), { name: 'TypeError', message: /SteeringEngine\.update: uri must be an absolute URI/ })
		throws(() => engine.update({ pathways: [] }), { name: 'TypeError', message: /SteeringEngine\.update: pathways must be a non-empty array of strings/ })
	})

	it('throws a callback error to the caller of update() after it selects', async () => {
		const cause = new Error('player bug')
		const { engine } = create({
			onPathwayChange: () => {
				throw cause
			},
		}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-C', 'CDN-A'] }))

		await engine.start()

		throws(() => engine.update({ pathways: ['CDN-A', 'CDN-C'] }), (error) => error === cause)
		engine.stop()

		equal(engine.pathway, 'CDN-C')
	})
})
