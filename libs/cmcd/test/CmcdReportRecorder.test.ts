import type { CmcdTransportAdapter, CmcdRequestDeliver, CmcdRecordedReport } from '@svta/cml-cmcd'
import { createFetchTransport, createXhrTransport, CmcdReportRecorder, CmcdRequestType } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok } from 'node:assert'
import { describe, it } from 'node:test'

/**
 * Minimal XMLHttpRequest shim sufficient for createXhrTransport tests.
 * Installed as `globalThis.XMLHttpRequest` for the duration of a test.
 */
class MockXhr {
	_method = 'GET'
	_url = ''
	_headers: Record<string, string> = {}
	_body: unknown = undefined
	status = 0
	statusText = ''
	readyState = 0
	responseURL = ''
	response: unknown = null
	responseText = ''
	onload: ((this: MockXhr) => unknown) | null = null
	onloadend: ((this: MockXhr) => unknown) | null = null

	open(method: string, url: string): void {
		this._method = method
		this._url = url
	}

	setRequestHeader(name: string, value: string): void {
		this._headers[name.toLowerCase()] = value
	}

	send(body?: unknown): void {
		this._body = body
	}

	getAllResponseHeaders(): string {
		return ''
	}
}

/**
 * Fake CmcdTransportAdapter for testing recorder logic without patching
 * any globals. Exposes `.deliver()` so tests can simulate intercepted
 * requests directly.
 */
class FakeTransport implements CmcdTransportAdapter {
	deliver: CmcdRequestDeliver = () => undefined
	attached = false
	detached = false

	attach(deliver: CmcdRequestDeliver): () => void {
		this.attached = true
		this.deliver = deliver
		return () => {
			this.detached = true
		}
	}

	/** Simulate an intercepted request and return whatever the recorder decides. */
	simulate(request: HttpRequest): Response | undefined {
		return this.deliver(request)
	}
}

