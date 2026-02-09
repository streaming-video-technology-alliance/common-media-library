import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, unlinkSync } from 'node:fs'
import { Store } from '../src/store.ts'
import type { Cmcd } from '@svta/cml-cmcd'
import type { CmcdReport } from '../src/types.ts'

const TEST_DB = './test-store.db'

function cleanupDb(path: string): void {
	for (const suffix of ['', '-wal', '-shm']) {
		if (existsSync(path + suffix)) {
			unlinkSync(path + suffix)
		}
	}
}

function createReport(overrides: Partial<CmcdReport> = {}): CmcdReport {
	return {
		id: crypto.randomUUID(),
		sessionId: 'test-session',
		type: 'request',
		timestamp: new Date().toISOString(),
		data: { sid: 'test-session', br: 1000 } as unknown as Cmcd,
		requestUrl: 'https://example.com/video.mp4',
		method: 'GET',
		...overrides,
	}
}

describe('Store', () => {
	let store: Store

	beforeEach(() => {
		cleanupDb(TEST_DB)
		store = new Store(TEST_DB)
	})

	afterEach(() => {
		store.close()
		cleanupDb(TEST_DB)
	})

	it('should create the database on construction', () => {
		assert.ok(existsSync(TEST_DB))
	})

	it('should insert and retrieve a report', () => {
		const report = createReport()
		store.insert(report)

		const all = store.getAll()
		assert.equal(all.length, 1)
		assert.equal(all[0].id, report.id)
		assert.equal(all[0].sessionId, 'test-session')
	})

	it('should retrieve reports by session ID', () => {
		store.insert(createReport({ sessionId: 'session-a' }))
		store.insert(createReport({ sessionId: 'session-b' }))
		store.insert(createReport({ sessionId: 'session-a' }))

		const results = store.getBySessionId('session-a')
		assert.equal(results.length, 2)
		assert.ok(results.every(r => r.sessionId === 'session-a'))
	})

	it('should filter reports by type', () => {
		store.insert(createReport({ type: 'request' }))
		store.insert(createReport({ type: 'event' }))
		store.insert(createReport({ type: 'request' }))

		const requests = store.getAll('request')
		assert.equal(requests.length, 2)

		const events = store.getAll('event')
		assert.equal(events.length, 1)
	})

	it('should clear all reports', () => {
		store.insert(createReport())
		store.insert(createReport())
		assert.equal(store.getAll().length, 2)

		store.clear()
		assert.equal(store.getAll().length, 0)
	})

	it('should preserve CMCD data through serialization', () => {
		const report = createReport({
			data: { sid: 'abc', br: 5000, bl: 12000, su: true } as unknown as Cmcd,
		})
		store.insert(report)

		const retrieved = store.getAll()[0]
		assert.deepEqual(retrieved.data, { sid: 'abc', br: 5000, bl: 12000, su: true })
	})

	it('should return distinct session IDs', () => {
		store.insert(createReport({ sessionId: 'b-session' }))
		store.insert(createReport({ sessionId: 'a-session' }))
		store.insert(createReport({ sessionId: 'b-session' }))

		const ids = store.getSessionIds()
		assert.deepEqual(ids, ['a-session', 'b-session'])
	})
})
