import { createSteeringEngine, type SteeringEngineConfig } from '@svta/cml-content-steering'
import { deepEqual, equal, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

const PATHWAYS = ['CDN-A', 'CDN-B', 'CDN-C']

function create(overrides: Partial<SteeringEngineConfig>, ...responses: StubResponse[]) {
	const { requester } = createStubRequester(...responses)
	const changes: string[] = []
	const engine = createSteeringEngine({
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: PATHWAYS,
		pathway: 'CDN-A',
		requester,
		onPathwayChange: (pathway) => changes.push(pathway),
		...overrides,
	})

	return { engine, changes }
}

describe('createSteeringEngine priority', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('lists the selected pathway first and leaves out penalized and unknown pathways', async () => {
		//#region example
		const { engine } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-X', 'CDN-A', 'CDN-B', 'CDN-C'] }))

		await engine.start()
		engine.penalize('CDN-B')
		engine.stop()

		equal(engine.pathway, 'CDN-A')
		deepEqual(engine.priority, ['CDN-A', 'CDN-C'])
		//#endregion example
	})

	it('returns the fallback priority list before the first Steering Manifest', () => {
		deepEqual(create({}).engine.priority, ['CDN-A', 'CDN-B', 'CDN-C'])
		deepEqual(create({ pathway: 'CDN-B' }).engine.priority, ['CDN-B', 'CDN-A', 'CDN-C'])
		deepEqual(create({ pathway: undefined }).engine.priority, [])
	})

	it('replaces the priority list with update() and selects', async () => {
		const { engine, changes } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B'] }))

		await engine.start()
		engine.update({ priority: ['CDN-X', 'CDN-B', 'CDN-A', 'CDN-B'] })
		engine.stop()

		equal(engine.pathway, 'CDN-B')
		deepEqual(engine.priority, ['CDN-B', 'CDN-A'])
		deepEqual(changes, ['CDN-B'])
	})

	it('replaces the priority list of update() with the next valid Steering Manifest', async () => {
		const manifest = manifestResponse({ VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B'] })
		const { engine } = create({}, manifest, manifest)

		await engine.start()
		engine.update({ priority: ['CDN-B'] })
		equal(engine.pathway, 'CDN-B')

		mock.timers.tick(60000)
		await flush()
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('throws for a priority list that is not an array of strings', () => {
		const { engine } = create({})

		// @ts-expect-error - invalid priority list
		throws(() => engine.update({ priority: [1] }), { name: 'TypeError', message: /SteeringEngine\.update: priority must be an array of strings/ })
	})

	it('throws a callback error to the caller of update() after a new priority list', () => {
		const cause = new Error('player bug')
		const { engine } = create({
			onPathwayChange: () => {
				throw cause
			},
		})

		throws(() => engine.update({ priority: ['CDN-C'] }), (error) => error === cause)

		equal(engine.pathway, 'CDN-C')
	})
})
