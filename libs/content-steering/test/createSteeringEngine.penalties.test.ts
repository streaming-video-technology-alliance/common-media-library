import { createSteeringEngine, DEFAULT_PATHWAY_PENALTY, type SteeringEngineConfig } from '@svta/cml-content-steering'
import { deepEqual, equal } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

const PRIORITY = ['CDN-A', 'CDN-B', 'CDN-C']

async function started(overrides: Partial<SteeringEngineConfig>, ...responses: StubResponse[]) {
	const { requester } = createStubRequester(...responses)
	const changes: string[] = []
	const engine = createSteeringEngine({
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: ['CDN-A', 'CDN-B', 'CDN-C'],
		pathway: 'CDN-A',
		requester,
		onPathwayChange: (pathway) => changes.push(pathway),
		...overrides,
	})

	await engine.start()

	return { engine, changes }
}

async function advance(ms: number): Promise<void> {
	mock.timers.tick(ms)
	await flush()
}

describe('createSteeringEngine penalties', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('selects the next pathway when the selected pathway is penalized', async () => {
		const { engine, changes } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
		deepEqual(changes, ['CDN-B'])
	})

	it('does not change the selection for a pathway that is not selected', async () => {
		const { engine, changes } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize('CDN-C')
		engine.stop()

		equal(engine.pathway, 'CDN-A')
		deepEqual(changes, [])
	})

	it('selects again when an HLS penalty of DEFAULT_PATHWAY_PENALTY ends', async () => {
		//#region example
		const { engine, changes } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize()
		await advance(DEFAULT_PATHWAY_PENALTY - 1)
		equal(engine.pathway, 'CDN-B')

		await advance(1)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
		deepEqual(changes, ['CDN-B', 'CDN-A'])
		//#endregion example
	})

	it('uses the TTL of the last valid Steering Manifest as the DASH penalty', async () => {
		const { engine } = await started({ protocol: 'dash' }, manifestResponse({ VERSION: 1, TTL: 30, 'PATHWAY-PRIORITY': PRIORITY }), manifestResponse({ VERSION: 1, TTL: 30, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize()
		await advance(29999)
		equal(engine.pathway, 'CDN-B')

		await advance(1)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('uses a DASH penalty of at least 1 second for a TTL below 1 second', async () => {
		const { engine } = await started({ protocol: 'dash' }, manifestResponse({ VERSION: 1, TTL: 0.001, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize()
		await advance(999)
		equal(engine.pathway, 'CDN-B')

		await advance(1)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('uses the penalty of the configuration for both protocols', async () => {
		const { engine } = await started({ penalty: 1000 }, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize()
		await advance(1000)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('keeps a penalty when a new Steering Manifest ranks the pathway first', async () => {
		const manifest = manifestResponse({ VERSION: 1, TTL: 10, 'PATHWAY-PRIORITY': PRIORITY })
		const { engine } = await started({ penalty: 60000 }, manifest, manifest)

		engine.penalize()
		await advance(10000)
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})

	it('restarts a penalty when the pathway is penalized again', async () => {
		const { engine } = await started({ penalty: 1000 }, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B'] }))

		engine.penalize('CDN-A')
		await advance(500)
		engine.penalize('CDN-A')
		await advance(500)
		equal(engine.pathway, 'CDN-B')

		await advance(500)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('keeps the selection when no pathway qualifies', async () => {
		const { engine, changes } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-A'] }))

		engine.penalize()
		engine.stop()

		equal(engine.pathway, 'CDN-A')
		deepEqual(changes, [])
	})

	it('ignores pathway IDs that the Content Description does not define', async () => {
		const { engine } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-X', 'CDN-C'] }))

		engine.stop()

		equal(engine.pathway, 'CDN-C')
	})

	it('fails over with the fallback priority list before the first Steering Manifest', async () => {
		const { requester } = createStubRequester(manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))
		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: 'https://steering.example.com/manifest.json',
			pathways: PRIORITY,
			pathway: 'CDN-A',
			requester,
		})

		engine.penalize()
		equal(engine.pathway, 'CDN-B')

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})
})
