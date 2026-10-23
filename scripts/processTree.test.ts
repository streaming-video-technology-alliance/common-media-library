import { equal, ok } from 'node:assert/strict'
import type { Readable } from 'node:stream'
import { describe, it } from 'vite-plus/test'
import { killTree, spawnTree } from './processTree.ts'

// Starts a grandchild that shares the output pipes and never exits on its own.
const parentScript = `
const { spawn } = process.getBuiltinModule('node:child_process')
const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'inherit' })
process.stdout.write(child.pid + '\\n')
setInterval(() => {}, 1000)
`

function firstLine(stream: Readable): Promise<string> {
	return new Promise(resolve => {
		let text = ''
		const onData = (chunk: Buffer): void => {
			text += chunk.toString()
			const end = text.indexOf('\n')
			if (end >= 0) {
				stream.off('data', onData)
				stream.resume()
				resolve(text.slice(0, end))
			}
		}
		stream.on('data', onData)
	})
}

function isRunning(pid: number): boolean {
	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

async function until(check: () => boolean, ms: number): Promise<boolean> {
	const deadline = Date.now() + ms
	while (Date.now() < deadline) {
		if (check()) {
			return true
		}
		await new Promise(resolve => setTimeout(resolve, 50))
	}
	return check()
}

describe('killTree', () => {
	it('stops the process and the subprocesses that share its output pipes', async () => {
		const child = spawnTree(process.execPath, ['-e', parentScript], {
			cwd: process.cwd(),
			env: process.env,
		})
		const grandchild = Number(await firstLine(child.stdout))
		ok(grandchild > 0, 'the grandchild did not report its pid')
		ok(isRunning(grandchild))

		const closed = new Promise<boolean>(resolve => {
			child.on('close', () => resolve(true))
			setTimeout(() => resolve(false), 3000).unref()
		})

		killTree(child)

		equal(await closed, true, 'the process did not close within 3 seconds after killTree')
		equal(
			await until(() => !isRunning(grandchild), 1000),
			true,
			'the grandchild is still running after killTree',
		)
	})

	it('does nothing for a process that already exited', async () => {
		const child = spawnTree(process.execPath, ['-e', ''], { cwd: process.cwd(), env: process.env })
		await new Promise(resolve => child.on('close', resolve))
		killTree(child)
	})
})
