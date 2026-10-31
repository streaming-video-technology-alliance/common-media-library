import { deepEqual, equal, ok, rejects, throws } from 'node:assert/strict'
import { describe, it } from 'vite-plus/test'
import { loadWorkspaces, runWorkspaces, sortWorkspaces, type Workspace } from './workspaces.ts'

function workspace(folder: string, peers: string[] = []): Workspace {
	return {
		folder: `libs/${folder}`,
		name: `@svta/cml-${folder}`,
		peers: peers.map(p => `@svta/cml-${p}`),
	}
}

function folders(workspaces: Workspace[]): string[] {
	return workspaces.map(w => w.folder)
}

describe('sortWorkspaces', () => {
	it('places every peer before the package that depends on it', () => {
		const sorted = sortWorkspaces([
			workspace('cmcd', ['utils', 'sfv']),
			workspace('sfv', ['utils']),
			workspace('utils'),
		])
		deepEqual(folders(sorted), ['libs/utils', 'libs/sfv', 'libs/cmcd'])
	})

	it('orders independent packages by folder name', () => {
		const sorted = sortWorkspaces([workspace('xml'), workspace('608'), workspace('cta')])
		deepEqual(folders(sorted), ['libs/608', 'libs/cta', 'libs/xml'])
	})

	it('ignores a peer that is not one of the workspaces', () => {
		const sorted = sortWorkspaces([workspace('dash', ['xml', 'missing']), workspace('xml')])
		deepEqual(folders(sorted), ['libs/xml', 'libs/dash'])
	})

	it('throws for a dependency cycle and names the packages in the cycle', () => {
		throws(
			() => sortWorkspaces([workspace('utils'), workspace('a', ['b']), workspace('b', ['a'])]),
			/cycle.*@svta\/cml-a.*@svta\/cml-b|cycle.*@svta\/cml-b.*@svta\/cml-a/,
		)
	})
})

describe('runWorkspaces', () => {
	type Event = { folder: string; type: 'start' | 'end' }

	async function run(
		workspaces: Workspace[],
		limit: number,
		fail: string[] = [],
	): Promise<{ events: Event[]; peak: number }> {
		const events: Event[] = []
		let active = 0
		let peak = 0

		const result = runWorkspaces(workspaces, limit, async w => {
			events.push({ folder: w.folder, type: 'start' })
			active++
			peak = Math.max(peak, active)
			await new Promise(resolve => setTimeout(resolve, 5))
			active--
			events.push({ folder: w.folder, type: 'end' })

			if (fail.includes(w.folder)) {
				throw new Error(`${w.folder} failed`)
			}
		})

		await result.catch(() => undefined)
		return { events, peak }
	}

	it('starts a package only after all of its peers finished', async () => {
		const { events } = await run(
			[workspace('cmcd', ['utils', 'sfv']), workspace('sfv', ['utils']), workspace('utils')],
			4,
		)

		const index = (folder: string, type: Event['type']): number =>
			events.findIndex(e => e.folder === `libs/${folder}` && e.type === type)

		ok(index('utils', 'end') < index('sfv', 'start'))
		ok(index('utils', 'end') < index('cmcd', 'start'))
		ok(index('sfv', 'end') < index('cmcd', 'start'))
	})

	it('never runs more tasks at once than the limit', async () => {
		const { peak, events } = await run(
			[workspace('a'), workspace('b'), workspace('c'), workspace('d'), workspace('e')],
			2,
		)

		equal(peak, 2)
		equal(events.filter(e => e.type === 'end').length, 5)
	})

	it('rejects with the first failure and starts no further packages', async () => {
		const workspaces = [workspace('utils'), workspace('a', ['utils']), workspace('b', ['a'])]

		await rejects(
			runWorkspaces(workspaces, 1, w =>
				w.folder === 'libs/a' ? Promise.reject(new Error('libs/a failed')) : Promise.resolve(),
			),
			/libs\/a failed/,
		)

		const { events } = await run(workspaces, 1, ['libs/a'])
		equal(
			events.some(e => e.folder === 'libs/b'),
			false,
		)
	})
})

describe('loadWorkspaces', () => {
	it('reads every package under libs with its workspace peers', () => {
		const workspaces = loadWorkspaces('libs')
		const names = new Set(workspaces.map(w => w.name))

		ok(names.has('@svta/cml-utils'))
		ok(names.has('@svta/cml-cmcd'))

		for (const w of workspaces) {
			for (const peer of w.peers) {
				ok(names.has(peer), `${w.name} lists unknown peer ${peer}`)
			}
		}
	})

	it('sorts the repository so that every peer comes before its dependents', () => {
		const workspaces = loadWorkspaces('libs')
		const sorted = sortWorkspaces(workspaces)
		const position = new Map(sorted.map((w, i) => [w.name, i]))

		equal(sorted.length, workspaces.length)

		for (const w of sorted) {
			for (const peer of w.peers) {
				const peerIndex = position.get(peer) ?? Infinity
				const index = position.get(w.name) ?? Infinity
				ok(peerIndex < index, `${peer} must build before ${w.name}`)
			}
		}
	})
})
