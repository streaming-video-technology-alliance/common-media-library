import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export type Workspace = {
	folder: string
	name: string
	peers: string[]
}

type PackageJson = {
	name: string
	peerDependencies?: Record<string, string>
}

const scope = '@svta/cml-'

// Reads every package under `dir`. `peers` holds the peer dependencies in the CML scope.
export function loadWorkspaces(dir: string): Workspace[] {
	return readdirSync(dir, { withFileTypes: true })
		.filter(entry => entry.isDirectory() && existsSync(path.join(dir, entry.name, 'package.json')))
		.map(entry => {
			const folder = `${dir}/${entry.name}`
			const json: PackageJson = JSON.parse(readFileSync(path.join(folder, 'package.json'), 'utf8'))
			const peers = Object.keys(json.peerDependencies ?? {}).filter(peer => peer.startsWith(scope))
			return { folder, name: json.name, peers }
		})
}

function isReady(workspace: Workspace, names: Set<string>, done: Set<string>): boolean {
	return workspace.peers.every(peer => !names.has(peer) || done.has(peer))
}

// Orders the workspaces so that every peer comes before the packages that depend on it.
// Packages with the same readiness are ordered by folder name, so the result is stable.
export function sortWorkspaces(workspaces: Workspace[]): Workspace[] {
	const names = new Set(workspaces.map(w => w.name))
	const remaining = [...workspaces].sort((a, b) =>
		a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0,
	)
	const done = new Set<string>()
	const sorted: Workspace[] = []

	while (remaining.length > 0) {
		const ready = remaining.filter(w => isReady(w, names, done))

		if (ready.length === 0) {
			throw new Error(
				`Dependency cycle between workspaces: ${remaining.map(w => w.name).join(', ')}`,
			)
		}

		for (const workspace of ready) {
			sorted.push(workspace)
			done.add(workspace.name)
			remaining.splice(remaining.indexOf(workspace), 1)
		}
	}

	return sorted
}

// Runs `task` for every workspace. A workspace starts once all of its peers finished,
// with at most `limit` tasks at the same time. The first failure stops new tasks.
export function runWorkspaces(
	workspaces: Workspace[],
	limit: number,
	task: (workspace: Workspace) => Promise<void>,
): Promise<void> {
	const pending = sortWorkspaces(workspaces)
	const names = new Set(pending.map(w => w.name))
	const done = new Set<string>()
	const max = Math.max(1, limit)
	let active = 0
	let failed = false

	return new Promise<void>((resolve, reject) => {
		const next = (): void => {
			if (failed) {
				return
			}

			if (pending.length === 0 && active === 0) {
				resolve()
				return
			}

			while (active < max) {
				const index = pending.findIndex(w => isReady(w, names, done))

				if (index < 0) {
					return
				}

				const [workspace] = pending.splice(index, 1)
				active++

				task(workspace).then(
					() => {
						active--
						done.add(workspace.name)
						next()
					},
					error => {
						failed = true
						reject(error)
					},
				)
			}
		}

		next()
	})
}
