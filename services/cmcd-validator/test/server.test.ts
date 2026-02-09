import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { existsSync, unlinkSync } from 'node:fs'
import type { Cmcd } from '@svta/cml-cmcd'
import { Store } from '../src/store.ts'
import { handleEvent } from '../src/events.ts'
import { handleDeleteReports, handleReports, handleSessions } from '../src/reports.ts'

const TEST_DB = './test-server.db'

function cleanupDb(path: string): void {
	for (const suffix of ['', '-wal', '-shm']) {
		if (existsSync(path + suffix)) {
			unlinkSync(path + suffix)
		}
	}
}

function startTestServer(store: Store): Promise<{ server: Server; port: number }> {
	return new Promise((resolve) => {
		const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
			res.setHeader('Access-Control-Allow-Origin', '*')

			const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
			const pathname = url.pathname

			if (pathname === '/sessions' && req.method === 'GET') {
				handleSessions(res, store)
				return
			}

			const eventMatch = pathname.match(/^\/cmcd\/event\/([^/]+)\/?$/)
			if (eventMatch && req.method === 'POST') {
				const targetId = decodeURIComponent(eventMatch[1])
				await handleEvent(req, res, store, targetId)
				return
			}

			const match = pathname.match(/^\/reports\/(.+)$/)
			if (match && req.method === 'GET') {
				const typeFilter = url.searchParams.get('type') || undefined
				const eventTypeFilter = url.searchParams.get('eventType') || undefined
				const targetIdFilter = url.searchParams.get('targetId') || undefined
				handleReports(res, store, decodeURIComponent(match[1]), typeFilter, eventTypeFilter, targetIdFilter)
				return
			}

			if (pathname === '/reports' && req.method === 'GET') {
				const typeFilter = url.searchParams.get('type') || undefined
				const eventTypeFilter = url.searchParams.get('eventType') || undefined
				const targetIdFilter = url.searchParams.get('targetId') || undefined
				handleReports(res, store, undefined, typeFilter, eventTypeFilter, targetIdFilter)
				return
			}

			if (pathname === '/reports' && req.method === 'DELETE') {
				handleDeleteReports(res, store)
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

describe('Server integration', () => {
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

	it('should collect events and retrieve by session ID', async () => {
		// Post events for two sessions
		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=ps,sid="session-a",ts=1700000000000\n',
		})

		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=t,sid="session-b",ts=1700000001000\n',
		})

		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=bc,sid="session-a",ts=1700000002000,br=3000\n',
		})

		// Get all reports
		const allRes = await fetch(`http://localhost:${port}/reports`)
		const allData = await allRes.json() as { count: number; summary: { totalEvents: number } }
		assert.equal(allData.count, 3)
		assert.equal(allData.summary.totalEvents, 3)

		// Get reports for session-a
		const sessionRes = await fetch(`http://localhost:${port}/reports/session-a`)
		const sessionData = await sessionRes.json() as { count: number; sessionId: string; reports: Array<{ data: { br?: number } }> }
		assert.equal(sessionData.count, 2)
		assert.equal(sessionData.sessionId, 'session-a')
	})

	it('should clear reports via DELETE', async () => {
		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=ps,sid="session-x",ts=1700000000000\n',
		})

		let allRes = await fetch(`http://localhost:${port}/reports`)
		let allData = await allRes.json() as { count: number }
		assert.equal(allData.count, 1)

		const deleteRes = await fetch(`http://localhost:${port}/reports`, { method: 'DELETE' })
		assert.equal(deleteRes.status, 204)

		allRes = await fetch(`http://localhost:${port}/reports`)
		allData = await allRes.json() as { count: number }
		assert.equal(allData.count, 0)
	})

	it('should return summary with observed keys', async () => {
		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=ps,sid="s1",ts=1700000000000,br=1000,bl=5000\n',
		})

		const res = await fetch(`http://localhost:${port}/reports`)
		const data = await res.json() as { summary: { keysObserved: string[] } }

		assert.ok(data.summary.keysObserved.includes('br'))
		assert.ok(data.summary.keysObserved.includes('bl'))
		assert.ok(data.summary.keysObserved.includes('sid'))
		assert.ok(data.summary.keysObserved.includes('e'))
	})

	it('should return all session IDs', async () => {
		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=ps,sid="session-a",ts=1700000000000\n',
		})

		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=t,sid="session-b",ts=1700000001000\n',
		})

		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=bc,sid="session-a",ts=1700000002000\n',
		})

		const res = await fetch(`http://localhost:${port}/sessions`)
		assert.equal(res.status, 200)

		const data = await res.json() as { sessionIds: string[] }
		assert.deepEqual(data.sessionIds, ['session-a', 'session-b'])
	})

	it('should filter reports by eventType query parameter', async () => {
		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=ps,sid="session-et",ts=1700000000000\n',
		})

		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=t,sid="session-et",ts=1700000001000\n',
		})

		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=bc,sid="session-et",ts=1700000002000,br=3000\n',
		})

		// Filter by eventType=ps
		const psRes = await fetch(`http://localhost:${port}/reports?eventType=ps`)
		const psData = await psRes.json() as { count: number }
		assert.equal(psData.count, 1)

		// Filter by eventType=t
		const tRes = await fetch(`http://localhost:${port}/reports?eventType=t`)
		const tData = await tRes.json() as { count: number }
		assert.equal(tData.count, 1)

		// Combine eventType with session filter
		const sessionRes = await fetch(`http://localhost:${port}/reports/session-et?eventType=bc`)
		const sessionData = await sessionRes.json() as { count: number }
		assert.equal(sessionData.count, 1)

		// Non-matching eventType returns empty
		const emptyRes = await fetch(`http://localhost:${port}/reports?eventType=xyz`)
		const emptyData = await emptyRes.json() as { count: number }
		assert.equal(emptyData.count, 0)
	})

	it('should filter reports by targetId query parameter', async () => {
		await fetch(`http://localhost:${port}/cmcd/event/target-a`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=ps,sid="session-tid",ts=1700000000000\n',
		})

		await fetch(`http://localhost:${port}/cmcd/event/target-b`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=t,sid="session-tid",ts=1700000001000\n',
		})

		await fetch(`http://localhost:${port}/cmcd/event/target-a`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=bc,sid="session-tid",ts=1700000002000\n',
		})

		// Filter by targetId on /reports
		const aRes = await fetch(`http://localhost:${port}/reports?targetId=target-a`)
		const aData = await aRes.json() as { count: number }
		assert.equal(aData.count, 2)

		const bRes = await fetch(`http://localhost:${port}/reports?targetId=target-b`)
		const bData = await bRes.json() as { count: number }
		assert.equal(bData.count, 1)

		// Filter by targetId on /reports/:sessionId
		const sessionRes = await fetch(`http://localhost:${port}/reports/session-tid?targetId=target-a`)
		const sessionData = await sessionRes.json() as { count: number }
		assert.equal(sessionData.count, 2)

		// Non-matching targetId returns empty
		const emptyRes = await fetch(`http://localhost:${port}/reports/session-tid?targetId=unknown`)
		const emptyData = await emptyRes.json() as { count: number }
		assert.equal(emptyData.count, 0)
	})

	it('should filter reports by type query parameter', async () => {
		// Insert a request report directly
		store.insert({
			id: crypto.randomUUID(),
			sessionId: 'session-mixed',
			type: 'request',
			timestamp: new Date().toISOString(),
			data: { sid: 'session-mixed', br: 1000 } as unknown as Cmcd,
			requestUrl: 'https://example.com/video.mp4',
			method: 'GET',
		})

		// Post an event
		await fetch(`http://localhost:${port}/cmcd/event/t1`, {
			method: 'POST',
			headers: { 'Content-Type': 'text/cmcd' },
			body: 'e=ps,sid="session-mixed",ts=1700000000000\n',
		})

		const eventsRes = await fetch(`http://localhost:${port}/reports?type=event`)
		const eventsData = await eventsRes.json() as { count: number }
		assert.equal(eventsData.count, 1)

		const requestsRes = await fetch(`http://localhost:${port}/reports?type=request`)
		const requestsData = await requestsRes.json() as { count: number }
		assert.equal(requestsData.count, 1)
	})
})
