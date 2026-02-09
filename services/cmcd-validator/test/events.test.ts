import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { existsSync, unlinkSync } from 'node:fs'
import { Store } from '../src/store.ts'
import { handleEvent } from '../src/events.ts'

const TEST_DB = './test-events.db'

function cleanupDb(path: string): void {
	for (const suffix of ['', '-wal', '-shm']) {
		if (existsSync(path + suffix)) {
			unlinkSync(path + suffix)
		}
	}
}

function startTestServer(store: Store): Promise<{ server: Server; port: number }> {
	return new Promise((resolve) => {
		const server = createServer(async (req, res) => {
			const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
			const match = url.pathname.match(/^\/cmcd\/event\/([^/]+)\/?$/)
			if (match && req.method === 'POST') {
				const targetId = decodeURIComponent(match[1])
				await handleEvent(req, res, store, targetId)
				return
			}
			res.writeHead(404)
			res.end()
		})
		server.listen(0, () => {
			const addr = server.address()
			const port = typeof addr === 'object' && addr ? addr.port : 0
			resolve({ server, port })
		})
	})
}

describe('handleEvent', () => {
	let store: Store
	let server: Server
	let port: number

	beforeEach(async () => {
		cleanupDb(TEST_DB)
		store = new Store(TEST_DB)
		const result = await startTestServer(store)
		server = result.server
		port = result.port
	})

	afterEach(() => {
		server.close()
		store.close()
		cleanupDb(TEST_DB)
	})

	// #region example
	it('should accept text/cmcd event reports', async () => {
		const body = 'e=ps,sid="session-1",ts=1700000000000,sta=p\ne=t,sid="session-1",ts=1700000001000,bl=5000\n'

		const response = await fetch(`http://localhost:${port}/cmcd/event/target-1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body,
		})

		assert.equal(response.status, 204)

		const reports = store.getAll()
		assert.equal(reports.length, 2)
		assert.equal(reports[0].sessionId, 'session-1')
		assert.equal(reports[0].targetId, 'target-1')
		assert.equal(reports[0].type, 'event')
		assert.equal(reports[0].eventType, 'ps')
	})
	// #endregion example

	it('should accept application/json event reports', async () => {
		const body = JSON.stringify([
			{ sid: 'session-2', e: 'bc', ts: 1700000000000, br: 2000 },
		])

		const response = await fetch(`http://localhost:${port}/cmcd/event/target-2`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
		})

		assert.equal(response.status, 204)

		const reports = store.getAll()
		assert.equal(reports.length, 1)
		assert.equal(reports[0].sessionId, 'session-2')
		assert.equal(reports[0].data.br, 2000)
	})

	it('should handle events without a session ID', async () => {
		const body = 'e=t,ts=1700000000000\n'

		const response = await fetch(`http://localhost:${port}/cmcd/event/target-3`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body,
		})

		assert.equal(response.status, 204)

		const reports = store.getAll()
		assert.equal(reports[0].sessionId, 'unknown')
	})
})