describe('CmcdReportRecorder', () => {
	describe('lifecycle', () => {
		it('starts empty', () => {
			const recorder = new CmcdReportRecorder()
			deepEqual(recorder.getReports(), [])
		})

		it('attach() calls each supplied transport adapter', () => {
			const t1 = new FakeTransport()
			const t2 = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t1, t2] })
			ok(t1.attached)
			ok(t2.attached)
			recorder.detach()
		})

		it('detach() invokes the detach functions returned by each transport', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			recorder.detach()
			ok(t.detached)
		})

		it('clear() empties the recorded reports', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({
				url: 'https://example.com/seg.m4s?CMCD=sid%3D%22abc%22',
				method: 'GET',
				headers: {},
			})
			equal(recorder.getReports().length, 1)
			recorder.clear()
			equal(recorder.getReports().length, 0)
			recorder.detach()
		})

		it('getReports() returns a defensive copy', () => {
			const recorder = new CmcdReportRecorder()
			const a = recorder.getReports()
			const b = recorder.getReports()
			ok(a !== b)
		})

		it('getReports(type) filters by classification', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.mpd?CMCD=x', method: 'GET', headers: {} })
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=x', method: 'GET', headers: {} })
			equal(recorder.getReports(CmcdRequestType.MANIFEST).length, 1)
			equal(recorder.getReports(CmcdRequestType.SEGMENT).length, 1)
			equal(recorder.getReports().length, 2)
			recorder.detach()
		})

		it('attach() is a no-op when already attached', () => {
			const t1 = new FakeTransport()
			const t2 = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t1] })
			recorder.attach({ transports: [t2] })
			ok(t1.attached)
			ok(!t2.attached, 't2 should not have been attached')
			recorder.detach()
		})

		it('detach() rejects pending waitForReports promises', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			const promise = recorder.waitForReports(CmcdRequestType.SEGMENT, 5, 60000)
			setTimeout(() => recorder.detach(), 10)
			try {
				await promise
				ok(false, 'should have rejected')
			} catch (err) {
				ok((err as Error).message.includes('detached'))
			}
		})

		it('detach() resolves pending recordFor promises with whatever was recorded', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			const promise = recorder.recordFor(60000)
			setTimeout(() => recorder.detach(), 10)
			const result = await promise
			equal(result.length, 1)
		})
	})

	describe('classification', () => {
		it('classifies a .m3u8 GET as manifest with reportingMode=query', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/index.m3u8?CMCD=sid%3D%22abc%22',
				method: 'GET',
				headers: {},
			})
			const captured = recorder.getReports()
			equal(captured.length, 1)
			equal(captured[0].type, CmcdRequestType.MANIFEST)
			equal(captured[0].reportingMode, 'query')
			recorder.detach()
		})

		it('classifies a .mpd GET as manifest', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/index.mpd?CMCD=sid%3D%22abc%22',
				method: 'GET',
				headers: {},
			})
			equal(recorder.getReports()[0].type, CmcdRequestType.MANIFEST)
			recorder.detach()
		})

		it('classifies a .m4s GET as segment with reportingMode=header when CMCD headers present', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/seg1.m4s',
				method: 'GET',
				headers: { 'cmcd-request': 'sid="abc"' },
			})
			const captured = recorder.getReports()
			equal(captured[0].type, CmcdRequestType.SEGMENT)
			equal(captured[0].reportingMode, 'header')
			recorder.detach()
		})

		it('classifies POST as event regardless of URL extension', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({
				transports: [t],
				eventTargetUrls: ['https://events.example.com'],
			})
			t.simulate({
				url: 'https://events.example.com/cmcd',
				method: 'POST',
				headers: {},
				body: 'sid="abc",ts=1234',
			})
			const captured = recorder.getReports()
			equal(captured[0].type, CmcdRequestType.EVENT)
			equal(captured[0].reportingMode, 'event')
			recorder.detach()
		})

		it('does not capture requests that carry no CMCD data', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/seg1.m4s',
				method: 'GET',
				headers: { 'content-type': 'video/mp4' },
			})
			equal(recorder.getReports().length, 0)
			recorder.detach()
		})

		it('captures unknown-type URLs that carry CMCD query', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/something?CMCD=sid%3D%22abc%22',
				method: 'GET',
				headers: {},
			})
			const captured = recorder.getReports()
			equal(captured.length, 1)
			equal(captured[0].type, CmcdRequestType.UNKNOWN)
			equal(captured[0].reportingMode, 'query')
			recorder.detach()
		})
	})

	describe('recordFor', () => {
		it('resolves after the timeout with whatever was recorded', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			setTimeout(() => {
				t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			}, 10)
			const result = await recorder.recordFor(50)
			equal(result.length, 1)
			recorder.detach()
		})

		it('resolves with zero when nothing matches', async () => {
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [new FakeTransport()] })
			const result = await recorder.recordFor(50, CmcdRequestType.EVENT)
			equal(result.length, 0)
			recorder.detach()
		})

		it('filters by type', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.mpd?CMCD=x', method: 'GET', headers: {} })
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=x', method: 'GET', headers: {} })
			const result = await recorder.recordFor(50, CmcdRequestType.SEGMENT)
			equal(result.length, 1)
			equal(result[0].type, CmcdRequestType.SEGMENT)
			recorder.detach()
		})
	})

	describe('event-target stubbing', () => {
		it('returns a 204 Response from deliver when URL matches', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({
				transports: [t],
				eventTargetUrls: ['https://events.example.com'],
			})
			const response = t.simulate({
				url: 'https://events.example.com/cmcd',
				method: 'POST',
				headers: {},
				body: 'sid="abc"',
			})
			ok(response instanceof Response)
			equal(response?.status, 204)
			equal(recorder.getReports(CmcdRequestType.EVENT).length, 1)
			recorder.detach()
		})

		it('returns undefined for non-event-target requests', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({
				transports: [t],
				eventTargetUrls: ['https://events.example.com'],
			})
			const response = t.simulate({
				url: 'https://e.com/seg.m4s?CMCD=x',
				method: 'GET',
				headers: {},
			})
			equal(response, undefined)
			recorder.detach()
		})

		it('does not stub POSTs that do not match eventTargetUrls', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({
				transports: [t],
				eventTargetUrls: ['https://events.example.com'],
			})
			const response = t.simulate({
				url: 'https://other.com/somewhere',
				method: 'POST',
				headers: { 'cmcd-request': 'sid="abc"' },
				body: 'data',
			})
			// Request carries CMCD data so it IS recorded, but URL doesn't
			// match the stub list — must NOT return a synthetic Response.
			equal(response, undefined)
			equal(recorder.getReports().length, 1)
			recorder.detach()
		})
	})

	describe('waitForReports', () => {
		it('resolves immediately when count already met', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=sid%3D%22abc%22', method: 'GET', headers: {} })
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=sid%3D%22abc%22', method: 'GET', headers: {} })
			const result = await recorder.waitForReports(CmcdRequestType.SEGMENT, 2, 1000)
			equal(result.length, 2)
			recorder.detach()
		})

		it('resolves when threshold is reached after the call', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			const promise = recorder.waitForReports(CmcdRequestType.SEGMENT, 2, 1000)
			setTimeout(() => {
				t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
				t.simulate({ url: 'https://e.com/b.m4s?CMCD=x', method: 'GET', headers: {} })
			}, 10)
			const result = await promise
			equal(result.length, 2)
			recorder.detach()
		})

		it('rejects with a diagnostic error on timeout', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			try {
				await recorder.waitForReports(CmcdRequestType.SEGMENT, 3, 50)
				ok(false, 'should have rejected')
			} catch (err) {
				const e = err as Error
				ok(e.message.includes('Timeout'))
				ok(e.message.includes('3'))
				ok(e.message.includes('segment'))
				ok(e.message.includes('Got 1'))
			}
			recorder.detach()
		})

		it('waits across any type when type is undefined', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [t] })
			const promise = recorder.waitForReports(undefined, 2, 1000)
			t.simulate({ url: 'https://e.com/a.mpd?CMCD=x', method: 'GET', headers: {} })
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=x', method: 'GET', headers: {} })
			const result = await promise
			equal(result.length, 2)
			recorder.detach()
		})
	})

	describe('onReport', () => {
		it('fires once per captured request, in capture order', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			const calls: CmcdRecordedReport[] = []
			recorder.attach({
				transports: [t],
				onReport: (report) => calls.push(report),
			})
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=sid%3D%22abc%22', method: 'GET', headers: {} })
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=sid%3D%22abc%22', method: 'GET', headers: {} })
			equal(calls.length, 2)
			equal(calls[0].request.url, 'https://e.com/a.m4s?CMCD=sid%3D%22abc%22')
			equal(calls[1].request.url, 'https://e.com/b.m4s?CMCD=sid%3D%22abc%22')
			equal(calls[0].type, CmcdRequestType.SEGMENT)
			equal(calls[0].reportingMode, 'query')
			recorder.detach()
		})

		it('does not fire a stale listener after detach() then attach() with no listener', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			const calls: CmcdRecordedReport[] = []
			recorder.attach({
				transports: [t],
				onReport: (report) => calls.push(report),
			})
			recorder.detach()
			recorder.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			equal(calls.length, 0)
			recorder.detach()
		})

		it('does not fire the listener after detach() with no further attach', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			const calls: CmcdRecordedReport[] = []
			recorder.attach({
				transports: [t],
				onReport: (report) => calls.push(report),
			})
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			equal(calls.length, 1)
			recorder.detach()
			// FakeTransport still holds a reference to the patched deliver,
			// so simulating after detach reaches #deliver. Listener must
			// have been cleared.
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=x', method: 'GET', headers: {} })
			equal(calls.length, 1)
		})

		it('receives the same object reference that getReports() returns', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			let received: CmcdRecordedReport | undefined
			recorder.attach({
				transports: [t],
				onReport: (report) => { received = report },
			})
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			const fromGet = recorder.getReports()[0]
			equal(received, fromGet)
			recorder.detach()
		})

		it('does not fire for requests that carry no CMCD data', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			const calls: CmcdRecordedReport[] = []
			recorder.attach({
				transports: [t],
				onReport: (report) => calls.push(report),
			})
			t.simulate({
				url: 'https://e.com/seg.m4s',
				method: 'GET',
				headers: { 'content-type': 'video/mp4' },
			})
			equal(calls.length, 0)
			recorder.detach()
		})

		it('fires the listener before pending waitForReports resolves', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			const order: string[] = []
			recorder.attach({
				transports: [t],
				onReport: () => order.push('listener'),
			})
			const promise = recorder.waitForReports(undefined, 1, 1000).then(() => order.push('waiter'))
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			await promise
			deepEqual(order, ['listener', 'waiter'])
			recorder.detach()
		})

		it('uses the new listener after detach() and re-attach with a different callback', () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			const a: CmcdRecordedReport[] = []
			const b: CmcdRecordedReport[] = []
			recorder.attach({ transports: [t], onReport: (r) => a.push(r) })
			recorder.detach()
			recorder.attach({ transports: [t], onReport: (r) => b.push(r) })
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			equal(a.length, 0)
			equal(b.length, 1)
			recorder.detach()
		})

		it('still resolves waiters and returns synthetic 204 when listener throws', async () => {
			const t = new FakeTransport()
			const recorder = new CmcdReportRecorder()
			recorder.attach({
				transports: [t],
				eventTargetUrls: ['https://events.example.com'],
				onReport: () => { throw new Error('listener boom') },
			})
			const waiter = recorder.waitForReports(CmcdRequestType.EVENT, 1, 1000)
			const synthetic = t.simulate({
				url: 'https://events.example.com/cmcd',
				method: 'POST',
				headers: {},
				body: 'sid="abc"',
			})
			equal(synthetic?.status, 204, 'synthetic 204 still returned')
			const reports = await waiter
			equal(reports.length, 1, 'waiter resolved despite listener error')
			recorder.detach()
		})
	})
})

