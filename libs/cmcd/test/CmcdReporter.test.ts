import type { CmcdReporterConfig } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdReporter, CmcdTransmissionMode } from '@svta/cml-cmcd'
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { equal, ok } from 'node:assert'
import { describe, it, mock } from 'node:test'

function createMockRequester(status: number = 200) {
	const requests: HttpRequest[] = []

	const requester = async (request: HttpRequest): Promise<{ status: number; }> => {
		requests.push(request)
		return { status }
	}

	return { requester, requests }
}

const EVENT_KEYS = ['br', 'sid', 'cid', 'v', 'e', 'ts', 'sn', 'msd', 'cen'] as const
const RR_KEYS = ['url', 'rc', 'ttfb', 'ttfbb', 'ttlb', 'cmsdd', 'cmsds', 'smrt', 'sid', 'cid', 'v', 'e', 'ts', 'sn'] as const

function createConfig(overrides: Partial<CmcdReporterConfig> = {}): Partial<CmcdReporterConfig> {
	return {
		sid: 'test-session',
		cid: 'test-content',
		enabledKeys: [...EVENT_KEYS],
		eventTargets: [
			{
				url: 'https://example.com/cmcd',
				events: [CmcdEventType.ERROR, CmcdEventType.PLAY_STATE],
				enabledKeys: [...EVENT_KEYS],
				batchSize: 1,
			},
		],
		...overrides,
	}
}

