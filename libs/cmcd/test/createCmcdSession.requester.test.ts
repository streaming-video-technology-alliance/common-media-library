import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { fetchRequester } from '@svta/cml-utils'
import { deepEqual, doesNotThrow, equal, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, vi } from 'vite-plus/test'

const URL = 'https://collector.example.com/cmcd'

function settle(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}

describe('createCmcdSession requester', () => {
	beforeEach(() => vi.useFakeTimers({ now: 1000, toFake: ['setTimeout', 'clearTimeout', 'Date'] }))
	afterEach(() => vi.useRealTimers())

	it('throws when an event target has a url and no requester', () => {
		throws(
			() => createCmcdSession({ eventTargets: [{ url: URL, events: [CmcdEventType.ERROR] }] }),
			{
				message:
					'createCmcdSession: requester must be a function when an event target has a url, received undefined',
			},
		)
	})

	it('needs no requester when no event target has a url', () => {
		doesNotThrow(() => createCmcdSession({ sid: 's1' }))
		doesNotThrow(() =>
			createCmcdSession({
				eventTargets: [{ send: () => Promise.resolve(), events: [CmcdEventType.ERROR] }],
			}),
		)
	})

	it('counts a response without status as delivered', async () => {
		const posts: HttpRequest[] = []
		const session = createCmcdSession(
			{ sid: 's1', eventTargets: [{ url: URL, events: [CmcdEventType.PLAY_STATE] }] },
			request => {
				posts.push(request)
				return Promise.resolve({})
			},
		)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await settle()
		vi.advanceTimersByTime(60_000)
		await settle()

		equal(posts.length, 1)
	})

	it('posts with fetchRequester from @svta/cml-utils', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(null, { status: 204 }))
		const session = createCmcdSession(
			{ sid: 's1', eventTargets: [{ url: URL, events: [CmcdEventType.PLAY_STATE] }] },
			fetchRequester,
		)

		session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await settle()

		deepEqual(fetchMock.mock.calls, [
			[
				URL,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/cmcd' },
					body: 'e=ps,sid="s1",sn=0,sta=p,ts=1000,v=2',
					credentials: undefined,
					mode: undefined,
				},
			],
		])
	})
})
