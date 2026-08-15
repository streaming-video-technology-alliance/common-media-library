import type { Cmcd, CmcdEventReportTransform, CmcdKey, CmcdReporterConfig, CmcdRequestProvenance, CmcdRequestReport, CmcdRequestReportTransform, CmcdTransformRequest } from '@svta/cml-cmcd'
import { CMCD_REQUEST_PROVENANCE, CmcdEventType, CmcdReporter, CmcdTransmissionMode, validateCmcdEventReport } from '@svta/cml-cmcd'
import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { deepEqual, equal, notEqual, ok, throws } from 'node:assert'
import { describe, it, mock } from 'node:test'

function createMockRequester(status: number = 200) {
	const requests: HttpRequest[] = []

	const requester = async (request: HttpRequest): Promise<{ status: number; }> => {
		requests.push(request)
		return { status }
	}

	return { requester, requests }
}

const EVENT_KEYS = ['br', 'sid', 'cid', 'v', 'e', 'ts', 'sn', 'msd', 'cen', 'sta'] as const
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

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.url.includes('sid%3D%22'))
		})

		it('uses the provided session ID', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'my-session',
				enabledKeys: ['sid'],
			}, requester)

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
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

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
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

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.url.includes('bl%3D%285000%29'))
			ok(req.url.includes('br%3D%283000%29'))
		})

		it('resets session when sid changes', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.ERROR)
			const before = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			ok((requests[0].body as string).includes('sn=0'))
			ok((requests[1].body as string).includes('sn=1'))
			ok((requests[1].body as string).includes('sid="test-session"'))
			ok(before.url.includes('sn%3D0'))
			ok(before.url.includes('sid%3D%22test-session%22'))

			reporter.update({ sid: 'new-session' })

			// Both mode counters restart at 0 and reports carry the new sid.
			reporter.recordEvent(CmcdEventType.ERROR)
			const after = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 3)
			ok((requests[2].body as string).includes('sn=0'))
			ok((requests[2].body as string).includes('sid="new-session"'))
			ok(after.url.includes('sn%3D0'))
			ok(after.url.includes('sid%3D%22new-session%22'))
		})

		describe('msd validation', () => {
			const cases = [
				{ name: 'accepts 0 as a valid instant-start value', input: 0, wire: 'msd%3D0' },
				{ name: 'rounds fractional milliseconds to the nearest integer', input: 12.5, wire: 'msd%3D13' },
				{ name: 'accepts the RFC 8941 integer maximum', input: 999_999_999_999_999, wire: 'msd%3D999999999999999' },
				{ name: 'accepts a value that rounds down to the maximum', input: 999_999_999_999_998.6, wire: 'msd%3D999999999999999' },
				{ name: 'rejects values above the RFC 8941 integer maximum', input: 1_000_000_000_000_000, wire: null },
				{ name: 'rejects Infinity', input: Infinity, wire: null },
				{ name: 'rejects negative values', input: -1, wire: null },
				{ name: 'rejects NaN', input: NaN, wire: null },
			] as const

			for (const { name, input, wire } of cases) {
				it(name, () => {
					const { requester } = createMockRequester()
					const reporter = new CmcdReporter({
						sid: 'test-session',
						enabledKeys: ['sid', 'msd', 'v'],
					}, requester)

					reporter.update({ msd: input })

					const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

					if (wire) {
						ok(req.url.includes(wire), `expected ${req.url} to include ${wire}`)
					}
					else {
						ok(!req.url.includes('msd'), `expected ${req.url} to omit msd`)
					}
				})
			}

			it('does not let a rejected value consume the once-per-session gate', () => {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['sid', 'msd', 'v'],
				}, requester)

				reporter.update({ msd: Infinity })
				const first = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
				ok(!first.url.includes('msd'))

				reporter.update({ msd: 800 })
				const second = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
				ok(second.url.includes('msd%3D800'))
			})
		})
	})

	describe('reserved session keys', () => {
		it('stamps the reporter sid over a per-call sid on recordEvent', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { sid: 'INJECTED' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="test-session"'))
			ok(!(requests[0].body as string).includes('INJECTED'))
		})

		it('drops a response whose per-call sid names no retained session', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS],
					batchSize: 1,
				}],
			}), requester)

			// The request carries no provenance record, so the response drops;
			// a per-call sid is not an attribution key and cannot relabel it.
			reporter.recordResponseReceived({
				status: 200,
				request: { url: 'https://cdn.example.com/segment.mp4' },
			}, { sid: 'INJECTED' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 0)
		})

		it('stamps the reporter sid over a per-call sid on createRequestReport', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' }, { sid: 'INJECTED' })

			ok(req.url.includes('sid%3D%22test-session%22'))
			ok(!req.url.includes('INJECTED'))
		})

		it('stamps the reporter sid over a transform-written sid in event mode', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.ERROR],
					enabledKeys: [...EVENT_KEYS],
					batchSize: 1,
					transform: report => ({ ...report, sid: 'EVIL' }),
				}],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="test-session"'))
			ok(!(requests[0].body as string).includes('EVIL'))
		})

		it('stamps the reporter sid over a transform-written sid in request mode', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				transform: data => ({ ...data, sid: 'EVIL' }),
			}), requester)

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

			ok(req.url.includes('sid%3D%22test-session%22'))
			ok(!req.url.includes('EVIL'))
		})

		it('shows transforms the canonical sid even when a per-call sid is supplied', async () => {
			const { requester } = createMockRequester()
			const seen: (string | undefined)[] = []
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.ERROR],
					enabledKeys: [...EVENT_KEYS],
					batchSize: 1,
					transform: (report) => {
						seen.push(report.sid)
						return report
					},
				}],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { sid: 'INJECTED' })

			await new Promise(resolve => setTimeout(resolve, 10))

			deepEqual(seen, ['test-session'])
		})

		it('strips a per-call msd when the gate is closed on recordEvent', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { msd: 5000 })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok(!(requests[0].body as string).includes('msd'))
		})

		it('strips a per-call msd when the gate is closed on recordResponseReceived', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS, 'msd'],
					batchSize: 1,
				}],
			}), requester)

			reporter.recordResponseReceived({
				status: 200,
				request: reporter.createRequestReport({ url: 'https://cdn.example.com/segment.mp4' }),
			}, { msd: 5000 })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok(!(requests[0].body as string).includes('msd'))
		})

		it('strips a per-call msd when the gate is closed on createRequestReport', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' }, { msd: 5000 })

			ok(!req.url.includes('msd'))
		})

		it('sends the canonical msd when a per-call msd rides an open gate', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.update({ msd: 800 })
			reporter.recordEvent(CmcdEventType.ERROR, { msd: 5000 })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('msd=800'))
			ok(!(requests[0].body as string).includes('5000'))
		})

		it('strips a transform-written msd when the gate is closed', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.ERROR],
					enabledKeys: [...EVENT_KEYS],
					batchSize: 1,
					transform: report => ({ ...report, msd: 4444 }),
				}],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok(!(requests[0].body as string).includes('msd'))
		})

		it('ignores update({ sid: undefined }) and keeps reporting under the current sid', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.update({ sid: undefined })
			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			ok((requests[1].body as string).includes('sid="test-session"'))
			// No session reset happened: the sequence number kept counting.
			ok((requests[1].body as string).includes('sn=1'))
		})
	})

	describe('session attribution', () => {
		// The exported CMCD_REQUEST_PROVENANCE is backed by this registry key,
		// which is stable across versions and library copies.
		const PROVENANCE = Symbol.for('@svta/cml-cmcd/request-provenance')

		it('exports the provenance key backed by the stable registry symbol', () => {
			equal(CMCD_REQUEST_PROVENANCE, PROVENANCE)
		})

		it('stamps a frozen provenance record naming the issuing session', () => {
			const reporter = new CmcdReporter({ sid: 's1', cid: 'c1' })

			const first = (reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
				.customData as Record<symbol, unknown>)[PROVENANCE] as CmcdRequestProvenance

			equal(first.sid, 's1')
			equal(first.cid, 'c1')
			// No per-call data was passed, so the base record carries no
			// snapshot.
			equal(first.data, undefined)
			ok(Object.isFrozen(first))

			reporter.update({ sid: 's2' })

			const second = (reporter.createRequestReport({ url: 'https://cdn.example.com/seg2.mp4' })
				.customData as Record<symbol, unknown>)[PROVENANCE] as CmcdRequestProvenance

			notEqual(second, first)
			equal(second.sid, 's2')
		})

		it('shares one frozen base record across requests without per-call data', () => {
			const reporter = new CmcdReporter({ sid: 's1', enabledKeys: ['sid', 'sn', 'v'] })

			const r1 = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
			const r2 = reporter.createRequestReport({ url: 'https://cdn.example.com/seg2.mp4' })
			const p1 = (r1.customData as Record<symbol, unknown>)[PROVENANCE] as CmcdRequestProvenance
			const p2 = (r2.customData as Record<symbol, unknown>)[PROVENANCE] as CmcdRequestProvenance

			// One record per session: decoration stays a single property
			// write when there is nothing per-request to carry.
			equal(p1, p2)
			equal(p1.sid, 's1')
			equal(p1.data, undefined)
		})

		it('carries encoded per-call data on the provenance record', () => {
			const reporter = new CmcdReporter({ sid: 's1', enabledKeys: ['sid', 'sn', 'v'] })

			const r1 = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' }, { ot: 'v', d: 2000 })
			const p1 = (r1.customData as Record<symbol, unknown>)[PROVENANCE] as CmcdRequestProvenance

			ok(Object.isFrozen(p1))
			ok(p1.data?.includes('ot=v'), `expected ot in ${p1.data}`)
			ok(p1.data?.includes('d=2000'), `expected d in ${p1.data}`)
			// The snapshot is the caller's own inputs, never the wire report:
			// reporter-stamped fields stay out of it.
			ok(!p1.data?.includes('sn='), `expected no sn in ${p1.data}`)
			ok(!p1.data?.includes('sid='), `expected no sid in ${p1.data}`)
		})

		const rrTarget = () => ({
			url: 'https://example.com/cmcd',
			events: [CmcdEventType.RESPONSE_RECEIVED],
			enabledKeys: [...RR_KEYS, 'bl', 'msd'] as CmcdKey[],
			batchSize: 1,
		})

		it('attributes a stale response to its originating session', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				cid: 'c1',
				enabledKeys: ['sid', 'cid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			// A current-session response advances s1's sequence first.
			reporter.recordResponseReceived({ status: 200, request: reporter.createRequestReport({ url: 'https://cdn.example.com/seg0.mp4' }) })

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2', cid: 'c2' })
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			const body = requests[1].body as string
			ok(body.includes('sid="s1"'))
			ok(body.includes('cid="c1"'))
			// s1's own sequence continues; it is not relabeled onto s2's.
			ok(body.includes('sn=1'))
		})

		it('draws stale report snapshot keys from the originating session data', async () => {
			// bl is enabled for the event target but not for request mode, so
			// the stored request cmcd cannot supply it; only the frozen
			// session store can.
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			reporter.update({ bl: [25000] })
			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2', bl: [99000] })
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			const body = requests[0].body as string
			ok(body.includes('sid="s1"'))
			ok(body.includes('bl=(25000)'))
			ok(!body.includes('99000'))
		})

		it('lets a stale response carry the originating session unsent msd', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			reporter.update({ msd: 800 })
			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2' })
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
			ok((requests[0].body as string).includes('msd=800'))
		})

		it('drops a response whose request carries no provenance', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['cid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			// A hand-built request was never decorated: with no record there
			// is no attribution key, and a per-call sid cannot substitute.
			reporter.recordResponseReceived({
				status: 200,
				request: { url: 'https://cdn.example.com/seg1.mp4' },
			}, { sid: 's1' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 0)
		})

		it('attributes a transform-cancelled request to its issuing session', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				transform: () => null,
				eventTargets: [rrTarget()],
			}, requester)

			// The transform cancels decoration, so the request stores no cmcd
			// data at all; provenance must survive on its own.
			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
			ok(!stale.url.includes('CMCD'))

			reporter.update({ sid: 's2' })
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
			ok(!(requests[0].body as string).includes('sid="s2"'))
		})

		it('attributes a request decorated while request reporting is disabled', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: [],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2' })
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})

		it('reports the request-time cid on a response after a cid change', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				cid: 'c1',
				enabledKeys: [],
				eventTargets: [rrTarget()],
			}, requester)

			const inFlight = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			// The content changes mid-session: an rr event for an in-flight
			// request keeps the cid the request was issued under, so the
			// response keeps its meaning in later analysis.
			reporter.update({ cid: 'c2' })
			reporter.recordResponseReceived({ status: 200, request: inFlight })

			const fresh = reporter.createRequestReport({ url: 'https://cdn.example.com/seg2.mp4' })
			reporter.recordResponseReceived({ status: 200, request: fresh })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			ok((requests[0].body as string).includes('cid="c1"'), `expected request-time cid in ${requests[0].body}`)
			ok((requests[1].body as string).includes('cid="c2"'), `expected re-minted cid in ${requests[1].body}`)
		})

		it('carries per-call data through disabled request reporting to the response event', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: [],
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS, 'ot', 'd'] as CmcdKey[],
					batchSize: 1,
				}],
			}, requester)

			// Request reporting is disabled, yet the response still reports:
			// the per-call data rides the provenance record.
			const request = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' }, { ot: 'v', d: 2000 })
			reporter.recordResponseReceived({ status: 200, request })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			const body = requests[0].body as string
			ok(body.includes('ot=v'), `expected ot in ${body}`)
			ok(body.includes('d=2000'), `expected d in ${body}`)
		})

		it('carries per-call data through a cancelled transform to the response event', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				transform: () => null,
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS, 'ot', 'd'] as CmcdKey[],
					batchSize: 1,
				}],
			}, requester)

			// The transform cancels decoration, but the snapshot is captured
			// from the caller's inputs before the transform runs.
			const request = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' }, { ot: 'v', d: 2000 })
			ok(!request.url.includes('CMCD'))

			reporter.recordResponseReceived({ status: 200, request })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			const body = requests[0].body as string
			ok(body.includes('sid="s1"'))
			ok(body.includes('ot=v'), `expected ot in ${body}`)
			ok(body.includes('d=2000'), `expected d in ${body}`)
		})

		it('feeds the response event untransformed per-call data', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'ot', 'd', 'v'],
				// The request transform rewrites the wire report; the event
				// pipeline gets the caller's inputs and applies its own
				// transforms instead.
				transform: data => ({ ...data, d: 9999 }),
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS, 'ot', 'd'] as CmcdKey[],
					batchSize: 1,
				}],
			}, requester)

			const request = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' }, { ot: 'v', d: 2000 })
			ok(request.url.includes('d%3D9999'), `expected transformed wire in ${request.url}`)

			reporter.recordResponseReceived({ status: 200, request })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			const body = requests[0].body as string
			ok(body.includes('d=2000'), `expected untransformed d in ${body}`)
			ok(!body.includes('9999'))
		})

		it('attributes a response whose per-call data cannot encode', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: [],
				eventTargets: [rrTarget()],
			}, requester)

			// 10^15 exceeds the RFC 8941 integer maximum, so the snapshot
			// cannot serialize; decoration still returns and the response
			// still attributes, reporting derived keys over session data.
			const request = reporter.createRequestReport(
				{ url: 'https://cdn.example.com/seg1.mp4' },
				{ 'com.example-big': 1_000_000_000_000_000 },
			)
			const provenance = (request.customData as Record<symbol, unknown>)[PROVENANCE] as CmcdRequestProvenance
			equal(provenance.data, undefined)

			reporter.recordResponseReceived({ status: 200, request })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})

		it('restores attribution across a serialization boundary via the provenance record', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['cid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
			const provenance = (stale.customData as Record<symbol, unknown>)[PROVENANCE] as CmcdRequestProvenance
			equal(provenance.sid, 's1')

			reporter.update({ sid: 's2' })

			// JSON drops symbol keys; the carried record restores exact
			// attribution. The record itself rides the JSON payload, so the
			// restored value is a revived plain-object copy: classification
			// is by token value, never object identity.
			const payload = JSON.parse(JSON.stringify({ request: stale, provenance }))
			payload.request.customData[PROVENANCE] = payload.provenance
			reporter.recordResponseReceived({ status: 200, request: payload.request })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})

		it('attributes a hand-built provenance record naming a live sid', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['cid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			// The record is constructible: a request that never passed
			// through createRequestReport() still attributes to the session
			// its sid names.
			const handBuilt: HttpRequest = {
				url: 'https://cdn.example.com/seg1.mp4',
				customData: { cmcd: {}, [PROVENANCE]: { sid: 's1' } },
			}

			reporter.recordResponseReceived({ status: 200, request: handBuilt })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})

		it('drops a provenance record naming no retained session', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['cid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			// A sid this reporter never saw names no session it owns, and a
			// per-call sid cannot substitute.
			const unknown: HttpRequest = {
				url: 'https://cdn.example.com/seg1.mp4',
				customData: { cmcd: {}, [PROVENANCE]: { sid: 'never-issued' } },
			}

			reporter.recordResponseReceived({ status: 200, request: unknown }, { sid: 's1' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 0)
		})

		it('drops a malformed provenance value', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['cid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			// A value that is not shaped like a provenance record has no token
			// to read; it drops rather than throwing or attributing.
			const malformed: HttpRequest = {
				url: 'https://cdn.example.com/seg1.mp4',
				customData: { cmcd: {}, [PROVENANCE]: 'not-a-record' },
			}

			reporter.recordResponseReceived({ status: 200, request: malformed }, { sid: 's1' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 0)
		})

		it('attributes a request decorated by another reporter sharing the sid', async () => {
			const { requester: requesterA } = createMockRequester()
			const issuer = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
			}, requesterA)

			const { requester, requests } = createMockRequester()
			const recorder = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			// sid is the attribution key, so a split topology (one reporter
			// decorates, another records) attributes when both were given
			// the same session.
			const request = issuer.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
			recorder.recordResponseReceived({ status: 200, request })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})

		it('drops another reporter\'s request naming a sid it never saw', async () => {
			const { requester: requesterA } = createMockRequester()
			const issuer = new CmcdReporter({
				sid: 'issuer-only',
				enabledKeys: ['sid', 'v'],
			}, requesterA)

			const { requester, requests } = createMockRequester()
			const recorder = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const request = issuer.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
			recorder.recordResponseReceived({ status: 200, request })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 0)
		})

		it('ignores a per-call sid when the record resolves', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2' })
			reporter.recordResponseReceived({ status: 200, request: stale }, { sid: 's2' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})

		it('drops a stale response once its session is evicted', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			// The default retains 2 ended sessions: s1 survives two changes.
			reporter.update({ sid: 's2' })
			reporter.update({ sid: 's3' })
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))

			// The third change evicts s1.
			reporter.update({ sid: 's4' })
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 1)
		})

		it('drops any stale response with sessionRetention 0', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				sessionRetention: 0,
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2' })
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 0)
		})

		it('retains one ended session with sessionRetention 1', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				sessionRetention: 1,
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2' })
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})

		it('normalizes sessionRetention', () => {
			// Type-checked, never type-coerced: non-numbers fall back to the
			// default instead of converting, and a Symbol must not throw.
			const cases = [
				{ input: 0, expected: 0 },
				{ input: -1, expected: 2 },
				{ input: NaN, expected: 2 },
				{ input: 2.5, expected: 2 },
				{ input: undefined, expected: 2 },
				{ input: 5, expected: 5 },
				{ input: Infinity, expected: Infinity },
				{ input: '1' as unknown as number, expected: 2 },
				{ input: true as unknown as number, expected: 2 },
				{ input: Symbol('retention') as unknown as number, expected: 2 },
			]

			for (const { input, expected } of cases) {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter({ sid: 's1', sessionRetention: input }, requester)
				equal(
					(reporter as unknown as { config: { sessionRetention: number; }; }).config.sessionRetention,
					expected,
					`sessionRetention ${String(input)}`,
				)
			}
		})

		it('sends a partial batch from the ended session before eviction', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				sessionRetention: 0,
				enabledKeys: ['sid', 'v'],
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.ERROR],
					enabledKeys: [...EVENT_KEYS],
					batchSize: 3,
				}],
			}, requester)

			// One queued event cannot fill the batch, and retention 0 evicts
			// s1 synchronously inside update(); the drain must run first.
			reporter.recordEvent(CmcdEventType.ERROR)
			equal(requests.length, 0)

			reporter.update({ sid: 's2' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})

		it('freezes the archived snapshot against caller array mutation', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const bl = [25000]
			reporter.update({ bl })
			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2' })

			// Mutating the caller-held array after the transition must not
			// rewrite the archived session's frozen snapshot.
			bl[0] = 99000
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			const body = requests[0].body as string
			ok(body.includes('sid="s1"'))
			ok(body.includes('bl=(25000)'), `expected frozen bl=(25000) in ${body}`)
			ok(!body.includes('99000'))
		})

		it('never retries a batch invalidated by its session disposal', async () => {
			const requests: HttpRequest[] = []
			const pending: ((response: { status: number; }) => void)[] = []
			const requester = (request: HttpRequest): Promise<{ status: number; }> => {
				requests.push(request)
				return new Promise(resolve => pending.push(resolve))
			}

			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.ERROR)
			equal(requests.length, 2)

			// The sibling batch's 410 disposes the target for this session...
			pending[1]({ status: 410 })
			await new Promise(resolve => setTimeout(resolve, 10))
			// ...then the first batch fails and is re-queued after disposal.
			pending[0]({ status: 429 })
			await new Promise(resolve => setTimeout(resolve, 10))

			// A new session reports normally.
			reporter.update({ sid: 'new-session' })
			reporter.recordEvent(CmcdEventType.ERROR)
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 3)
			ok((requests[2].body as string).includes('sid="new-session"'))

			// The re-queued batch died with its session's disposal.
			reporter.flush()
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 3)
			pending[2]({ status: 200 })
		})

		it('relabels a reused-sid stale response onto the replacement session', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.ERROR, CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS],
					batchSize: 1,
				}],
			}, requester)

			// Two events advance the original s1's sequence so the original
			// and the replacement counters are distinguishable.
			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.ERROR)
			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2' })
			reporter.update({ sid: 's1' })

			// sid uniqueness is the caller's contract: reusing one replaces
			// the retained namesake, so the stale response lands in the
			// replacement session with the replacement's counters.
			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 4)
			ok((requests[2].body as string).includes('sn=0'))
			ok((requests[2].body as string).includes('sid="s1"'))
			ok((requests[3].body as string).includes('sn=1'))
			ok((requests[3].body as string).includes('sid="s1"'))
		})

		it('keeps the start() fan-out on the session that started', async () => {
			const { requester, requests } = createMockRequester()

			const reporter: CmcdReporter = new CmcdReporter({
				sid: 's1',
				eventTargets: [
					{
						url: 'https://example.com/a',
						events: [CmcdEventType.TIME_INTERVAL],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
						interval: 30,
						// A transform may synchronously rotate the session
						// mid-fan-out; later targets must stay on the session
						// that started.
						transform: (data) => {
							reporter.update({ sid: 's2' })
							return data
						},
					},
					{
						url: 'https://example.com/b',
						events: [CmcdEventType.TIME_INTERVAL, CmcdEventType.ERROR],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
						interval: 30,
					},
				],
			}, requester)

			reporter.start()
			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.stop()

			await new Promise(resolve => setTimeout(resolve, 10))

			const b = requests.filter(r => r.url === 'https://example.com/b').map(r => r.body as string)
			equal(b.length, 2)
			// The initial fan-out stays on s1 with s1's counter...
			ok(b[0].includes('sid="s1"'), `expected sid="s1" in ${b[0]}`)
			ok(b[0].includes('sn=0'))
			// ...so the first s2 report is not a duplicate (sid, sn) pair.
			ok(b[1].includes('sid="s2"'))
			ok(b[1].includes('sn=0'))
		})

		it('drops an altered provenance record', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
			const customData = stale.customData as unknown as Record<symbol, unknown>

			// An altered record names a session this reporter never saw, so
			// the response drops instead of attributing anywhere.
			const provenance = customData[PROVENANCE] as CmcdRequestProvenance
			customData[PROVENANCE] = { ...provenance, sid: 'not-the-issued-sid' }

			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 0)
		})

		it('retries a failed batch with the bytes it was queued with', async () => {
			const requests: HttpRequest[] = []
			let status = 429
			const requester = async (request: HttpRequest): Promise<{ status: number; }> => {
				requests.push(request)
				const current = status
				status = 200
				return { status: current }
			}

			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.ERROR],
					enabledKeys: [...EVENT_KEYS, 'bl'] as CmcdKey[],
					batchSize: 1,
				}],
			}, requester)

			const bl = [25000]
			reporter.update({ bl })
			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			// The 429 re-queued the batch; mutating the caller's array must
			// not change what the retry sends.
			bl[0] = 99000
			reporter.flush()

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			ok((requests[0].body as string).includes('bl=(25000)'))
			ok((requests[1].body as string).includes('bl=(25000)'), `expected retry to keep bl=(25000) in ${requests[1].body}`)
		})

		it('throws at record time for a value that cannot serialize, without blocking the queue', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.ERROR],
					enabledKeys: [...EVENT_KEYS, 'com.example-bad'] as CmcdKey[],
					batchSize: 1,
				}],
			}, requester)

			// A plain object is not an RFC 8941 bare item. Reports are encoded
			// at enqueue, so the failure surfaces synchronously in the
			// recording call instead of rejecting the send and re-queueing.
			throws(() => reporter.recordEvent(CmcdEventType.ERROR, { 'ec': ['404'], 'com.example-bad': { junk: true } } as unknown as Partial<Cmcd>))

			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 0)

			// The poisoned report was never queued; the target keeps working.
			reporter.recordEvent(CmcdEventType.ERROR, { ec: ['500'] })

			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 1)
			ok((requests[0].body as string).includes('500'), `expected ec 500 in ${requests[0].body}`)

			reporter.flush()
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 1)
		})

		it('freezes the request-stored cmcd against caller array mutation', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'tab', 'v'],
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS, 'tab'] as CmcdKey[],
					batchSize: 1,
				}],
			}, requester)

			const tab = [3000]
			reporter.update({ tab })
			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			reporter.update({ sid: 's2' })

			// The stored request cmcd overrides the frozen snapshot in the
			// merge, so it must be detached from the caller too.
			tab[0] = 9000
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			const body = requests[0].body as string
			ok(body.includes('tab=(3000)'), `expected frozen tab=(3000) in ${body}`)
			ok(!body.includes('9000'))
		})

		it('encodes a JSON-bridged response report without poisoning the queue', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'tab', 'v'],
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS, 'tab'] as CmcdKey[],
					batchSize: 1,
				}],
			}, requester)

			reporter.update({ tab: [new SfItem(3000)] })
			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
			const provenance = (stale.customData as unknown as Record<symbol, unknown>)[PROVENANCE]

			reporter.update({ sid: 's2' })

			// JSON strips the SfItem prototype from the player-facing cmcd
			// object; the report is rebuilt from the record's snapshot, so it
			// encodes cleanly instead of re-queueing forever.
			const lossy = JSON.parse(JSON.stringify(stale))
			lossy.customData[PROVENANCE] = provenance
			reporter.recordResponseReceived({ status: 200, request: lossy })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('tab=(3000)'), `expected tab=(3000) in ${requests[0].body}`)

			// Nothing poisoned stays queued.
			reporter.flush()
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 1)
		})

		it('revives token values across the JSON bridge via the snapshot', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'ot', 'sf', 'com.example-tok', 'v'],
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS, 'ot', 'sf', 'com.example-tok'] as CmcdKey[],
					batchSize: 1,
				}],
			}, requester)

			// The token values ride only the request report, so the event can
			// draw them from nothing but the record's snapshot.
			const stale = reporter.createRequestReport(
				{ url: 'https://cdn.example.com/seg1.mp4' },
				{ ot: 'v', sf: 'd', 'com.example-tok': new SfToken('abc') },
			)
			const provenance = (stale.customData as unknown as Record<symbol, unknown>)[PROVENANCE]

			reporter.update({ sid: 's2' })

			// JSON reduces SfToken values in the player-facing cmcd object to
			// { description } plain objects; the report is rebuilt from the
			// encoded snapshot instead, so tokens keep their wire type: bare,
			// never quoted. The record is restored as a revived copy.
			const lossy = JSON.parse(JSON.stringify(stale))
			lossy.customData[PROVENANCE] = JSON.parse(JSON.stringify(provenance))
			reporter.recordResponseReceived({ status: 200, request: lossy })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			const body = requests[0].body as string
			ok(body.includes('ot=v'), `expected bare ot token in ${body}`)
			ok(body.includes('sf=d'), `expected bare sf token in ${body}`)
			ok(body.includes('com.example-tok=abc'), `expected bare custom token in ${body}`)
			ok(!body.includes('"abc"'), `expected unquoted token value in ${body}`)

			// Nothing stuck: the queue drains clean.
			reporter.flush()
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 1)
		})

		it('drops an unbridged serialized response', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			// JSON drops the symbol-keyed record, and nothing restores it: the
			// request has no attribution key left, so the response drops. The
			// revived player-facing cmcd object is never read.
			const lossy = JSON.parse(JSON.stringify(stale))
			reporter.recordResponseReceived({ status: 200, request: lossy })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 0)
		})

		it('keeps CmcdRequestReport constructible without the provenance member', () => {
			// Compile-level pin: adding a required member would break
			// consumers that construct or mock the public type.
			const mock: CmcdRequestReport = {
				url: 'https://example.com',
				headers: {},
				customData: { cmcd: {} },
			}

			equal(mock.url, 'https://example.com')
		})

		it('relabels a reused-sid stale response onto the retained replacement', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			const stale = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })

			// Reuse replaces the retained namesake, so after these changes
			// the retained set is s2 and the replacement s1, with s3 current.
			reporter.update({ sid: 's2' })
			reporter.update({ sid: 's1' })
			reporter.update({ sid: 's3' })

			// The stale response resolves the replacement by name: violating
			// the sid-uniqueness contract relabels the namesake's late
			// responses onto the replacement.
			reporter.recordResponseReceived({ status: 200, request: stale })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			const body = requests[0].body as string
			ok(body.includes('sid="s1"'))
			ok(body.includes('sn=0'))
		})

		it('keeps a reused sid at the newest retention position', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 's1',
				sessionRetention: 1,
				enabledKeys: ['sid', 'v'],
				eventTargets: [rrTarget()],
			}, requester)

			reporter.update({ sid: 's2' })
			reporter.update({ sid: 's1' })
			const fromReuse = reporter.createRequestReport({ url: 'https://cdn.example.com/seg1.mp4' })
			reporter.update({ sid: 's3' })

			// Replacement re-inserts the reused sid at the newest position:
			// with one retained slot it is s2 that ages out, never the
			// replacement s1.
			reporter.recordResponseReceived({ status: 200, request: fromReuse })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="s1"'))
		})
	})

	describe('msd gate', () => {
		it('does not consume the gate when msd is not an enabled key in request mode', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'v'],
			}, requester)

			reporter.update({ msd: 800 })
			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

			ok(!req.url.includes('msd'))
			// The gate must stay open: the report never carried msd. Asserted on
			// the private flag because a fixed config has no observable follow-up.
			equal((reporter as unknown as { ledger: { current: { requestTargets: Map<string, { msdSent: boolean; }>; }; }; }).ledger.current.requestTargets.get('default')?.msdSent, false)
		})

		it('does not consume a target gate when msd is not in the target enabledKeys', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd-no-msd',
						events: [CmcdEventType.ERROR],
						enabledKeys: ['sid', 'v', 'e', 'ts', 'sn'],
						batchSize: 1,
					},
					{
						url: 'https://example.com/cmcd-msd',
						events: [CmcdEventType.ERROR],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.update({ msd: 800 })
			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			ok(!(requests[0].body as string).includes('msd'))
			ok((requests[1].body as string).includes('msd=800'))

			const targets = [...(reporter as unknown as { ledger: { current: { eventTargets: Map<unknown, { msdSent: boolean; }>; }; }; }).ledger.current.eventTargets.values()]
			equal(targets[0].msdSent, false)
			equal(targets[1].msdSent, true)
		})

		it('re-arms the msd gate when the session changes', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.update({ msd: 800 })
			reporter.recordEvent(CmcdEventType.ERROR)
			const first = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

			reporter.update({ sid: 'new-session', msd: 950 })
			reporter.recordEvent(CmcdEventType.ERROR)
			const second = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			ok((requests[0].body as string).includes('msd=800'))
			ok(first.url.includes('msd%3D800'))
			ok((requests[1].body as string).includes('msd=950'))
			ok(second.url.includes('msd%3D950'))
		})

		it('clears an unsent msd when the session changes', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.update({ msd: 800 })
			reporter.update({ sid: 'new-session' })

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

			// The stored msd belonged to the previous session and was never
			// sent; it must not leak into the new one.
			ok(!req.url.includes('msd'))
		})
	})

	describe('isRequestEnabled', () => {
		it('returns true when enabledKeys are configured', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['br', 'v'],
			}, requester)

			equal(reporter.isRequestReportingEnabled(), true)
		})

		it('returns false when no enabledKeys are configured', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
			}, requester)

			equal(reporter.isRequestReportingEnabled(), false)
		})

		it('returns false when enabledKeys is empty', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: [],
			}, requester)

			equal(reporter.isRequestReportingEnabled(), false)
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

	describe('report transforms', () => {
		it('provides a valid example', () => {
			// #region example-transform
			const { requester } = createMockRequester()

			const reporter = new CmcdReporter({
				sid: 'session-id',
				cid: 'content-id',
				enabledKeys: ['br', 'sid', 'cid', 'v', 'sn'],
				// Request mode: never decorate license requests with CMCD
				transform: (data, request) => request.url.includes('/license') ? null : data,
				eventTargets: [
					{
						url: 'https://collector.example.com/cmcd',
						events: [CmcdEventType.RESPONSE_RECEIVED],
						enabledKeys: ['url', 'rc', 'sid', 'v', 'e', 'ts', 'sn'],
						batchSize: 1,
						// Event mode, this target only: segment responses only
						transform: (data, request) =>
							request?.customData?.['requestType'] === 'segment' ? data : null,
					},
				],
			}, requester)

			const license = reporter.createRequestReport({ url: 'https://drm.example.com/license' })
			ok(!license.url.includes('CMCD='))

			const segment = reporter.createRequestReport({ url: 'https://cdn.example.com/segment.mp4' })
			ok(segment.url.includes('CMCD='))
			// #endregion example-transform
		})

		describe('request mode', () => {
			it('applies the top-level transform to request reports', () => {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					cid: 'test-content',
					enabledKeys: ['sid', 'cid'],
					transform: data => ({ ...data, cid: 'redacted' }),
				}, requester)

				const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

				ok(req.url.includes('cid%3D%22redacted%22'))
				ok(!req.url.includes('test-content'))
			})

			it('cancels CMCD decoration when the transform returns null', () => {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['sid'],
					transform: (data, request) => request.url.includes('/license') ? null : data,
				}, requester)

				const license = reporter.createRequestReport({ url: 'https://example.com/license' })
				ok(!license.url.includes('CMCD='))
				deepEqual(license.customData.cmcd, {})

				const segment = reporter.createRequestReport({ url: 'https://example.com/segment.mp4' })
				ok(segment.url.includes('CMCD='))
			})

			it('does not consume a sequence number for a cancelled request report', () => {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['sid', 'sn'],
					transform: (data, request) => request.url.includes('/skip') ? null : data,
				}, requester)

				const first = reporter.createRequestReport({ url: 'https://example.com/seg1.mp4' })
				ok(first.url.includes('sn%3D0'))

				reporter.createRequestReport({ url: 'https://example.com/skip' })

				const second = reporter.createRequestReport({ url: 'https://example.com/seg2.mp4' })
				ok(second.url.includes('sn%3D1'))
			})

			it('does not consume msd for a cancelled request report', () => {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['msd'],
					transform: (data, request) => request.url.includes('/skip') ? null : data,
				}, requester)

				reporter.update({ msd: 1000 })

				reporter.createRequestReport({ url: 'https://example.com/skip' })

				const next = reporter.createRequestReport({ url: 'https://example.com/seg.mp4' })
				ok(next.url.includes('msd%3D1000'))
			})

			it('passes the caller request itself as a read-only view', () => {
				const { requester } = createMockRequester()
				const seen: (CmcdTransformRequest | undefined)[] = []
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['sid'],
					transform: (data, request) => {
						seen.push(request)

						// Mutation is a compile error, not a runtime guarantee:
						// `request.url = '…'` and `request.customData!['k'] = 1` are
						// both rejected by CmcdTransformRequest. Reading is the
						// supported use.
						ok(request.url.length > 0)

						return data
					},
				}, requester)

				const input = { url: 'https://example.com/video.mp4', customData: { player: { kind: 'segment' } } }
				const req = reporter.createRequestReport(input)

				equal(seen.length, 1)
				// The caller's own request, not the internal clone the report is
				// built from, so a transform sees exactly what the player passed.
				equal(seen[0], input)
				ok(req.url.startsWith('https://example.com/video.mp4'))
			})

			it('subjects transform-added keys to enabledKeys', () => {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['sid'],
					transform: data => ({ ...data, bl: [3000] }),
				}, requester)

				const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

				ok(req.url.includes('sid%3D%22test-session%22'))
				ok(!req.url.includes('bl'))
			})

			it('does not run the transform when request reporting is disabled', () => {
				const { requester } = createMockRequester()
				let calls = 0
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [],
					transform: (data) => {
						calls++
						return data
					},
				}, requester)

				reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

				equal(calls, 0)
			})

			it('propagates exceptions thrown by the transform', () => {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['sid'],
					transform: () => {
						throw new Error('transform boom')
					},
				}, requester)

				throws(() => reporter.createRequestReport({ url: 'https://example.com/video.mp4' }), /transform boom/)
			})
		})

		describe('event mode', () => {
			it('applies the target transform to event reports', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: data => ({ ...data, cid: 'redacted' }),
						},
					],
				}), requester)

				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				ok((requests[0].body as string)?.includes('cid="redacted"'))
			})

			it('cancels the report when the target transform returns null', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: () => null,
						},
					],
				}), requester)

				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 0)
			})

			it('does not consume a sequence number for a cancelled event report', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR, CmcdEventType.CUSTOM_EVENT],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: data => data.e === CmcdEventType.CUSTOM_EVENT ? null : data,
						},
					],
				}), requester)

				reporter.recordEvent(CmcdEventType.ERROR)
				reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'dropped' })
				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
				ok((requests[0].body as string)?.includes('sn=0'))
				ok((requests[1].body as string)?.includes('sn=1'))
			})

			it('does not consume msd for a cancelled event report', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR, CmcdEventType.CUSTOM_EVENT],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: data => data.e === CmcdEventType.CUSTOM_EVENT ? null : data,
						},
					],
				}), requester)

				reporter.update({ msd: 500 })
				reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'dropped' })
				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('msd=500'))
			})

			it('re-stamps the event type when a transform tampers with it', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: data => ({ ...data, e: CmcdEventType.PLAY_STATE }),
						},
					],
				}), requester)

				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				ok((requests[0].body as string)?.includes('e=e'))
				ok(!(requests[0].body as string)?.includes('e=ps'))
			})

			it('does not run the transform for events the target filters out', async () => {
				const { requester } = createMockRequester()
				let calls = 0
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: (data) => {
								calls++
								return data
							},
						},
					],
				}), requester)

				reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'not-configured' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(calls, 0)
			})

			it('isolates transforms across targets that share a collector URL', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: data => ({ ...data, cid: 'target-a' }),
						},
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: () => null,
						},
					],
				}), requester)

				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('cid="target-a"'))
			})

			it('does not leak in-place mutation from one target into another', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://collector-a.example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: (data) => {
								data.cid = 'mutated-in-place'
								return data
							},
						},
						{
							url: 'https://collector-b.example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
						},
					],
				}), requester)

				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				const a = requests.find(r => r.url.includes('collector-a'))
				const b = requests.find(r => r.url.includes('collector-b'))
				ok((a?.body as string)?.includes('cid="mutated-in-place"'))
				ok((b?.body as string)?.includes('cid="test-content"'))
			})

			it('does not persist transform mutations into reporter data', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							// Appending rather than assigning makes leakage into the
							// persistent data store observable on the second report.
							transform: (data) => {
								data.cid = `${data.cid}!`
								return data
							},
						},
					],
				}), requester)

				reporter.recordEvent(CmcdEventType.ERROR)
				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
				ok((requests[0].body as string)?.includes('cid="test-content!"'))
				ok((requests[1].body as string)?.includes('cid="test-content!"'))
			})

			it('does not roll back state-change dedup when a report is cancelled', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.PLAY_STATE],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: data => data.sta === 'p' ? null : data,
						},
					],
				}), requester)

				// Cancelled on the wire, but the transition still happened.
				reporter.update({ sta: 'p' })
				// Same value again: dedup suppresses it, cancellation did not reset it.
				reporter.update({ sta: 'p' })
				reporter.update({ sta: 'a' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('sta=a'))
				ok((requests[0].body as string)?.includes('sn=0'))
			})

			it('passes undefined as the request for events with no triggering request', async () => {
				const { requester } = createMockRequester()
				const seen: unknown[] = []
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR, CmcdEventType.PLAY_STATE],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: (data, request) => {
								seen.push(request)
								return data
							},
						},
					],
				}), requester)

				reporter.recordEvent(CmcdEventType.ERROR)
				reporter.update({ sta: 'p' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(seen.length, 2)
				deepEqual(seen, [undefined, undefined])
			})

			it('passes undefined as the request for time interval events', () => {
				const { requester } = createMockRequester()
				const seen: unknown[] = []
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.TIME_INTERVAL],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							interval: 30,
							transform: (data, request) => {
								seen.push(request)
								return data
							},
						},
					],
				}), requester)

				// start() fires an initial TIME_INTERVAL event synchronously.
				reporter.start()
				reporter.stop()

				equal(seen.length, 1)
				equal(seen[0], undefined)
			})

			it('propagates exceptions thrown by a target transform', () => {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: () => {
								throw new Error('event transform boom')
							},
						},
					],
				}), requester)

				throws(() => reporter.recordEvent(CmcdEventType.ERROR), /event transform boom/)
			})
		})

		describe('required event keys', () => {
			const ALL_KEYS = ['sta', 'pr', 'cid', 'bg', 'br', 'cen', 'ec', 'url', 'rc', 'sid', 'v', 'e', 'ts', 'sn'] as const

			function createTarget(events: CmcdEventType[], transform: CmcdEventReportTransform): Partial<CmcdReporterConfig> {
				return {
					sid: 'test-session',
					enabledKeys: [...ALL_KEYS],
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events,
							enabledKeys: [...ALL_KEYS],
							batchSize: 1,
							transform,
						},
					],
				}
			}

			// Strips every key the transform is allowed to touch, so each case
			// proves the reporter put the required one back.
			const stripAll: CmcdEventReportTransform = data => ({
				...data,
				ts: undefined,
				sta: undefined,
				pr: undefined,
				cid: undefined,
				bg: undefined,
				br: undefined,
				cen: undefined,
				ec: undefined,
				url: undefined,
			})

			it('restores ts when a transform removes it', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createTarget([CmcdEventType.ERROR], stripAll), requester)

				reporter.recordEvent(CmcdEventType.ERROR, { ec: ['E100'] })

				await new Promise(resolve => setTimeout(resolve, 10))

				ok((requests[0].body as string)?.includes('ts='))
			})

			const stateFamilies = [
				{ event: CmcdEventType.PLAY_STATE, key: 'sta', update: { sta: 'p' as const }, wire: 'sta=p' },
				{ event: CmcdEventType.PLAYBACK_RATE, key: 'pr', update: { pr: 2 }, wire: 'pr=2' },
				{ event: CmcdEventType.CONTENT_ID, key: 'cid', update: { cid: 'movie-7' }, wire: 'cid="movie-7"' },
				{ event: CmcdEventType.BACKGROUNDED_MODE, key: 'bg', update: { bg: true }, wire: 'bg' },
				{ event: CmcdEventType.BITRATE_CHANGE, key: 'br', update: { br: [5000] }, wire: 'br=(5000)' },
			]

			for (const family of stateFamilies) {
				it(`restores the signalled field for ${family.event} events`, async () => {
					const { requester, requests } = createMockRequester()
					const reporter = new CmcdReporter(createTarget([family.event], stripAll), requester)

					reporter.update(family.update)

					await new Promise(resolve => setTimeout(resolve, 10))

					equal(requests.length, 1)
					ok((requests[0].body as string)?.includes(family.wire))
					deepEqual(validateCmcdEventReport(requests[0]).issues.filter(i => i.severity === 'error'), [])
				})
			}

			it('restores cen for custom events', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createTarget([CmcdEventType.CUSTOM_EVENT], stripAll), requester)

				reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'my-event' })

				await new Promise(resolve => setTimeout(resolve, 10))

				ok((requests[0].body as string)?.includes('cen="my-event"'))
				deepEqual(validateCmcdEventReport(requests[0]).issues.filter(i => i.severity === 'error'), [])
			})

			it('restores ec for error events', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createTarget([CmcdEventType.ERROR], stripAll), requester)

				reporter.recordEvent(CmcdEventType.ERROR, { ec: ['E100'] })

				await new Promise(resolve => setTimeout(resolve, 10))

				ok((requests[0].body as string)?.includes('ec=("E100")'))
				deepEqual(validateCmcdEventReport(requests[0]).issues.filter(i => i.severity === 'error'), [])
			})

			it('restores url for response received events', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createTarget([CmcdEventType.RESPONSE_RECEIVED], stripAll), requester)

				reporter.recordResponseReceived({ request: reporter.createRequestReport({ url: 'https://cdn.example.com/seg.mp4' }), status: 200 })

				await new Promise(resolve => setTimeout(resolve, 10))

				ok((requests[0].body as string)?.includes('url="https://cdn.example.com/seg.mp4"'))
				deepEqual(validateCmcdEventReport(requests[0]).issues.filter(i => i.severity === 'error'), [])
			})

			it('restores a required key replaced with an empty string', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createTarget(
					[CmcdEventType.RESPONSE_RECEIVED],
					data => ({ ...data, url: '' }),
				), requester)

				reporter.recordResponseReceived({ request: reporter.createRequestReport({ url: 'https://cdn.example.com/seg.mp4' }), status: 200 })

				await new Promise(resolve => setTimeout(resolve, 10))

				// An empty string is type-valid but dropped during preparation, so
				// it leaves the report as invalid as removing the key outright.
				ok((requests[0].body as string)?.includes('url="https://cdn.example.com/seg.mp4"'))
				deepEqual(validateCmcdEventReport(requests[0]).issues.filter(i => i.severity === 'error'), [])
			})

			it('restores a required key replaced with an empty list', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createTarget(
					[CmcdEventType.ERROR],
					data => ({ ...data, ec: [] }),
				), requester)

				reporter.recordEvent(CmcdEventType.ERROR, { ec: ['E100'] })

				await new Promise(resolve => setTimeout(resolve, 10))

				ok((requests[0].body as string)?.includes('ec=("E100")'))
				deepEqual(validateCmcdEventReport(requests[0]).issues.filter(i => i.severity === 'error'), [])
			})

			it('restores ts replaced with a non-finite number', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createTarget(
					[CmcdEventType.ERROR],
					data => ({ ...data, ts: NaN }),
				), requester)

				reporter.recordEvent(CmcdEventType.ERROR, { ec: ['E100'] })

				await new Promise(resolve => setTimeout(resolve, 10))

				ok((requests[0].body as string)?.includes('ts='))
				deepEqual(validateCmcdEventReport(requests[0]).issues.filter(i => i.severity === 'error'), [])
			})

			it('does not revert a transform that legitimately clears bg', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createTarget(
					[CmcdEventType.BACKGROUNDED_MODE],
					data => ({ ...data, bg: false }),
				), requester)

				// `bg: false` is a real value for this event, emitted as `?0`. The
				// restore predicate must not treat falsiness as unusable, or it
				// would silently put the previous `true` back.
				reporter.update({ bg: true })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('bg=?0'))
				deepEqual(validateCmcdEventReport(requests[0]).issues.filter(i => i.severity === 'error'), [])
			})

			it('does not fabricate a required key that was already absent', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createTarget([CmcdEventType.CUSTOM_EVENT], data => data), requester)

				// cen was never supplied, so the report was non-conformant before
				// any transform ran. Restoration must not invent a value.
				reporter.recordEvent(CmcdEventType.CUSTOM_EVENT)

				await new Promise(resolve => setTimeout(resolve, 10))

				ok(!(requests[0].body as string)?.includes('cen='))
			})
		})

		describe('nested value isolation', () => {
			const NESTED_KEYS = ['ec', 'br', 'sid', 'cid', 'v', 'e', 'ts', 'sn'] as const

			it('contains nested array mutation within the mutating target', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [...NESTED_KEYS],
					eventTargets: [
						{
							url: 'https://collector-a.example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...NESTED_KEYS],
							batchSize: 1,
							transform: (data) => {
								data.ec?.push('LEAKED')
								return data
							},
						},
						{
							url: 'https://collector-b.example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...NESTED_KEYS],
							batchSize: 1,
						},
					],
				}, requester)

				reporter.update({ ec: ['E100'] })
				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				const a = requests.find(r => r.url.includes('collector-a'))?.body as string
				const b = requests.find(r => r.url.includes('collector-b'))?.body as string

				ok(a?.includes('LEAKED'))
				ok(!b?.includes('LEAKED'))
			})

			it('does not corrupt the persistent store through a nested array', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [...NESTED_KEYS],
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...NESTED_KEYS],
							batchSize: 1,
							transform: (data) => {
								data.ec?.push('LEAKED')
								return data
							},
						},
					],
				}, requester)

				reporter.update({ ec: ['E100'] })
				reporter.recordEvent(CmcdEventType.ERROR)
				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
				// Each report carries exactly one appended value, not a growing array.
				ok((requests[1].body as string)?.includes('ec=("E100" "LEAKED")'))
			})

			it('copies SfItem params so nested mutation cannot escape', async () => {
				const { requester } = createMockRequester()
				const seen: string[] = []
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [...NESTED_KEYS],
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...NESTED_KEYS],
							batchSize: 1,
							transform: (data) => {
								const first = data.br?.[0]
								if (first instanceof SfItem && first.params) {
									seen.push(JSON.stringify(first.params))
									Object.assign(first.params, { v: false })
								}
								return data
							},
						},
					],
				}, requester)

				reporter.update({ br: [new SfItem(5000, { v: true })] })
				reporter.recordEvent(CmcdEventType.ERROR)
				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				// The second event must see the original params, not the mutation
				// the first event's transform made.
				deepEqual(seen, ['{"v":true}', '{"v":true}'])
			})

			it('keeps the SfItem prototype through the copy', async () => {
				const { requester } = createMockRequester()
				const kinds: boolean[] = []
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [...NESTED_KEYS],
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...NESTED_KEYS],
							batchSize: 1,
							transform: (data) => {
								kinds.push(data.br?.[0] instanceof SfItem)
								return data
							},
						},
					],
				}, requester)

				reporter.update({ br: [new SfItem(5000, { v: true })] })
				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				deepEqual(kinds, [true])
			})
		})

		describe('per-target error isolation', () => {
			const ISO_KEYS = ['sta', 'sid', 'cid', 'v', 'e', 'ts', 'sn'] as const

			const THROWING_URL = 'https://throwing.example.com/cmcd'
			const HEALTHY_URL = 'https://healthy.example.com/cmcd'

			function createIsolationReporter(requester: (request: HttpRequest) => Promise<{ status: number; }>) {
				return new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [...ISO_KEYS],
					eventTargets: [
						{
							url: THROWING_URL,
							events: [CmcdEventType.PLAY_STATE],
							enabledKeys: [...ISO_KEYS],
							batchSize: 1,
							transform: () => {
								throw new Error('target boom')
							},
						},
						{
							url: HEALTHY_URL,
							events: [CmcdEventType.PLAY_STATE],
							enabledKeys: [...ISO_KEYS],
							batchSize: 1,
						},
					],
				}, requester)
			}

			it('delivers to healthy targets even when an earlier target throws', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = createIsolationReporter(requester)

				throws(() => reporter.update({ sta: 'p' }), /target boom/)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				equal(requests[0].url, HEALTHY_URL)
				ok((requests[0].body as string)?.includes('sta=p'))
			})

			it('arms later interval targets when an earlier start() transform throws', async () => {
				const { requester, requests } = createMockRequester()
				const INTERVAL_KEYS = ['sid', 'v', 'e', 'ts', 'sn'] as const
				let healthyCalls = 0

				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [...INTERVAL_KEYS],
					eventTargets: [
						{
							url: THROWING_URL,
							events: [CmcdEventType.TIME_INTERVAL],
							enabledKeys: [...INTERVAL_KEYS],
							batchSize: 1,
							interval: 30,
							transform: () => {
								throw new Error('target boom')
							},
						},
						{
							url: HEALTHY_URL,
							events: [CmcdEventType.TIME_INTERVAL],
							enabledKeys: [...INTERVAL_KEYS],
							batchSize: 1,
							interval: 30,
							transform: (data) => {
								healthyCalls++
								return data
							},
						},
					],
				}, requester)

				// start() fires the initial time-interval event synchronously per
				// target. Aborting the loop would leave the healthy target with no
				// armed interval, so it would report nothing for the whole session.
				throws(() => reporter.start(), /target boom/)
				reporter.stop()

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(healthyCalls, 1)
				equal(requests.length, 1)
				equal(requests[0].url, HEALTHY_URL)
			})

			it('keeps delivering later transitions after a throw', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = createIsolationReporter(requester)

				throws(() => reporter.update({ sta: 'p' }), /target boom/)
				await new Promise(resolve => setTimeout(resolve, 10))

				throws(() => reporter.update({ sta: 'a' }), /target boom/)
				await new Promise(resolve => setTimeout(resolve, 10))

				const healthy = requests.filter(r => r.url === HEALTHY_URL)
				equal(healthy.length, 2)
				// The throwing target consumed no sequence number of its own, and
				// the healthy target's numbering is unbroken.
				ok((healthy[0].body as string)?.includes('sn=0'))
				ok((healthy[1].body as string)?.includes('sn=1'))
			})
		})

		describe('triggering request', () => {
			it('passes the triggering request to the transform for response-received events', async () => {
				const { requester, requests } = createMockRequester()
				const seen: (HttpRequest | undefined)[] = []

				const reporter = new CmcdReporter({
					sid: 'test-session',
					cid: 'test-content',
					enabledKeys: [...RR_KEYS],
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.RESPONSE_RECEIVED],
							enabledKeys: [...RR_KEYS],
							batchSize: 1,
							transform: (data, request) => {
								seen.push(request)
								return data
							},
						},
					],
				}, requester)

				const triggering = reporter.createRequestReport({
					url: 'https://cdn.example.com/segment.mp4',
					customData: { requestType: 'segment' },
				})

				reporter.recordResponseReceived({ request: triggering, status: 200 })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				equal(seen.length, 1)
				equal(seen[0], triggering)
			})

			it('filters response-received reports by player request type', async () => {
				const { requester, requests } = createMockRequester()
				const segmentsOnly: CmcdEventReportTransform = (data, request) => {
					if (data.e !== CmcdEventType.RESPONSE_RECEIVED) {
						return data
					}

					return request?.customData?.['requestType'] === 'segment' ? data : null
				}

				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [...RR_KEYS],
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.RESPONSE_RECEIVED],
							enabledKeys: [...RR_KEYS],
							batchSize: 1,
							transform: segmentsOnly,
						},
					],
				}, requester)

				const manifestRequest = reporter.createRequestReport({
					url: 'https://cdn.example.com/manifest.mpd',
					customData: { requestType: 'mpd' },
				})

				const segmentRequest = reporter.createRequestReport({
					url: 'https://cdn.example.com/segment.mp4',
					customData: { requestType: 'segment' },
				})

				reporter.recordResponseReceived({ request: manifestRequest, status: 200 })
				reporter.recordResponseReceived({ request: segmentRequest, status: 200 })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('segment.mp4'))
				ok((requests[0].body as string)?.includes('sn=0'))
			})

			it('accepts a request whose customData has only player-specific keys', async () => {
				const { requester, requests } = createMockRequester()
				const seen: string[] = []

				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [...RR_KEYS],
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.RESPONSE_RECEIVED],
							enabledKeys: [...RR_KEYS],
							batchSize: 1,
							transform: (data, request) => {
								const customData = request?.customData as { requestType?: string; } | undefined
								if (customData?.requestType) {
									seen.push(customData.requestType)
								}
								return data
							},
						},
					],
				}, requester)

				// A bare object literal with no `cmcd` key and no helper type
				// alias: this is the shape a player hands to
				// createRequestReport, and it must compile without a cast.
				// `customData` is inferred, not pinned.
				reporter.recordResponseReceived({
					request: reporter.createRequestReport({
						url: 'https://cdn.example.com/segment.mp4',
						customData: { requestType: 'segment' },
					}),
					status: 200,
				})

				await new Promise(resolve => setTimeout(resolve, 10))

				deepEqual(seen, ['segment'])
				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('segment.mp4'))
			})
		})

		describe('typed customData', () => {
			type PlayerData = { requestType: string; };

			it('types customData across the config from a single annotated transform', async () => {
				const { requester, requests } = createMockRequester()

				// The only annotation in the config. It fixes the reporter's
				// customData type, which the un-annotated top-level transform
				// below picks up by inference.
				const segmentsOnly: CmcdEventReportTransform<PlayerData> = (data, request) =>
					request?.customData?.requestType === 'segment' ? data : null

				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: [...RR_KEYS],
					transform: (data, request) =>
						request.customData?.requestType === 'license' ? null : data,
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.RESPONSE_RECEIVED],
							enabledKeys: [...RR_KEYS],
							batchSize: 1,
							transform: segmentsOnly,
						},
					],
				}, requester)

				const license = reporter.createRequestReport({
					url: 'https://drm.example.com/license',
					customData: { requestType: 'license' },
				})
				ok(!license.url.includes('CMCD='))

				const segment = reporter.createRequestReport({
					url: 'https://cdn.example.com/segment.mp4',
					customData: { requestType: 'segment' },
				})
				ok(segment.url.includes('CMCD='))

				reporter.recordResponseReceived({
					request: reporter.createRequestReport({ url: 'https://cdn.example.com/manifest.mpd', customData: { requestType: 'mpd' } }),
					status: 200,
				})
				reporter.recordResponseReceived({ request: segment, status: 200 })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('segment.mp4'))
			})

			it('types customData from an explicit type argument on the reporter', () => {
				const { requester } = createMockRequester()

				const reporter = new CmcdReporter<PlayerData>({
					sid: 'test-session',
					enabledKeys: ['sid'],
					transform: (data, request) =>
						request.customData?.requestType === 'license' ? null : data,
				}, requester)

				const license = reporter.createRequestReport({
					url: 'https://drm.example.com/license',
					customData: { requestType: 'license' },
				})
				ok(!license.url.includes('CMCD='))

				const segment = reporter.createRequestReport({
					url: 'https://cdn.example.com/segment.mp4',
					customData: { requestType: 'segment' },
				})
				ok(segment.url.includes('CMCD='))
			})

			it('rejects a request whose customData does not match the reporter', () => {
				const { requester } = createMockRequester()

				const reporter = new CmcdReporter<PlayerData>({
					sid: 'test-session',
					enabledKeys: ['sid'],
					transform: (data, request) =>
						request.customData?.requestType === 'segment' ? data : null,
				}, requester)

				// @ts-expect-error - `requestTypo` does not satisfy PlayerData
				reporter.createRequestReport({ url: 'https://x/a', customData: { requestTypo: 'segment' } })

				reporter.recordResponseReceived({
					// @ts-expect-error - `requestTypo` does not satisfy PlayerData
					request: { url: 'https://x/b', customData: { requestTypo: 'segment' } },
					status: 200,
				})
			})

			it('keeps nested customData readonly', () => {
				type NestedPlayerData = { timing: { start: number; }; };

				const readNested: CmcdEventReportTransform<NestedPlayerData> = (data, request) => {
					const customData = request?.customData

					if (customData) {
						// Reading at depth is the supported use.
						ok(customData.timing.start >= 0)

						// @ts-expect-error - nested writes are rejected, as at the top level
						customData.timing.start = 1
					}

					return data
				}

				ok(typeof readNested === 'function')
			})

			it('leaves customData opaque when no type is given', () => {
				const { requester } = createMockRequester()

				// The un-parameterized spelling stays valid, so `customData`
				// values remain `unknown` and reads go through bracket access.
				const segmentsOnly: CmcdRequestReportTransform = (data, request) =>
					request.customData?.['requestType'] === 'segment' ? data : null

				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['sid'],
					transform: segmentsOnly,
				}, requester)

				const manifest = reporter.createRequestReport({
					url: 'https://cdn.example.com/manifest.mpd',
					customData: { requestType: 'mpd' },
				})
				ok(!manifest.url.includes('CMCD='))

				const segment = reporter.createRequestReport({
					url: 'https://cdn.example.com/segment.mp4',
					customData: { requestType: 'segment' },
				})
				ok(segment.url.includes('CMCD='))
			})
		})

		describe('placement isolation', () => {
			it('does not run the top-level transform for event reports', async () => {
				const { requester, requests } = createMockRequester()
				let calls = 0
				const reporter = new CmcdReporter(createConfig({
					transform: (data) => {
						calls++
						return data
					},
				}), requester)

				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				equal(calls, 0)
			})

			it('does not run a target transform for request reports', () => {
				const { requester } = createMockRequester()
				let calls = 0
				const reporter = new CmcdReporter(createConfig({
					eventTargets: [
						{
							url: 'https://example.com/cmcd',
							events: [CmcdEventType.ERROR],
							enabledKeys: [...EVENT_KEYS],
							batchSize: 1,
							transform: (data) => {
								calls++
								return data
							},
						},
					],
				}), requester)

				const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

				ok(req.url.includes('CMCD='))
				equal(calls, 0)
			})
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
			equal(requests[0].headers?.['Content-Type'], 'application/cmcd')
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

			reporter.update({ sta: 'p' })
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
			ok((requests[0].body as string)?.includes('cen="my-custom-event"'))
		})

		it('includes msd only once in event reports', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.update({ msd: 500, sta: 'p' })
			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.PLAY_STATE)

			await new Promise(resolve => setTimeout(resolve, 10))

			ok((requests[0].body as string)?.includes('msd=500'))
			ok(!(requests[1].body as string)?.includes('msd'))
		})
	})

	describe('custom events', () => {
		it('force-includes cen even when it is not in the target enabledKeys', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.CUSTOM_EVENT],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn'],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'my-custom-event' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('cen="my-custom-event"'))
		})

		it('emits a custom key payload when the key is in the target enabledKeys', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.CUSTOM_EVENT],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'cen', 'com.example-detail'],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'ad-quartile', 'com.example-detail': 'q3' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('cen="ad-quartile"'))
			ok((requests[0].body as string)?.includes('com.example-detail="q3"'))
		})

		it('drops a custom key payload not in the target enabledKeys while cen survives', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.CUSTOM_EVENT],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'cen'],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'ad-quartile', 'com.example-detail': 'q3' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('cen="ad-quartile"'))
			ok(!(requests[0].body as string)?.includes('com.example-detail'))
		})

		it('batches custom events according to batchSize', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.CUSTOM_EVENT],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 2,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'first' })

			await new Promise(resolve => setTimeout(resolve, 10))

			// Batch size is 2, so the first event is queued, not sent
			equal(requests.length, 0)

			reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'second' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)

			const lines = (requests[0].body as string).trim().split('\n')
			equal(lines.length, 2)
			ok(lines[0].includes('e=ce'))
			ok(lines[0].includes('cen="first"'))
			ok(lines[1].includes('e=ce'))
			ok(lines[1].includes('cen="second"'))
		})
	})

	describe('custom keys', () => {
		it('emits an enabled custom key as a query parameter', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'com.example-foo'],
			}, requester)

			reporter.update({ 'com.example-foo': 'bar' })

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.url.includes('com.example-foo%3D%22bar%22'))
		})

		it('emits an enabled custom key in the CMCD-Request header', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'com.example-foo'],
				transmissionMode: CmcdTransmissionMode.HEADERS,
			}, requester)

			reporter.update({ 'com.example-foo': 'bar' })

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.headers?.['CMCD-Request']?.includes('com.example-foo="bar"'))
		})

		it('routes custom keys to the configured header shard via customHeaderMap', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'com.example-foo', 'com.example-bar'],
				transmissionMode: CmcdTransmissionMode.HEADERS,
				customHeaderMap: {
					'CMCD-Session': ['com.example-foo'],
					'CMCD-Status': ['com.example-bar'],
				},
			}, requester)

			reporter.update({ 'com.example-foo': 'bar', 'com.example-bar': 'baz' })

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.headers?.['CMCD-Session']?.includes('com.example-foo="bar"'))
			ok(req.headers?.['CMCD-Status']?.includes('com.example-bar="baz"'))
			ok(!req.headers?.['CMCD-Request'])
		})

		it('emits unmapped custom keys in CMCD-Request when customHeaderMap is set', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'com.example-foo', 'com.example-bar'],
				transmissionMode: CmcdTransmissionMode.HEADERS,
				customHeaderMap: {
					'CMCD-Session': ['com.example-foo'],
				},
			}, requester)

			reporter.update({ 'com.example-foo': 'bar', 'com.example-bar': 'baz' })

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.headers?.['CMCD-Session']?.includes('com.example-foo="bar"'))
			ok(req.headers?.['CMCD-Request']?.includes('com.example-bar="baz"'))
		})

		it('does not re-route standard keys via customHeaderMap', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'br'],
				transmissionMode: CmcdTransmissionMode.HEADERS,
				customHeaderMap: {
					'CMCD-Status': ['sid', 'br'],
				},
			}, requester)

			reporter.update({ br: [5000] })

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			// Standard keys keep their spec-defined shards
			ok(req.headers?.['CMCD-Session']?.includes('sid='))
			ok(req.headers?.['CMCD-Object']?.includes('br='))
			ok(!req.headers?.['CMCD-Status'])
		})

		it('ignores customHeaderMap in query transmission mode', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'com.example-foo'],
				customHeaderMap: {
					'CMCD-Session': ['com.example-foo'],
				},
			}, requester)

			reporter.update({ 'com.example-foo': 'bar' })

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.url.includes('com.example-foo%3D%22bar%22'))
			equal(Object.keys(req.headers ?? {}).length, 0)
		})

		it('drops a custom key not listed in enabledKeys from request reports', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid'],
			}, requester)

			reporter.update({ 'com.example-foo': 'bar' })

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(!req.url.includes('com.example-foo'))
		})

		it('drops a custom key not listed in the target enabledKeys from event reports', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { 'com.example-foo': 'bar' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('e=e'))
			ok(!(requests[0].body as string)?.includes('com.example-foo'))
		})

		it('includes a persistent custom key in event reports when in the target enabledKeys', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'com.example-foo'],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.update({ 'com.example-foo': 'bar' })
			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('com.example-foo="bar"'))
		})

		it('includes a persistent custom key in time interval reports', () => {
			const timers = mock.timers
			timers.enable({ apis: ['setInterval'] })

			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.TIME_INTERVAL],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'com.example-foo'],
						interval: 30,
						batchSize: 1,
					},
				],
			}), requester)

			reporter.update({ 'com.example-foo': 'bar' })
			reporter.start()

			// The first time interval event is sent immediately
			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('com.example-foo="bar"'))

			reporter.stop()
			timers.reset()
		})

		it('does not persist a custom key passed as per-event data', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'com.example-foo'],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { 'com.example-foo': 'bar' })
			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			ok((requests[0].body as string)?.includes('com.example-foo="bar"'))
			ok(!(requests[1].body as string)?.includes('com.example-foo'))
		})

		it('carries a custom key from the request report into the response received event', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'com.example-foo'],
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.RESPONSE_RECEIVED],
						enabledKeys: ['sid', 'v', 'e', 'ts', 'sn', 'url', 'rc', 'com.example-foo'],
						batchSize: 1,
					},
				],
			}, requester)

			reporter.update({ 'com.example-foo': 'bar' })

			const request = reporter.createRequestReport({ url: 'https://cdn.example.com/segment.mp4' })

			reporter.recordResponseReceived({ request, status: 200 })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('e=rr'))
			ok((requests[0].body as string)?.includes('com.example-foo="bar"'))
		})

		it('emits a custom key passed directly to recordResponseReceived', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.RESPONSE_RECEIVED],
						enabledKeys: ['sid', 'v', 'e', 'ts', 'sn', 'url', 'rc', 'com.example-rr'],
						batchSize: 1,
					},
				],
			}, requester)

			reporter.recordResponseReceived({
				request: reporter.createRequestReport({ url: 'https://cdn.example.com/segment.mp4' }),
				status: 200,
			}, { 'com.example-rr': 'baz' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('com.example-rr="baz"'))
		})

		it('emits an SfToken custom value as a bare token', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'com.example-tok'],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { 'com.example-tok': new SfToken('t0k') })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('com.example-tok=t0k'))
		})

		it('emits a true custom value as a bare valueless key', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'com.example-flag'],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { 'com.example-flag': true })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('com.example-flag'))
			ok(!(requests[0].body as string)?.includes('com.example-flag='))
		})

		it('drops a false custom value', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'com.example-flag'],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { 'com.example-flag': false })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok(!(requests[0].body as string)?.includes('com.example-flag'))
		})
	})

	describe('unserializable key handling', () => {
		it('drops custom keys that fail RFC 8941 key serialization from request reports', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: ['sid', 'Com.Example-foo' as CmcdKey, '2com.example-x', '-a-b'],
			}, requester)

			reporter.update({ 'Com.Example-foo': 'a', '2com.example-x': 'b', '-a-b': 'c' } as Partial<Cmcd>)

			const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })
			ok(req.url.includes('sid%3D'))
			ok(!req.url.includes('Com.Example-foo'))
			ok(!req.url.includes('2com.example-x'))
			ok(!req.url.includes('-a-b'))
		})

		it('drops an unserializable custom key from event reports', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR],
						enabledKeys: ['sid', 'cid', 'v', 'e', 'ts', 'sn', 'Com.Example-foo' as CmcdKey],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR, { 'Com.Example-foo': 'bar' } as Partial<Cmcd>)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string)?.includes('e=e'))
			ok(!(requests[0].body as string)?.includes('Com.Example-foo'))
		})
	})

	describe('event transport failures', () => {
		it('re-queues events on transport failure and delivers them on retry', async () => {
			const requests: HttpRequest[] = []
			let calls = 0
			const requester = async (request: HttpRequest): Promise<{ status: number; }> => {
				requests.push(request)
				return { status: calls++ === 0 ? 500 : 200 }
			}

			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			// First attempt failed with 500 and the event was re-queued
			equal(requests.length, 1)

			reporter.flush()

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			ok((requests[1].body as string)?.includes('e=e'))
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

		function createResponse(reporter: CmcdReporter, overrides: Partial<HttpResponse> = {}): HttpResponse {
			return {
				request: reporter.createRequestReport({ url: 'https://cdn.example.com/segment.mp4' }),
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

			// Only requests decorated by createRequestReport() can be
			// attributed: the returned request carries the provenance record
			// the response is resolved by.
			const request = reporter.createRequestReport({ url: 'https://cdn.example.com/segment.mp4' })

			reporter.recordResponseReceived({
				request,
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

			reporter.recordResponseReceived(createResponse(reporter))

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

			reporter.recordResponseReceived(createResponse(reporter, {
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

			reporter.recordResponseReceived(createResponse(reporter, {
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

			reporter.recordResponseReceived(createResponse(reporter), {
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

			reporter.recordResponseReceived(createResponse(reporter))

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

			reporter.update({ sta: 'p' })
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

			reporter.update({ sta: 'p' })
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

		it('sends time interval events only to the target that owns the timer', () => {
			const timers = mock.timers
			timers.enable({ apis: ['setInterval'] })

			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd-ti-1',
						events: [CmcdEventType.TIME_INTERVAL],
						enabledKeys: [...EVENT_KEYS],
						interval: 30,
						batchSize: 1,
					},
					{
						url: 'https://example.com/cmcd-ti-2',
						events: [CmcdEventType.TIME_INTERVAL],
						enabledKeys: [...EVENT_KEYS],
						interval: 30,
						batchSize: 1,
					},
				],
			}), requester)

			reporter.start()

			// Each target should fire exactly once on start (not duplicated)
			equal(requests.length, 2)
			equal(requests[0].url, 'https://example.com/cmcd-ti-1')
			equal(requests[1].url, 'https://example.com/cmcd-ti-2')

			// After one interval tick, each target fires once more
			timers.tick(30_000)
			equal(requests.length, 4)
			equal(requests[2].url, 'https://example.com/cmcd-ti-1')
			equal(requests[3].url, 'https://example.com/cmcd-ti-2')

			// Verify sequence numbers: each target should have its own independent counter
			ok((requests[0].body as string)?.includes('sn=0'))
			ok((requests[1].body as string)?.includes('sn=0'))
			ok((requests[2].body as string)?.includes('sn=1'))
			ok((requests[3].body as string)?.includes('sn=1'))

			reporter.stop()
			timers.reset()
		})

		it('does not send time interval events to targets without TIME_INTERVAL configured', () => {
			const timers = mock.timers
			timers.enable({ apis: ['setInterval'] })

			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd-ti',
						events: [CmcdEventType.TIME_INTERVAL],
						enabledKeys: [...EVENT_KEYS],
						interval: 30,
						batchSize: 1,
					},
					{
						url: 'https://example.com/cmcd-other',
						events: [CmcdEventType.ERROR],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.start()

			// Only the TIME_INTERVAL target should receive events
			equal(requests.length, 1)
			equal(requests[0].url, 'https://example.com/cmcd-ti')

			timers.tick(30_000)
			equal(requests.length, 2)
			equal(requests[1].url, 'https://example.com/cmcd-ti')

			// The other target should still be functional for its own events
			reporter.recordEvent(CmcdEventType.ERROR)
			equal(requests.length, 3)
			equal(requests[2].url, 'https://example.com/cmcd-other')

			reporter.stop()
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

		it('flushes pending events when stop(true) is called', async () => {
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

			reporter.update({ sta: 'p' })
			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.PLAY_STATE)

			await new Promise(resolve => setTimeout(resolve, 10))

			// Batch size is 10, so nothing should have been sent yet
			equal(requests.length, 0)

			reporter.stop(true)

			await new Promise(resolve => setTimeout(resolve, 10))

			// stop(true) should flush all pending events
			equal(requests.length, 1)
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

		it('re-sends a re-queued batch after later batches have already been delivered', async () => {
			const requests: HttpRequest[] = []
			const pending: ((response: { status: number; }) => void)[] = []
			const requester = (request: HttpRequest): Promise<{ status: number; }> => {
				requests.push(request)
				return new Promise(resolve => pending.push(resolve))
			}

			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.ERROR)
			equal(requests.length, 2)

			// The second batch is delivered while the first is still in flight,
			// then the first fails with 429 and goes back on the queue.
			pending[1]({ status: 200 })
			pending[0]({ status: 429 })
			await new Promise(resolve => setTimeout(resolve, 10))

			// Nothing is re-sent until the next queue processing pass.
			equal(requests.length, 2)

			reporter.flush()
			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 3)
			ok((requests[0].body as string).includes('sn=0'))
			ok((requests[1].body as string).includes('sn=1'))
			// The re-queued batch goes out as-is: sn=0 after sn=1 was already
			// delivered. Delivery order is not guaranteed; sn orders the stream.
			ok((requests[2].body as string).includes('sn=0'))
			pending[2]({ status: 200 })
		})

		it('restores a 410-disposed target when the session changes', async () => {
			const { requester, requests } = createMockRequester(410)
			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 1)

			// Disposed for the remainder of the session: nothing more is sent.
			reporter.recordEvent(CmcdEventType.ERROR)
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 1)

			// A new session lifts the suppression.
			reporter.update({ sid: 'new-session' })
			reporter.recordEvent(CmcdEventType.ERROR)
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.length, 2)
			ok((requests[1].body as string).includes('sid="new-session"'))
			ok((requests[1].body as string).includes('sn=0'))
		})

		it('re-arms a disposed target interval on session change while started', async (t) => {
			const timers = mock.timers
			timers.enable({ apis: ['setInterval'] })
			t.after(() => timers.reset())

			const { requester, requests } = createMockRequester(410)
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.TIME_INTERVAL],
					enabledKeys: [...EVENT_KEYS],
					interval: 30,
					batchSize: 1,
				}],
			}), requester)

			reporter.start()
			equal(requests.length, 1)
			await new Promise(resolve => setTimeout(resolve, 10))

			// The 410 disposed the target: the interval is dead.
			timers.tick(30_000)
			equal(requests.length, 1)

			reporter.update({ sid: 'new-session' })
			// Restoration does not fire an immediate report; the next tick does.
			equal(requests.length, 1)

			timers.tick(30_000)
			equal(requests.length, 2)
			ok((requests[1].body as string).includes('sid="new-session"'))

			reporter.stop()
		})

		it('does not re-arm restored targets when the reporter is stopped', async (t) => {
			const timers = mock.timers
			timers.enable({ apis: ['setInterval'] })
			t.after(() => timers.reset())

			const { requester, requests } = createMockRequester(410)
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.TIME_INTERVAL],
					enabledKeys: [...EVENT_KEYS],
					interval: 30,
					batchSize: 1,
				}],
			}), requester)

			reporter.start()
			equal(requests.length, 1)
			await new Promise(resolve => setTimeout(resolve, 10))

			reporter.stop()
			reporter.update({ sid: 'new-session' })

			timers.tick(30_000)
			equal(requests.length, 1)
		})

		it('ignores a 410 from a previous session (delayed response)', async () => {
			const requests: HttpRequest[] = []
			const pending: ((response: { status: number; }) => void)[] = []
			const requester = (request: HttpRequest): Promise<{ status: number; }> => {
				requests.push(request)
				return new Promise(resolve => pending.push(resolve))
			}

			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			equal(requests.length, 1)

			// The session ends while the report is in flight; the 410 then lands.
			reporter.update({ sid: 'new-session' })
			pending[0]({ status: 410 })
			await new Promise(resolve => setTimeout(resolve, 10))

			// The 410 belonged to the old session: the target must stay alive.
			reporter.recordEvent(CmcdEventType.ERROR)
			equal(requests.length, 2)
			ok((requests[1].body as string).includes('sid="new-session"'))
			pending[1]({ status: 200 })
		})

		it('disposes every same-URL config in the session on a 410', async () => {
			const requests: HttpRequest[] = []
			const requester = async (request: HttpRequest): Promise<{ status: number; }> => {
				requests.push(request)
				return { status: request.url === 'https://example.com/cmcd' ? 410 : 200 }
			}

			const reporter = new CmcdReporter(createConfig({
				eventTargets: [
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.ERROR],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
					},
					{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.PLAY_STATE],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
					},
					{
						url: 'https://example.com/cmcd-other',
						events: [CmcdEventType.PLAY_STATE],
						enabledKeys: [...EVENT_KEYS],
						batchSize: 1,
					},
				],
			}), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.filter(r => r.url === 'https://example.com/cmcd').length, 1)

			// CTA-5004-B scopes the suppression to the target URL: the sibling
			// config shares the gone endpoint and must not keep sending.
			reporter.update({ sta: 'p' })
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.filter(r => r.url === 'https://example.com/cmcd').length, 1)
			// A target on a different URL is unaffected.
			equal(requests.filter(r => r.url === 'https://example.com/cmcd-other').length, 1)

			// A new session restores the disposed targets.
			reporter.update({ sid: 'new-session' })
			reporter.recordEvent(CmcdEventType.ERROR)
			await new Promise(resolve => setTimeout(resolve, 10))
			equal(requests.filter(r => r.url === 'https://example.com/cmcd').length, 2)
		})

		it('applies a delayed 410 from the current session', async () => {
			const requests: HttpRequest[] = []
			const pending: ((response: { status: number; }) => void)[] = []
			const requester = (request: HttpRequest): Promise<{ status: number; }> => {
				requests.push(request)
				return new Promise(resolve => pending.push(resolve))
			}

			const reporter = new CmcdReporter(createConfig(), requester)

			reporter.recordEvent(CmcdEventType.ERROR)
			pending[0]({ status: 410 })
			await new Promise(resolve => setTimeout(resolve, 10))

			reporter.recordEvent(CmcdEventType.ERROR)
			equal(requests.length, 1)
		})

		it('clears the interval when target is removed via 410', async (t) => {
			const setIntervalSpy = t.mock.method(globalThis, 'setInterval')
			const clearIntervalSpy = t.mock.method(globalThis, 'clearInterval')
			const { requester, requests } = createMockRequester(410)

			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.TIME_INTERVAL],
					enabledKeys: [...EVENT_KEYS],
					interval: 60,
					batchSize: 1,
				}],
			}), requester)

			reporter.start()
			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			equal(setIntervalSpy.mock.calls.length, 1)
			const intervalId = setIntervalSpy.mock.calls[0].result
			ok(clearIntervalSpy.mock.calls.some(c => c.arguments[0] === intervalId))
		})
	})

	describe('start lifecycle', () => {
		it('disarms existing intervals when start() is called multiple times', (t) => {
			const setIntervalSpy = t.mock.method(globalThis, 'setInterval')
			const clearIntervalSpy = t.mock.method(globalThis, 'clearInterval')
			const { requester } = createMockRequester()

			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.TIME_INTERVAL],
					enabledKeys: [...EVENT_KEYS],
					interval: 60,
					batchSize: 1,
				}],
			}), requester)

			reporter.start()
			equal(setIntervalSpy.mock.calls.length, 1)
			const firstId = setIntervalSpy.mock.calls[0].result

			reporter.start()
			ok(clearIntervalSpy.mock.calls.some(c => c.arguments[0] === firstId))

			reporter.stop()
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

	describe('state-change dedup', () => {
		describe('PLAY_STATE', () => {
			it('first PLAY_STATE event passes through', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })
				reporter.recordEvent(CmcdEventType.PLAY_STATE)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('e=ps'))
				ok((requests[0].body as string)?.includes('sta=p'))
			})

			it('drops consecutive PLAY_STATE events with the same sta', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })
				reporter.recordEvent(CmcdEventType.PLAY_STATE)
				reporter.recordEvent(CmcdEventType.PLAY_STATE)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
			})

			it('emits when sta transitions', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })
				reporter.recordEvent(CmcdEventType.PLAY_STATE)
				reporter.update({ sta: 'a' })
				reporter.recordEvent(CmcdEventType.PLAY_STATE)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
				ok((requests[0].body as string)?.includes('sta=p'))
				ok((requests[1].body as string)?.includes('sta=a'))
			})

			it('recordEvent with sta in data writes through to persistent data', async () => {
				const { requester } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['sta'],
					eventTargets: [{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.PLAY_STATE],
						enabledKeys: ['sta', 'e', 'sid'],
						batchSize: 1,
					}],
				}, requester)

				reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

				await new Promise(resolve => setTimeout(resolve, 10))

				// Verify the write-through: subsequent request reports include sta=p (URL-encoded)
				const req = reporter.createRequestReport({ url: 'https://cdn.example.com/seg.mp4' })
				ok(req.url.includes('sta%3Dp'))
			})

			it('deduplicates across mixed entry points', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })
				reporter.recordEvent(CmcdEventType.PLAY_STATE)
				reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
			})
		})

		describe('update() auto-trigger', () => {
			it('update({ sta }) auto-fires PLAY_STATE when sta changes', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('e=ps'))
				ok((requests[0].body as string)?.includes('sta=p'))
			})

			it('update({ sta }) with unchanged value does not fire', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })
				reporter.update({ sta: 'p' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
			})

			it('subsequent manual recordEvent after update is deduped', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })
				reporter.recordEvent(CmcdEventType.PLAY_STATE)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
			})

			it('update with non-tracked-only fields fires no event', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ bl: [3000] })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 0)
			})

			it('re-fires when same value is set after sid reset', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })
				reporter.update({ sid: 'new-session' })
				reporter.update({ sta: 'p' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
			})
		})

		describe('PLAYBACK_RATE', () => {
			function createPrConfig(): Partial<CmcdReporterConfig> {
				return {
					sid: 'test-session',
					cid: 'test-content',
					enabledKeys: ['pr', 'sid', 'cid', 'v', 'e', 'ts', 'sn'],
					eventTargets: [{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.PLAYBACK_RATE],
						enabledKeys: ['pr', 'sid', 'cid', 'v', 'e', 'ts', 'sn'],
						batchSize: 1,
					}],
				}
			}

			it('update({ pr }) auto-fires PLAYBACK_RATE on change', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createPrConfig(), requester)

				reporter.update({ pr: 1.5 })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('e=pr'))
				ok((requests[0].body as string)?.includes('pr=1.5'))
			})

			it('deduplicates consecutive same pr', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createPrConfig(), requester)

				reporter.update({ pr: 1.5 })
				reporter.update({ pr: 1.5 })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
			})
		})

		describe('CONTENT_ID', () => {
			function createCidConfig(): Partial<CmcdReporterConfig> {
				return {
					sid: 'test-session',
					enabledKeys: ['cid', 'sid', 'v', 'e', 'ts', 'sn'],
					eventTargets: [{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.CONTENT_ID],
						enabledKeys: ['cid', 'sid', 'v', 'e', 'ts', 'sn'],
						batchSize: 1,
					}],
				}
			}

			it('update({ cid }) auto-fires CONTENT_ID on change', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createCidConfig(), requester)

				reporter.update({ cid: 'content-1' })
				reporter.update({ cid: 'content-2' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
				ok((requests[0].body as string)?.includes('cid="content-1"'))
				ok((requests[1].body as string)?.includes('cid="content-2"'))
			})

			it('deduplicates consecutive same cid', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createCidConfig(), requester)

				reporter.update({ cid: 'content-1' })
				reporter.update({ cid: 'content-1' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
			})
		})

		describe('BACKGROUNDED_MODE', () => {
			function createBgConfig(): Partial<CmcdReporterConfig> {
				return {
					sid: 'test-session',
					enabledKeys: ['bg', 'sid', 'v', 'e', 'ts', 'sn'],
					eventTargets: [{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.BACKGROUNDED_MODE],
						enabledKeys: ['bg', 'sid', 'v', 'e', 'ts', 'sn'],
						batchSize: 1,
					}],
				}
			}

			it('update({ bg }) auto-fires BACKGROUNDED_MODE on change', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createBgConfig(), requester)

				reporter.update({ bg: true })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('e=b'))
				ok((requests[0].body as string)?.includes('bg'))
			})

			it('deduplicates consecutive same bg', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createBgConfig(), requester)

				reporter.update({ bg: true })
				reporter.update({ bg: true })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
			})
		})

		describe('BITRATE_CHANGE', () => {
			function createBrConfig(): Partial<CmcdReporterConfig> {
				return {
					sid: 'test-session',
					enabledKeys: ['br', 'sid', 'v', 'e', 'ts', 'sn'],
					eventTargets: [{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.BITRATE_CHANGE],
						enabledKeys: ['br', 'sid', 'v', 'e', 'ts', 'sn'],
						batchSize: 1,
					}],
				}
			}

			it('update({ br }) auto-fires BITRATE_CHANGE on change', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createBrConfig(), requester)

				reporter.update({ br: [5000] })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('e=bc'))
			})

			it('deduplicates same content, different array reference', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createBrConfig(), requester)

				reporter.update({ br: [5000] })
				reporter.update({ br: [5000] })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
			})

			it('deduplicates SfItems with same value and params', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createBrConfig(), requester)

				reporter.update({ br: [new SfItem(5000, { v: true })] })
				reporter.update({ br: [new SfItem(5000, { v: true })] })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 1)
			})

			it('emits when SfItem params differ', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createBrConfig(), requester)

				reporter.update({ br: [new SfItem(5000, { v: true })] })
				reporter.update({ br: [new SfItem(5000, { a: true })] })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
			})

			it('emits when order changes', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createBrConfig(), requester)

				reporter.update({ br: [1000, 5000] })
				reporter.update({ br: [5000, 1000] })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
			})

			it('emits when length changes', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createBrConfig(), requester)

				reporter.update({ br: [5000] })
				reporter.update({ br: [5000, 1000] })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
			})

			it('emits when caller mutates the br array in place between updates', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createBrConfig(), requester)

				const arr = [5000]
				reporter.update({ br: arr })
				arr[0] = 4000
				reporter.update({ br: arr })

				await new Promise(resolve => setTimeout(resolve, 10))

				// The dedup baseline must not share a reference with the caller's
				// array, otherwise in-place mutation would poison it and the
				// second update would be incorrectly deduplicated.
				equal(requests.length, 2)
				ok((requests[0].body as string)?.includes('br=(5000)'))
				ok((requests[1].body as string)?.includes('br=(4000)'))
			})
		})

		describe('cross-cutting', () => {
			it('fires multi-field updates in dispatch order (sta then pr)', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter({
					sid: 'test-session',
					enabledKeys: ['sta', 'pr', 'sid', 'v', 'e', 'ts', 'sn'],
					eventTargets: [{
						url: 'https://example.com/cmcd',
						events: [CmcdEventType.PLAY_STATE, CmcdEventType.PLAYBACK_RATE],
						enabledKeys: ['sta', 'pr', 'sid', 'v', 'e', 'ts', 'sn'],
						batchSize: 1,
					}],
				}, requester)

				// Order in input differs from dispatch table; output must follow dispatch order.
				reporter.update({ pr: 1.5, sta: 'a' })

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
				ok((requests[0].body as string)?.includes('e=ps'))
				ok((requests[1].body as string)?.includes('e=pr'))
			})

			it('dropped event does not consume sn', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })
				reporter.recordEvent(CmcdEventType.PLAY_STATE)  // dropped (dedup)
				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
				ok((requests[0].body as string)?.includes('sn=0'))  // PLAY_STATE (from update auto-trigger)
				ok((requests[1].body as string)?.includes('sn=1'))  // ERROR (next sn, not 2)
			})

			it('non-tracked events are unaffected by dedup', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.recordEvent(CmcdEventType.ERROR)
				reporter.recordEvent(CmcdEventType.ERROR)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 2)
			})

			it('drops PLAY_STATE with no sta defined anywhere', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.recordEvent(CmcdEventType.PLAY_STATE)

				await new Promise(resolve => setTimeout(resolve, 10))

				equal(requests.length, 0)
			})

			it('drops PLAY_STATE when sta is explicitly cleared to undefined', async () => {
				const { requester, requests } = createMockRequester()
				const reporter = new CmcdReporter(createConfig(), requester)

				reporter.update({ sta: 'p' })
				reporter.update({ sta: undefined })

				await new Promise(resolve => setTimeout(resolve, 10))

				// The initial update fires PLAY_STATE with sta='p'. The second update
				// clears the persisted sta but must not emit a PLAY_STATE event
				// without the required sta field (per CTA-5004-B).
				equal(requests.length, 1)
				ok((requests[0].body as string)?.includes('sta=p'))
			})
		})
	})

	it('detaches SfToken values and Uint8Array params from transform mutation', async () => {
		const bodies: string[] = []
		let calls = 0
		const reporter = new CmcdReporter({
			sid: 'sess-copy',
			eventTargets: [
				{
					url: 'https://collector.example.com/cmcd',
					events: [CmcdEventType.PLAY_STATE],
					enabledKeys: ['sta', 'com.example-tok', 'com.example-bin', 'sid', 'e', 'ts', 'sn'],
					batchSize: 1,
					transform: (data) => {
						// Only the first report's transform mutates; the second call is a
						// pure probe of whatever the persistent store hands it.
						if (calls++ === 0) {
							const tok = data['com.example-tok'] as SfToken
							const bin = data['com.example-bin'] as SfItem<string, Record<string, unknown>>
							const bytes = (bin.params as Record<string, unknown>)['data'] as Uint8Array

							tok.description = 'mutated'
							bytes[0] = 9
						}
						return data
					},
				},
			],
		}, async (request) => {
			bodies.push(String(request.body))
			return { status: 200 }
		})

		reporter.update({
			'com.example-tok': new SfToken('preload'),
			'com.example-bin': new SfItem('k', { data: new Uint8Array([1, 2, 3]) }),
		})

		reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		await Promise.resolve()

		// The second report re-reads the persistent store: the first transform's
		// nested mutation must not have reached it.
		ok(bodies[1].includes('com.example-tok=preload'))
		ok(bodies[1].includes(':AQID:')) // base64 of [1, 2, 3]
	})

	it('clones Date values through session rotation', async () => {
		const bodies: string[] = []
		const reporter = new CmcdReporter({
			sid: 'sess-date-1',
			eventTargets: [
				{
					url: 'https://collector.example.com/cmcd',
					events: [CmcdEventType.PLAY_STATE],
					enabledKeys: ['sta', 'com.example-when', 'com.example-bare-when', 'sid', 'e', 'ts', 'sn'],
					batchSize: 1,
				},
			],
		}, async (request) => {
			bodies.push(String(request.body))
			return { status: 200 }
		})

		const when = new Date('2024-01-01T00:00:00.000Z')

		reporter.update({
			'com.example-when': new SfItem('k', { at: when }),
			'com.example-bare-when': when,
			sta: 'p',
		} as unknown as Partial<Cmcd>)

		// Rotate sessions: startSession() runs copyReportValues on the archived
		// session's data unconditionally, before the new session inherits it.
		reporter.update({ sid: 'sess-date-2' })

		// Mutate the caller's own Date after rotation; a working clone must not
		// reflect it.
		when.setTime(0)

		reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'a' })
		await Promise.resolve()

		// The rotated session must carry a working Date clone, both nested in
		// an SfItem's params and as a bare custom value, at the value the Date
		// held when the session rotated, not the caller's later mutation.
		ok(bodies[1].includes('com.example-when="k";at=@1704067200'))
		ok(bodies[1].includes('com.example-bare-when=@1704067200'))
	})

	it('does not leave a bg key in the store when update() never received one', () => {
		const { requester } = createMockRequester()
		const reporter = new CmcdReporter({
			sid: 'sess-no-bg',
			enabledKeys: ['bg'],
		}, requester)

		reporter.update({ sta: 'p' })

		// bg was never set, so the only enabled key has no value and the report
		// is empty. An empty report is not transmitted at all: a store carrying
		// a bg key with an undefined value would make the key set non-empty,
		// which force-adds `v` and puts a spurious `CMCD=v%3D2` on the wire.
		const req = reporter.createRequestReport({ url: 'https://example.com/video.mp4' })

		equal(req.url, 'https://example.com/video.mp4')
		deepEqual(req.customData.cmcd, {})
	})

	it('sends reports queued into a session evicted mid-fan-out at sessionRetention 0', async () => {
		const bodies: string[] = []
		const reporter = new CmcdReporter({
			sid: 's1',
			sessionRetention: 0,
			eventTargets: [
				{
					url: 'https://a.example.com/cmcd',
					events: [CmcdEventType.PLAY_STATE],
					enabledKeys: ['sta', 'sid', 'e', 'ts', 'sn'],
					batchSize: 1,
					// Rotating inside the first target's transform leaves the
					// second target still fanning out on pinned s1.
					transform: (data) => {
						reporter.update({ sid: 's2' })
						return data
					},
				},
				{
					url: 'https://b.example.com/cmcd',
					events: [CmcdEventType.PLAY_STATE],
					enabledKeys: ['sta', 'sid', 'e', 'ts', 'sn'],
					batchSize: 1,
				},
			],
		}, async (request) => {
			bodies.push(`${request.url} ${String(request.body)}`)
			return { status: 200 }
		})

		reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await Promise.resolve()

		const bReports = bodies.filter((body) => body.startsWith('https://b.example.com/cmcd'))
		equal(bReports.length, 1)
		ok(/sid="s1"/.test(bReports[0]))
	})

	it('consumes no sequence number or msd gate when encoding throws at enqueue', async () => {
		const bodies: string[] = []
		const reporter = new CmcdReporter({
			sid: 'sess-encode',
			eventTargets: [
				{
					url: 'https://collector.example.com/cmcd',
					events: [CmcdEventType.PLAY_STATE, CmcdEventType.CUSTOM_EVENT],
					enabledKeys: ['sta', 'cen', 'com.example-big', 'msd', 'sid', 'e', 'ts', 'sn'],
					batchSize: 1,
				},
			],
		}, async (request) => {
			bodies.push(String(request.body))
			return { status: 200 }
		})

		reporter.update({ msd: 250 })

		throws(() => {
			reporter.recordEvent(CmcdEventType.CUSTOM_EVENT, {
				cen: 'boom',
				'com.example-big': 1_000_000_000_000_000,
			})
		})

		reporter.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
		await Promise.resolve()

		// The failed report consumed nothing: the next report is sn=0 and
		// still carries the session's msd.
		ok(/sn=0/.test(bodies[0]))
		ok(/msd=250/.test(bodies[0]))
	})

	it('never resends a 429 re-queue whose sid was replaced by reuse', async () => {
		const requests: HttpRequest[] = []
		const pending: ((response: { status: number; }) => void)[] = []
		const requester = (request: HttpRequest): Promise<{ status: number; }> => {
			requests.push(request)
			return new Promise(resolve => pending.push(resolve))
		}

		const reporter = new CmcdReporter({
			sid: 's1',
			enabledKeys: ['sid', 'v'],
			eventTargets: [{
				url: 'https://example.com/cmcd',
				events: [CmcdEventType.ERROR],
				enabledKeys: ['sid', 'v', 'e', 'sn'],
				batchSize: 1,
			}],
		}, requester)

		// The original s1's batch is in flight when sid reuse replaces it.
		reporter.recordEvent(CmcdEventType.ERROR)
		equal(requests.length, 1)

		reporter.update({ sid: 's2' })
		reporter.update({ sid: 's1' })

		// The replacement s1 reports normally, with its own fresh counter.
		reporter.recordEvent(CmcdEventType.ERROR)
		equal(requests.length, 2)
		ok((requests[1].body as string).includes('sn=0'))

		// The original s1's in-flight send now fails: its re-queue must not
		// resurrect a sid the ledger no longer maps it to.
		pending[0]({ status: 429 })
		await new Promise(resolve => setTimeout(resolve, 10))

		reporter.flush()
		await new Promise(resolve => setTimeout(resolve, 10))

		// Only the replacement's own report went out; the orphaned batch
		// never re-sends, so no third request ever lands.
		equal(requests.length, 2)
		pending[1]({ status: 200 })
	})

	it('does not arm remaining targets when a start() transform calls stop()', (t) => {
		const timers = mock.timers
		timers.enable({ apis: ['setInterval'] })
		t.after(() => timers.reset())

		const { requester, requests } = createMockRequester()
		const reporter = new CmcdReporter(createConfig({
			eventTargets: [
				{
					url: 'https://example.com/cmcd-stop-a',
					events: [CmcdEventType.TIME_INTERVAL],
					enabledKeys: [...EVENT_KEYS],
					interval: 30,
					batchSize: 1,
					transform: (data) => {
						reporter.stop()
						return data
					},
				},
				{
					url: 'https://example.com/cmcd-stop-b',
					events: [CmcdEventType.TIME_INTERVAL],
					enabledKeys: [...EVENT_KEYS],
					interval: 30,
					batchSize: 1,
				},
			],
		}), requester)

		reporter.start()

		// stop() ran inside the first target's transform, so the fan-out halts:
		// the second target is never armed and never reports.
		equal(requests.length, 1)
		equal(requests[0].url, 'https://example.com/cmcd-stop-a')

		timers.tick(120_000)

		// No timer may fire after a stop() that ran during start().
		equal(requests.length, 1)
	})

	it('sends a time-interval report queued into a session the tick rotated away at sessionRetention 0', (t) => {
		const timers = mock.timers
		timers.enable({ apis: ['setInterval'] })
		t.after(() => timers.reset())

		const { requester, requests } = createMockRequester()
		let reports = 0
		const reporter = new CmcdReporter(createConfig({
			sid: 's1',
			sessionRetention: 0,
			eventTargets: [
				{
					url: 'https://example.com/cmcd-tick-evict',
					events: [CmcdEventType.TIME_INTERVAL],
					enabledKeys: [...EVENT_KEYS],
					interval: 30,
					batchSize: 1,
					// Rotates on the timer's tick rather than on start()'s initial
					// report, so the eviction the rotation triggers lands while the
					// tick still holds s1.
					transform: (data) => {
						if (reports++ === 1) {
							reporter.update({ sid: 's2' })
						}
						return data
					},
				},
			],
		}), requester)

		reporter.start()
		equal(requests.length, 1)

		timers.tick(30_000)

		// The tick's report was queued into s1 after its own transform rotated
		// the session away; s1's eviction must wait for the tick to drain.
		equal(requests.length, 2)
		ok((requests[1].body as string).includes('sid="s1"'))

		reporter.stop()
	})
})