describe('CmcdReporter', () => {
	it('provides a valid example', () => {
		// #region example
		const { requester } = createMockRequester()

		const reporter = new CmcdReporter({
			sid: 'session-id',
			cid: 'content-id',
			enabledKeys: ['br', 'sid', 'cid', 'v'],
			transmissionMode: CmcdTransmissionMode.QUERY,
			eventTargets: [
				{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.ERROR],
					batchSize: 1,
				},
			],
		}, requester)

		reporter.update({ br: [5000] })

		const req = reporter.createRequestReport({ url: 'https://cdn.example.com/segment.mp4' })

		ok(req.url.includes('CMCD='))
		// #endregion example
	})

	describe('constructor', () => {
		it('generates a session ID if not provided', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				enabledKeys: ['sid'],
			}, requester)

			const req = reporter.applyRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.url.includes('sid%3D%22'))
		})

		it('uses the provided session ID', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'my-session',
				enabledKeys: ['sid'],
			}, requester)

			const req = reporter.applyRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.url.includes('sid%3D%22my-session%22'))
		})
	})

	describe('update', () => {
		it('updates the CMCD data', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['br'],
			}, requester)

			reporter.update({ br: [3000] })

			const req = reporter.applyRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.url.includes('br%3D%283000%29'))
		})

		it('merges data with existing data', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['br', 'bl'],
			}, requester)

			reporter.update({ br: [3000] })
			reporter.update({ bl: [5000] })

			const req = reporter.applyRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.url.includes('bl%3D%285000%29'))
			ok(req.url.includes('br%3D%283000%29'))
		})

		it('resets session when sid changes', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.update({ br: [3000] })
			reporter.update({ sid: 'new-session' })
		})
	})

	describe('createRequestReport', () => {
		it('returns the request unchanged if no enabled keys', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
			}, requester)

			const req = { url: 'https://example.com/video.mp4' }
			const result = reporter.createRequestReport(req)
			equal(result.url, req.url)
		})

		it('appends CMCD data as query parameter by default', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['br', 'v'],
			}, requester)

			reporter.update({ br: [5000] })

			const result = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			const url = new URL(result.url)
			ok(url.searchParams.has('CMCD'))
		})

		it('appends CMCD data as headers when configured', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['br', 'v'],
				transmissionMode: CmcdTransmissionMode.HEADERS,
			}, requester)

			reporter.update({ br: [5000] })

			const result = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(result.headers)
		})

		it('stores prepared CMCD data on customData.cmcd', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['br', 'v'],
			}, requester)

			reporter.update({ br: [5000] })

			const result = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(result.customData)
			ok(result.customData.cmcd)
			ok('br' in result.customData.cmcd)
			ok('v' in result.customData.cmcd)
		})

		it('preserves existing customData', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['br'],
			}, requester)

			reporter.update({ br: [5000] })

			const result = reporter.createRequestReport({
				url: 'https://example.com/video.mp4',
				customData: { foo: 'bar' },
			})

			ok(result.customData)
			equal(result.customData.foo, 'bar')
			ok(result.customData.cmcd)
		})

		it('includes msd only once in request reports', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['msd'],
			}, requester)

			reporter.update({ msd: 1000 })

			const first = reporter.createRequestReport({ url: 'https://example.com/seg1.mp4' })
			ok(first.url.includes('msd%3D1000'))

			const second = reporter.createRequestReport({ url: 'https://example.com/seg2.mp4' })
			ok(!second.url.includes('msd'))
		})
	})

	describe('recordEvent', () => {
		it('sends event reports to the configured target', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			equal(requests[0].url, 'https://example.com/cmcd')
			equal(requests[0].method, 'POST')
			equal(requests[0].headers?.['Content-Type'], 'text/cmcd')
		})

		it('includes event type and timestamp in the report', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			ok((requests[0].body as string)?.includes('e=e'))
			ok((requests[0].body as string)?.includes('ts='))
		})

		it('increments sequence number for each event', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.PLAY_STATE)

			await new Promise(resolve => setTimeout(resolve, 10))

			ok((requests[0].body as string)?.includes('sn=0'))
			ok((requests[1].body as string)?.includes('sn=1'))
		})

		it('updates data before recording the event', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { br: [5000] })

			await new Promise(resolve => setTimeout(resolve, 10))

			ok((requests[0].body as string)?.includes('br=(5000)'))
		})

		it('sends custom events with event type', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.CUSTOM_EVENT],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'my-custom-event' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('e=ce'))
		})

		it('includes msd only once in event reports', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.update({ msd: 500 })
			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.PLAY_STATE)

			await new Promise(resolve => setTimeout(resolve, 10))

			ok((requests[0].body as string)?.includes('msd=500'))
			ok(!(requests[1].body as string)?.includes('msd'))
		})
	})

	describe('recordResponseReceived', () => {
		function createRrConfig(overrides: Partial<CmcdReporterConfig> = {}): Partial<CmcdReporterConfig> {
			return {
				sid: 'test-session',
				cid: 'test-content',
				enabledKeys: [...RR_KEYS],
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.RESPONSE_RECEIVED],
						enabledKeys: [...RR_KEYS],
						batchSize: 1,
					},
				],
				...overrides,
			}
		}

		function createResponse(overrides: Partial<HttpResponse> = {}): HttpResponse {
			return {
				request: { url: 'https://cdn.example.com/segment.mp4' },
				status: 200,
				resourceTiming: {
					startTime: 1000,
					responseStart: 1050,
					duration: 200,
					encodedBodySize: 1024,
				},
				...overrides,
			}
		}

		it('provides a valid example', async () => {
			// #region example-rr
			const { requester, requests } = createMockRequester()

			const reporter = new CmcdReporter({
				sid: 'session-id',
				cid: 'content-id',
				enabledKeys: [...RR_KEYS],
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.RESPONSE_RECEIVED],
						enabledKeys: [...RR_KEYS],
						batchSize: 1,
					},
				],
			}, requester)

			reporter.recordResponseReceived({
				request: { url: 'https://cdn.example.com/segment.mp4' },
				status: 200,
				resourceTiming: {
					startTime: 1000,
					responseStart: 1050,
					duration: 200,
					encodedBodySize: 1024,
				},
			})

			await new Promise(resolve => setTimeout(resolve, 10))
			ok((requests[0].body as string)?.includes('e=rr'))
			// #endregion example-rr
		})

		it('derives timing values from resourceTiming', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createRrConfig(), requester)

			reporter.recordResponseReceived(createResponse())

			await new Promise(resolve => setTimeout(resolve, 10))

			const body = requests[0].body as string
			ok(body.includes('e=rr'))
			ok(body.includes('rc=200'))
			ok(body.includes('ttfb=50'))
			ok(body.includes('ttlb=200'))
			ok(body.includes('ts='))
			ok(body.includes('url="https://cdn.example.com/segment.mp4"'))
		})

		it('falls back to Date.now() when resourceTiming is missing', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createRrConfig(), requester)
			const before = Date.now()

			reporter.recordResponseReceived(createResponse({
				resourceTiming: undefined,
			}))

			await new Promise(resolve => setTimeout(resolve, 10))

			const body = requests[0].body as string
			ok(body.includes('e=rr'))
			ok(!body.includes('ttfb='))
			ok(!body.includes('ttlb='))

			const tsMatch = body.match(/ts=(\d+)/)
			ok(tsMatch)
			const ts = Number(tsMatch?.[1])
			ok(ts >= before)
		})

		it('omits ttfb when responseStart is missing', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createRrConfig(), requester)

			reporter.recordResponseReceived(createResponse({
				resourceTiming: {
					startTime: 1000,
					duration: 200,
					encodedBodySize: 1024,
				},
			}))

			await new Promise(resolve => setTimeout(resolve, 10))

			const body = requests[0].body as string
			ok(!body.includes('ttfb='))
			ok(body.includes('ttlb=200'))
		})

		it('allows player-supplied overrides via data parameter', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createRrConfig(), requester)

			reporter.recordResponseReceived(createResponse(), {
				ttfbb: 60,
				cmsdd: 'abc123',
			})

			await new Promise(resolve => setTimeout(resolve, 10))

			const body = requests[0].body as string
			ok(body.includes('ttfbb=60'))
			ok(body.includes('cmsdd="abc123"'))
		})

		it('does not send if no event target is configured for rr', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordResponseReceived(createResponse())

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 0)
		})
	})

	describe('batching', () => {
		it('batches events according to batchSize', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR, CmcdEventType.PLAY_STATE],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 3,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.PLAY_STATE)

			await new Promise(resolve => setTimeout(resolve, 10))

			// Only 2 events recorded, but batch size is 3, so no report should be sent
			equal(requests.length, 0)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			// Now 3 events recorded, batch size met
			equal(requests.length, 1)
		})
	})

	describe('flush', () => {
		it('sends all queued events regardless of batch size', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR, CmcdEventType.PLAY_STATE],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 10,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.PLAY_STATE)

			await new Promise(resolve => setTimeout(resolve, 10))

			// Batch size is 10, so nothing should have been sent
			equal(requests.length, 0)

			reporter.flush()

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
		})
	})

	describe('start and stop', () => {
		it('starts and stops the time interval', () => {
			const timers = mock.timers
			timers.enable({ apis: ['setInterval'] })

			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.TIME_INTERVAL],
						enabledKeys: [...EVENT_KEYS],
						interval: 30,
						batchSize: 1,
					},
				],
			}), requester)

			reporter.start()

			// The first time interval event is sent immediately
			equal(requests.length, 1)

			timers.tick(30_000)
			equal(requests.length, 2)

			reporter.stop()

			timers.tick(30_000)
			// No more events after stop
			equal(requests.length, 2)

			timers.reset()
		})

		it('does not start interval if TIME_INTERVAL event is not configured', () => {
			const timers = mock.timers
			timers.enable({ apis: ['setInterval'] })

			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR],
						enabledKeys: [...EVENT_KEYS],
						interval: 30,
						batchSize: 1,
					},
				],
			}), requester)

			reporter.start()

			timers.tick(30_000)
			equal(requests.length, 0)

			reporter.stop()
			timers.reset()
		})
	})

	describe('event target response handling', () => {
		it('removes event target on 410 response', async () => {
			const { requester, requests } = createMockRequester(410)
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 1)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))
			// Target was removed, so second event should not be sent
			equal(requests.length, 1)
		})
	})

	describe('multiple event targets', () => {
		it('sends events to all configured targets', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd-1',
						events: [CmcdEventType.ERROR],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
					},
					{
						url: 'https://example.com/cmcd-2',
						events: [CmcdEventType.ERROR],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			equal(requests[0].url, 'https://example.com/cmcd-1')
			equal(requests[1].url, 'https://example.com/cmcd-2')
		})
	})

	describe('config normalization', () => {
		it('ignores event targets without url', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['e'],
				eventTargets: [
					{ url: '', events: [CmcdEventType.ERROR], batchSize: 1 },
				],
			}, requester)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 0)
		})

		it('ignores event targets without events', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['e'],
				eventTargets: [
					{ url: 'https://example.com/cmcd', events: [], batchSize: 1 },
				],
			}, requester)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 0)
		})
	})
})
