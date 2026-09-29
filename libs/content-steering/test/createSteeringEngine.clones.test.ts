import { createSteeringEngine, type PathwayClone } from '@svta/cml-content-steering'
import { deepEqual, equal } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

function clone(id: string, baseId: string, replacement: PathwayClone['URI-REPLACEMENT'] = { HOST: 'backup.example.com' }): PathwayClone {
	return { 'BASE-ID': baseId, ID: id, 'URI-REPLACEMENT': replacement }
}

function manifestWithClones(clones: PathwayClone[], priority: string[]): StubResponse {
	return manifestResponse({ VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': priority, 'PATHWAY-CLONES': clones })
}

async function receive(...responses: StubResponse[]) {
	const { requester } = createStubRequester(...responses)
	const events: string[] = []
	const received: (readonly PathwayClone[])[] = []
	const engine = createSteeringEngine({
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		requester,
		onManifest: (_manifest, clones) => {
			events.push('manifest')
			received.push(clones)
		},
		onPathwayChange: (pathway) => events.push(`pathway ${pathway}`),
	})

	await engine.start()

	return { engine, events, received }
}

describe('createSteeringEngine clones', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('passes the valid clones to onManifest before it selects a clone', async () => {
		//#region example
		const valid = clone('CDN-A-CLONE', 'CDN-A')
		const { engine, events, received } = await receive(manifestWithClones([valid], ['CDN-A-CLONE', 'CDN-A']))
		engine.stop()

		deepEqual(received, [[valid]])
		deepEqual(events, ['manifest', 'pathway CDN-A-CLONE'])
		equal(engine.pathway, 'CDN-A-CLONE')
		//#endregion example
	})

	it('accepts a clone of an earlier clone and ignores a clone of a later clone', async () => {
		const first = clone('C1', 'CDN-A')
		const second = clone('C2', 'C1')
		const early = clone('C0', 'C3')
		const late = clone('C3', 'CDN-B')
		const { engine, received } = await receive(manifestWithClones([first, second, early, late], ['C0', 'C2']))
		engine.stop()

		deepEqual(received[0], [first, second, late])
		equal(engine.pathway, 'C2')
	})

	it('ignores clones that are not valid', async () => {
		const invalid = [
			clone('C1', 'CDN-X'),
			clone('CDN-B', 'CDN-A'),
			clone('C 2', 'CDN-A'),
			clone('C3', 'CDN-A', { HOST: 'backup.example.com:8443' }),
			clone('C4', 'CDN-A', { HOST: '' }),
			clone('C5', 'CDN-A', { PARAMS: { '': 'x' } }),
			// @ts-expect-error - a PARAMS value that is not a string
			clone('C6', 'CDN-A', { PARAMS: { token: 1 } }),
		]
		const valid = clone('C7', 'CDN-A', { PARAMS: { token: 'x' } })
		const duplicate = clone('C7', 'CDN-B')
		const { engine, received } = await receive(manifestWithClones([...invalid, valid, duplicate], ['C1', 'C3', 'C7']))
		engine.stop()

		deepEqual(received[0], [valid])
		equal(engine.pathway, 'C7')
	})

	it('ignores a clone that acceptClone refuses', async () => {
		const refused = clone('C1', 'CDN-A')
		const accepted = clone('C2', 'CDN-A')
		const { requester } = createStubRequester(manifestWithClones([refused, accepted], ['C1', 'C2']))
		const received: (readonly PathwayClone[])[] = []
		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: 'https://steering.example.com/manifest.json',
			pathways: ['CDN-A', 'CDN-B'],
			pathway: 'CDN-A',
			requester,
			acceptClone: (candidate) => candidate.ID !== 'C1',
			onManifest: (_manifest, clones) => received.push(clones),
		})

		await engine.start()
		engine.stop()

		deepEqual(received, [[accepted]])
		equal(engine.pathway, 'C2')
	})

	it('ignores a clone without a valid structure and applies the Steering Manifest', async () => {
		const valid = clone('C1', 'CDN-A')
		// @ts-expect-error - a clone without a string ID
		const broken: PathwayClone = { 'BASE-ID': 'CDN-A', ID: 5, 'URI-REPLACEMENT': {} }
		const { engine, received } = await receive(manifestWithClones([broken, valid], ['C1', 'CDN-A']))
		engine.stop()

		deepEqual(received[0], [valid])
		equal(engine.pathway, 'C1')
	})

	it('knows only the clones of the current Steering Manifest', async () => {
		const temporary = clone('CDN-A-CLONE', 'CDN-A')
		const { engine, received } = await receive(
			manifestWithClones([temporary], ['CDN-A-CLONE', 'CDN-B']),
			manifestResponse({ VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A-CLONE', 'CDN-B'] }),
		)

		equal(engine.pathway, 'CDN-A-CLONE')

		mock.timers.tick(60000)
		await flush()
		engine.stop()

		deepEqual(received[1], [])
		equal(engine.pathway, 'CDN-B')
	})
})