describe('createXhrTransport', () => {
	let origXhr: typeof globalThis.XMLHttpRequest

	function installXhrShim(): void {
		origXhr = globalThis.XMLHttpRequest
		;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = MockXhr
	}

	function restoreXhrShim(): void {
		;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = origXhr
	}

	it('captures an XHR request that carries CMCD-* headers', () => {
		installXhrShim()
		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [createXhrTransport()] })

			const xhr = new MockXhr()
			xhr.open('GET', 'https://e.com/seg.m4s')
			xhr.setRequestHeader('CMCD-Request', 'sid="abc"')
			xhr.send()

			const captured = recorder.getReports(CmcdRequestType.SEGMENT)
			equal(captured.length, 1)
			equal(captured[0].reportingMode, 'header')
			equal(captured[0].request.url, 'https://e.com/seg.m4s')
			equal(captured[0].request.method, 'GET')
			equal(captured[0].request.headers?.['cmcd-request'], 'sid="abc"')
			recorder.detach()
		} finally {
			restoreXhrShim()
		}
	})

	it('captures an XHR request with CMCD query parameter', () => {
		installXhrShim()
		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [createXhrTransport()] })

			const xhr = new MockXhr()
			xhr.open('GET', 'https://e.com/seg.m4s?CMCD=sid%3D%22abc%22')
			xhr.send()

			const captured = recorder.getReports(CmcdRequestType.SEGMENT)
			equal(captured.length, 1)
			equal(captured[0].reportingMode, 'query')
			recorder.detach()
		} finally {
			restoreXhrShim()
		}
	})

	it('detach restores the original XHR prototype methods', () => {
		installXhrShim()
		try {
			const origOpen = MockXhr.prototype.open
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [createXhrTransport()] })
			ok(MockXhr.prototype.open !== origOpen, 'open should have been patched')
			recorder.detach()
			equal(MockXhr.prototype.open, origOpen, 'open should be restored')
		} finally {
			restoreXhrShim()
		}
	})

	it('does not capture non-CMCD XHR requests', () => {
		installXhrShim()
		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [createXhrTransport()] })

			const xhr = new MockXhr()
			xhr.open('GET', 'https://e.com/seg.m4s')
			xhr.send()

			equal(recorder.getReports().length, 0)
			recorder.detach()
		} finally {
			restoreXhrShim()
		}
	})

	it('completes the XHR with synthetic 204 when URL matches eventTargetUrls', async () => {
		installXhrShim()
		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({
				transports: [createXhrTransport()],
				eventTargetUrls: ['https://events.example.com'],
			})

			const xhr = new MockXhr()
			let loaded = false
			let loadEnded = false
			xhr.onload = () => { loaded = true }
			xhr.onloadend = () => { loadEnded = true }
			xhr.open('POST', 'https://events.example.com/cmcd')
			xhr.send('sid="abc"')

			// Wait one microtask for the synthetic completion to fire
			await new Promise((r) => setTimeout(r, 0))

			ok(loaded, 'onload should have fired')
			ok(loadEnded, 'onloadend should have fired')
			equal(xhr.status, 204)
			equal(xhr.readyState, 4)
			equal(recorder.getReports(CmcdRequestType.EVENT).length, 1)
			recorder.detach()
		} finally {
			restoreXhrShim()
		}
	})

	it('attach is a no-op when globalThis.XMLHttpRequest is undefined', () => {
		const origXhr = globalThis.XMLHttpRequest
		;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = undefined
		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [createXhrTransport()] })
			recorder.detach()
		} finally {
			;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = origXhr
		}
	})
})

