import type { ChildProcess } from 'node:child_process'
import { availableParallelism } from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { skillDir, writeSkill } from './agentDocs.ts'
import { killTree, spawnTree } from './processTree.ts'
import { loadWorkspaces, runWorkspaces, type Workspace } from './workspaces.ts'

const { values } = parseArgs({ options: { concurrency: { type: 'string', short: 'c' } } })
const limit = Number(values.concurrency ?? availableParallelism())

if (!Number.isInteger(limit) || limit < 1) {
	throw new Error(`Invalid --concurrency "${values.concurrency}". Expected a positive integer.`)
}

const root = path.resolve(import.meta.dirname, '..')
const build = path.join(root, 'scripts', 'build.ts')
const bin = path.join(root, 'node_modules', '.bin')
const env = { ...process.env, PATH: `${bin}${path.delimiter}${process.env['PATH'] ?? ''}` }
const children = new Set<ChildProcess>()

function cancelAll(): void {
	for (const child of children) {
		killTree(child)
	}
}

// The builds run in their own process groups, so the terminal does not forward Ctrl+C to them.
process.on('SIGINT', () => {
	cancelAll()
	process.exit(130)
})
process.on('SIGTERM', () => {
	cancelAll()
	process.exit(143)
})

function buildWorkspace(workspace: Workspace): Promise<void> {
	const started = performance.now()

	return new Promise<void>((resolve, reject) => {
		const child = spawnTree(process.execPath, [build], { cwd: path.join(root, workspace.folder), env })
		const output: Buffer[] = []

		children.add(child)
		child.stdout.on('data', chunk => output.push(chunk))
		child.stderr.on('data', chunk => output.push(chunk))
		child.on('error', reject)
		child.on('close', (code, signal) => {
			children.delete(child)

			const seconds = ((performance.now() - started) / 1000).toFixed(1)
			const text = Buffer.concat(output).toString().trim()

			if (code === 0) {
				console.log(`${workspace.name} built in ${seconds}s`)
				if (text) {
					console.log(text)
				}
				resolve()
			}
			else if (signal) {
				console.error(`${workspace.name} cancelled after ${seconds}s`)
				reject(new Error(`${workspace.name} build cancelled`))
			}
			else {
				console.error(`${workspace.name} failed with exit code ${code} after ${seconds}s`)
				if (text) {
					console.error(text)
				}
				reject(new Error(`${workspace.name} build failed`))
			}
		})
	})
}

const workspaces = loadWorkspaces('libs')
const started = performance.now()

try {
	await runWorkspaces(workspaces, limit, buildWorkspace)
	console.log(`Built ${workspaces.length} packages in ${((performance.now() - started) / 1000).toFixed(1)}s with concurrency ${limit}`)
	writeSkill()
	console.log(`Wrote ${skillDir}`)
}
catch (error) {
	cancelAll()
	console.error(error instanceof Error ? error.message : String(error))
	process.exitCode = 1
}
