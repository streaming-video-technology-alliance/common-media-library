import { createCmcdSession } from '@svta/cml-cmcd'
import { SfToken } from '@svta/cml-structured-field-values'
import { deepEqual, equal, ok, throws } from 'node:assert'
import { describe, it, mock } from 'node:test'
import { createMockRequester, flushPromises, queryValue } from './helpers/cmcdSessionHarness.ts'

const COLLECTOR = 'https://collector.example.com/cmcd'
const CDN = 'https://cdn.example.com'

describe('CmcdSession errors', () => {
	it('gives a tick error to onError with the stage and the target in the message', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const onError = mock.fn()
		const requester = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: requester.requester, onError, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['sid'], interval: 1, transform: () => {
			throw new Error('boom')
		} }] })
		session.createReporter()
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(onError.mock.callCount(), 1)
		const error = onError.mock.calls[0].arguments[0] as Error
		equal(error.message, `CmcdSession: transform failed for target ${COLLECTOR}: boom`)
		equal((error.cause as Error).message, 'boom')
		equal(requester.requests.length, 0)
		session.dispose()
	})

	it('leaves no unhandled rejection when onError throws at the back-off cap', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const rejections: unknown[] = []
		const collect = (reason: unknown) => {
			rejections.push(reason)
		}
		process.on('unhandledRejection', collect)
		try {
			const requester = createMockRequester(503)
			const session = createCmcdSession({ sid: 'a', requester: requester.requester, onError: () => {
				throw new Error('collector bug')
			}, eventTargets: [{ url: COLLECTOR, events: ['ps'], keys: ['sid'], interval: 0 }] })
			session.createReporter().update({ sta: 'p', ts: 1 })
			await flushPromises()
			session.rotate('b')
			await flushPromises()
			for (const wait of [2000, 4000, 8000, 16000, 32000, 60000]) {
				context.mock.timers.tick(wait)
				await flushPromises()
			}
			equal(requester.requests.length, 8)
			await flushPromises()
			deepEqual(rejections, [])
			session.dispose()
		}
		finally {
			process.off('unhandledRejection', collect)
		}
	})

	it('throws an encoder failure to the caller and commits nothing', () => {
		const session = createCmcdSession({ sid: 's', keys: ['sid', 'sn', 'com.example-x'] })
		const reporter = session.createReporter()
		throws(() => reporter.decorate({ url: `${CDN}/a` }, { 'com.example-x': new SfToken('not a token') }), (error: Error) => {
			ok(error.message.startsWith('CmcdSession: encode failed for target request:'))
			return error.cause !== undefined
		})
		equal(queryValue(reporter.decorate({ url: `${CDN}/a` }).url), 'sid="s",sn=0,v=2')
	})

	it('makes every call a no-op after dispose, except createReporter which throws', async () => {
		const requester = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: requester.requester, eventTargets: [{ url: COLLECTOR, events: ['ps', 'e', 'sk'], keys: ['sid'], interval: 0 }] })
		const reporter = session.createReporter()
		session.dispose()
		reporter.update({ sta: 'p' })
		reporter.recordEvent('sk')
		reporter.recordError('X')
		const req = reporter.decorate({ url: `${CDN}/a` })
		equal(req.url, `${CDN}/a`)
		deepEqual(req.cmcd, { sid: 's', data: {} })
		session.rotate('b')
		equal(session.sid, 's')
		session.configure({ version: 1 })
		session.flush()
		await flushPromises()
		equal(requester.requests.length, 0)
		throws(() => session.createReporter(), { message: 'CmcdSession: createReporter must be a live session, received a disposed session' })
	})

	it('removes a disposed reporter from interval reports and target state', async (context) => {
		context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 })
		const requester = createMockRequester()
		const session = createCmcdSession({ sid: 's', requester: requester.requester, eventTargets: [{ url: COLLECTOR, events: ['t'], keys: ['cid', 'ec', 'sid'], interval: 1 }] })
		const primary = session.createReporter({ cid: 'movie' })
		const ad = session.createReporter({ cid: 'ad' })
		ad.recordError('AD_ERR')
		ad.dispose()
		context.mock.timers.tick(1000)
		await flushPromises()
		deepEqual(requester.bodies(), ['cid="movie",e=t,sid="s",ts=2000,v=2'])
		primary.dispose()
		context.mock.timers.tick(1000)
		await flushPromises()
		equal(requester.bodies()[1], 'e=t,sid="s",ts=3000,v=2')
		session.dispose()
	})
})