describe('default transports', () => {
	it('uses both XHR and fetch when no transports option is supplied', async () => {
		const origXhr = globalThis.XMLHttpRequest
		const origFetch = globalThis.fetch
		;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = MockXhr
		globalThis.fetch = async () => new Response('', { status: 200 })

		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach()

			const xhr = new MockXhr()
			xhr.open('GET', 'https://e.com/a.m4s?CMCD=sid%3D%22x%22')
			xhr.send()

			await fetch('https://e.com/b.m4s?CMCD=sid%3D%22y%22')

			equal(recorder.getReports(CmcdRequestType.SEGMENT).length, 2)
			recorder.detach()
		} finally {
			;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = origXhr
			globalThis.fetch = origFetch
		}
	})

	it('provides a valid example', async () => {
		const origXhr = globalThis.XMLHttpRequest
		const origFetch = globalThis.fetch
		;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = MockXhr
		globalThis.fetch = async () => new Response('', { status: 200 })

		try {
			//#region example
			const recorder = new CmcdReportRecorder()
			recorder.attach({ eventTargetUrls: ['https://events.example.com'] })

			// ... player runs, emits CMCD requests ...
			await fetch('https://cdn.example.com/seg1.m4s?CMCD=sid%3D%22abc%22')
			await fetch('https://cdn.example.com/seg2.m4s?CMCD=sid%3D%22abc%22')

			const segments = recorder.getReports(CmcdRequestType.SEGMENT)
			equal(segments.length, 2)

			recorder.detach()
			//#endregion example
		} finally {
			;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = origXhr
			globalThis.fetch = origFetch
		}
	})

	it('provides a valid onReport example', async () => {
		const origXhr = globalThis.XMLHttpRequest
		const origFetch = globalThis.fetch
		;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = MockXhr
		globalThis.fetch = async () => new Response('', { status: 200 })

		try {
			//#region example-on-report
			const reports: CmcdRecordedReport[] = []
			const recorder = new CmcdReportRecorder()
			recorder.attach({
				onReport: (report) => reports.push(report),
			})

			// ... player runs, emits CMCD requests ...
			await fetch('https://cdn.example.com/seg1.m4s?CMCD=sid%3D%22abc%22')
			await fetch('https://cdn.example.com/seg2.m4s?CMCD=sid%3D%22abc%22')

			// `reports` updates in real time as captures arrive; a test
			// harness page would push to a UI table here instead of an
			// array.
			equal(reports.length, 2)

			recorder.detach()
			//#endregion example-on-report
		} finally {
			;(globalThis as { XMLHttpRequest: unknown }).XMLHttpRequest = origXhr
			globalThis.fetch = origFetch
		}
	})
})

