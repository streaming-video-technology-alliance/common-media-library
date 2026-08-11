import type { Cmcd, CmcdEventReportTransform, CmcdKey, CmcdReporterConfig, CmcdRequestReportTransform, CmcdTransformRequest } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdReporter, CmcdTransmissionMode, validateCmcdEventReport } from '@svta/cml-cmcd'
import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { deepEqual, equal, ok, throws } from 'node:assert'
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

		it('stamps the reporter sid over a per-call sid on recordResponseReceived', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter(createConfig({
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.RESPONSE_RECEIVED],
					enabledKeys: [...RR_KEYS],
					batchSize: 1,
				}],
			}), requester)

			reporter.recordResponseReceived({
				status: 200,
				request: { url: 'https://cdn.example.com/segment.mp4' },
			}, { sid: 'INJECTED' })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 1)
			ok((requests[0].body as string).includes('sid="test-session"'))
			ok(!(requests[0].body as string).includes('INJECTED'))
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
			const seen: Array<string | undefined> = []
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
				request: { url: 'https://cdn.example.com/segment.mp4' },
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
			equal((reporter as unknown as { requestTarget: { msdSent: boolean; }; }).requestTarget.msdSent, false)
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

			const targets = [...(reporter as unknown as { eventTargets: Map<unknown, { msdSent: boolean; }>; }).eventTargets.values()]
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

				reporter.recordResponseReceived({ request: { url: 'https://cdn.example.com/seg.mp4' }, status: 200 })

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

				reporter.recordResponseReceived({ request: { url: 'https://cdn.example.com/seg.mp4' }, status: 200 })

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
			// A player's request carries only its own taxonomy on customData.
			// It does not have to declare the reporter's `cmcd` key.
			type PlayerRequest = HttpRequest<{ requestType: string; }>

			it('passes the triggering request to the transform for response-received events', async () => {
				const { requester, requests } = createMockRequester()
				const seen: (HttpRequest | undefined)[] = []
				const triggering: PlayerRequest = {
					url: 'https://cdn.example.com/segment.mp4',
					customData: { requestType: 'segment' },
				}

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

				const manifestRequest: PlayerRequest = {
					url: 'https://cdn.example.com/manifest.mpd',
					customData: { requestType: 'mpd' },
				}

				const segmentRequest: PlayerRequest = {
					url: 'https://cdn.example.com/segment.mp4',
					customData: { requestType: 'segment' },
				}

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
				// alias: this is the shape a player passes, and it must compile
				// without a cast. `customData` is inferred, not pinned.
				reporter.recordResponseReceived({
					request: {
						url: 'https://cdn.example.com/segment.mp4',
						customData: { requestType: 'segment' },
					},
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
					request: { url: 'https://cdn.example.com/manifest.mpd', customData: { requestType: 'mpd' } },
					status: 200,
				})
				reporter.recordResponseReceived({
					request: { url: 'https://cdn.example.com/segment.mp4', customData: { requestType: 'segment' } },
					status: 200,
				})

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
				request: { url: 'https://cdn.example.com/segment.mp4' },
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
			const pending: Array<(response: { status: number; }) => void> = []
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
			const pending: Array<(response: { status: number; }) => void> = []
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

		it('applies a delayed 410 from the current session', async () => {
			const requests: HttpRequest[] = []
			const pending: Array<(response: { status: number; }) => void> = []
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
})