describe('createFetchTransport', () => {
	let origFetch: typeof globalThis.fetch

	function installFetchStub(): void {
		origFetch = globalThis.fetch
		globalThis.fetch = async () => new Response('', { status: 200 })
	}

	function restoreFetchStub(): void {
		globalThis.fetch = origFetch
	}

	it('captures a fetch request with CMCD query parameter', async () => {
		installFetchStub()
		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [createFetchTransport()] })

			await fetch('https://e.com/seg.m4s?CMCD=sid%3D%22abc%22')

			const captured = recorder.getReports(CmcdRequestType.SEGMENT)
			equal(captured.length, 1)
			equal(captured[0].reportingMode, 'query')
			equal(captured[0].request.url, 'https://e.com/seg.m4s?CMCD=sid%3D%22abc%22')
			recorder.detach()
		} finally {
			restoreFetchStub()
		}
	})

	it('captures a fetch request with CMCD-* headers and lowercases header names', async () => {
		installFetchStub()
		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [createFetchTransport()] })

			await fetch('https://e.com/seg.m4s', {
				headers: { 'CMCD-Request': 'sid="abc"' },
			})

			const captured = recorder.getReports(CmcdRequestType.SEGMENT)
			equal(captured.length, 1)
			equal(captured[0].reportingMode, 'header')
			equal(captured[0].request.headers?.['cmcd-request'], 'sid="abc"')
			recorder.detach()
		} finally {
			restoreFetchStub()
		}
	})

	it('normalizes a POST body to a string', async () => {
		installFetchStub()
		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({
				transports: [createFetchTransport()],
				eventTargetUrls: ['https://events.example.com'],
			})

			await fetch('https://events.example.com/cmcd', {
				method: 'POST',
				body: 'sid="abc",ts=1234',
			})

			const captured = recorder.getReports(CmcdRequestType.EVENT)
			equal(captured.length, 1)
			equal(captured[0].request.body, 'sid="abc",ts=1234')
			recorder.detach()
		} finally {
			restoreFetchStub()
		}
	})

	it('detach restores the original fetch reference', () => {
		installFetchStub()
		try {
			const beforeAttach = globalThis.fetch
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [createFetchTransport()] })
			ok(globalThis.fetch !== beforeAttach, 'fetch should have been wrapped')
			recorder.detach()
			equal(globalThis.fetch, beforeAttach, 'fetch should be restored')
		} finally {
			restoreFetchStub()
		}
	})

	it('returns a synthetic 204 when URL matches eventTargetUrls and does not call the underlying fetch', async () => {
		let underlyingCalls = 0
		const origFetch = globalThis.fetch
		globalThis.fetch = async () => { underlyingCalls += 1; return new Response('', { status: 200 }) }

		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({
				transports: [createFetchTransport()],
				eventTargetUrls: ['https://events.example.com'],
			})

			const response = await fetch('https://events.example.com/cmcd', {
				method: 'POST',
				body: 'sid="abc"',
			})

			equal(response.status, 204)
			equal(underlyingCalls, 0, 'underlying fetch should not have been invoked')
			equal(recorder.getReports(CmcdRequestType.EVENT).length, 1)
			recorder.detach()
		} finally {
			globalThis.fetch = origFetch
		}
	})

	it('forwards a Request input with its body intact to the underlying fetch', async () => {
		const seen: { url: string; body: string }[] = []
		const origFetch = globalThis.fetch
		globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
			const req = input instanceof Request ? input : new Request(input)
			seen.push({ url: req.url, body: await req.text() })
			return new Response('', { status: 200 })
		}

		try {
			const recorder = new CmcdReportRecorder()
			recorder.attach({ transports: [createFetchTransport()] })

			const req = new Request('https://e.com/seg.m4s?CMCD=sid%3D%22abc%22', {
				method: 'POST',
				body: 'payload',
			})
			await fetch(req)

			equal(seen.length, 1, 'underlying fetch received the call')
			equal(seen[0].body, 'payload', 'body reached underlying fetch unconsumed')
			const captured = recorder.getReports(CmcdRequestType.EVENT)
			equal(captured.length, 1, 'recorder captured the request')
			equal(captured[0].request.body, 'payload', 'recorder also saw the body')
			recorder.detach()
		} finally {
			globalThis.fetch = origFetch
		}
	})
})
