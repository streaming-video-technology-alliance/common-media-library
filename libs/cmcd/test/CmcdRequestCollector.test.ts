import type { CmcdTransportAdapter, CmcdRequestDeliver, CmcdCollectedRequest } from '@svta/cml-cmcd'
import { createFetchTransport, createXhrTransport, CmcdRequestCollector, CmcdRequestType } from '@svta/cml-cmcd'
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
 * Fake CmcdTransportAdapter for testing collector logic without patching
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

	/** Simulate an intercepted request and return whatever the collector decides. */
	simulate(request: HttpRequest): Response | undefined {
		return this.deliver(request)
	}
}

describe('CmcdRequestCollector', () => {
	describe('lifecycle', () => {
		it('starts empty', () => {
			const collector = new CmcdRequestCollector()
			deepEqual(collector.getRequests(), [])
		})

		it('attach() calls each supplied transport adapter', () => {
			const t1 = new FakeTransport()
			const t2 = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t1, t2] })
			ok(t1.attached)
			ok(t2.attached)
			collector.detach()
		})

		it('detach() invokes the detach functions returned by each transport', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			collector.detach()
			ok(t.detached)
		})

		it('clear() empties the captured requests', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({
				url: 'https://example.com/seg.m4s?CMCD=sid%3D%22abc%22',
				method: 'GET',
				headers: {},
			})
			equal(collector.getRequests().length, 1)
			collector.clear()
			equal(collector.getRequests().length, 0)
			collector.detach()
		})

		it('getRequests() returns a defensive copy', () => {
			const collector = new CmcdRequestCollector()
			const a = collector.getRequests()
			const b = collector.getRequests()
			ok(a !== b)
		})

		it('getRequests(type) filters by classification', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.mpd?CMCD=x', method: 'GET', headers: {} })
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=x', method: 'GET', headers: {} })
			equal(collector.getRequests(CmcdRequestType.MANIFEST).length, 1)
			equal(collector.getRequests(CmcdRequestType.SEGMENT).length, 1)
			equal(collector.getRequests().length, 2)
			collector.detach()
		})

		it('attach() is a no-op when already attached', () => {
			const t1 = new FakeTransport()
			const t2 = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t1] })
			collector.attach({ transports: [t2] })
			ok(t1.attached)
			ok(!t2.attached, 't2 should not have been attached')
			collector.detach()
		})

		it('detach() rejects pending waitForRequests promises', async () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			const promise = collector.waitForRequests(CmcdRequestType.SEGMENT, 5, 60000)
			setTimeout(() => collector.detach(), 10)
			try {
				await promise
				ok(false, 'should have rejected')
			} catch (err) {
				ok((err as Error).message.includes('detached'))
			}
		})

		it('detach() resolves pending collectFor promises with whatever was collected', async () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			const promise = collector.collectFor(60000)
			setTimeout(() => collector.detach(), 10)
			const result = await promise
			equal(result.length, 1)
		})
	})

	describe('classification', () => {
		it('classifies a .m3u8 GET as manifest with reportingMode=query', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/index.m3u8?CMCD=sid%3D%22abc%22',
				method: 'GET',
				headers: {},
			})
			const captured = collector.getRequests()
			equal(captured.length, 1)
			equal(captured[0].type, CmcdRequestType.MANIFEST)
			equal(captured[0].reportingMode, 'query')
			collector.detach()
		})

		it('classifies a .mpd GET as manifest', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/index.mpd?CMCD=sid%3D%22abc%22',
				method: 'GET',
				headers: {},
			})
			equal(collector.getRequests()[0].type, CmcdRequestType.MANIFEST)
			collector.detach()
		})

		it('classifies a .m4s GET as segment with reportingMode=header when CMCD headers present', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/seg1.m4s',
				method: 'GET',
				headers: { 'cmcd-request': 'sid="abc"' },
			})
			const captured = collector.getRequests()
			equal(captured[0].type, CmcdRequestType.SEGMENT)
			equal(captured[0].reportingMode, 'header')
			collector.detach()
		})

		it('classifies POST as event regardless of URL extension', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({
				transports: [t],
				eventTargetUrls: ['https://events.example.com'],
			})
			t.simulate({
				url: 'https://events.example.com/cmcd',
				method: 'POST',
				headers: {},
				body: 'sid="abc",ts=1234',
			})
			const captured = collector.getRequests()
			equal(captured[0].type, CmcdRequestType.EVENT)
			equal(captured[0].reportingMode, 'event')
			collector.detach()
		})

		it('does not capture requests that carry no CMCD data', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/seg1.m4s',
				method: 'GET',
				headers: { 'content-type': 'video/mp4' },
			})
			equal(collector.getRequests().length, 0)
			collector.detach()
		})

		it('captures unknown-type URLs that carry CMCD query', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({
				url: 'https://e.com/something?CMCD=sid%3D%22abc%22',
				method: 'GET',
				headers: {},
			})
			const captured = collector.getRequests()
			equal(captured.length, 1)
			equal(captured[0].type, CmcdRequestType.UNKNOWN)
			equal(captured[0].reportingMode, 'query')
			collector.detach()
		})
	})

	describe('collectFor', () => {
		it('resolves after the timeout with whatever was collected', async () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			setTimeout(() => {
				t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			}, 10)
			const result = await collector.collectFor(50)
			equal(result.length, 1)
			collector.detach()
		})

		it('resolves with zero when nothing matches', async () => {
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [new FakeTransport()] })
			const result = await collector.collectFor(50, CmcdRequestType.EVENT)
			equal(result.length, 0)
			collector.detach()
		})

		it('filters by type', async () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.mpd?CMCD=x', method: 'GET', headers: {} })
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=x', method: 'GET', headers: {} })
			const result = await collector.collectFor(50, CmcdRequestType.SEGMENT)
			equal(result.length, 1)
			equal(result[0].type, CmcdRequestType.SEGMENT)
			collector.detach()
		})
	})

	describe('event-target stubbing', () => {
		it('returns a 204 Response from deliver when URL matches', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({
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
			equal(collector.getRequests(CmcdRequestType.EVENT).length, 1)
			collector.detach()
		})

		it('returns undefined for non-event-target requests', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({
				transports: [t],
				eventTargetUrls: ['https://events.example.com'],
			})
			const response = t.simulate({
				url: 'https://e.com/seg.m4s?CMCD=x',
				method: 'GET',
				headers: {},
			})
			equal(response, undefined)
			collector.detach()
		})

		it('does not stub POSTs that do not match eventTargetUrls', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({
				transports: [t],
				eventTargetUrls: ['https://events.example.com'],
			})
			const response = t.simulate({
				url: 'https://other.com/somewhere',
				method: 'POST',
				headers: { 'cmcd-request': 'sid="abc"' },
				body: 'data',
			})
			// Request carries CMCD data so it IS captured, but URL doesn't
			// match the stub list — must NOT return a synthetic Response.
			equal(response, undefined)
			equal(collector.getRequests().length, 1)
			collector.detach()
		})
	})

	describe('waitForRequests', () => {
		it('resolves immediately when count already met', async () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=sid%3D%22abc%22', method: 'GET', headers: {} })
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=sid%3D%22abc%22', method: 'GET', headers: {} })
			const result = await collector.waitForRequests(CmcdRequestType.SEGMENT, 2, 1000)
			equal(result.length, 2)
			collector.detach()
		})

		it('resolves when threshold is reached after the call', async () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			const promise = collector.waitForRequests(CmcdRequestType.SEGMENT, 2, 1000)
			setTimeout(() => {
				t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
				t.simulate({ url: 'https://e.com/b.m4s?CMCD=x', method: 'GET', headers: {} })
			}, 10)
			const result = await promise
			equal(result.length, 2)
			collector.detach()
		})

		it('rejects with a diagnostic error on timeout', async () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			t.simulate({ url: 'https://e.com/a.m4s?CMCD=x', method: 'GET', headers: {} })
			try {
				await collector.waitForRequests(CmcdRequestType.SEGMENT, 3, 50)
				ok(false, 'should have rejected')
			} catch (err) {
				const e = err as Error
				ok(e.message.includes('Timeout'))
				ok(e.message.includes('3'))
				ok(e.message.includes('segment'))
				ok(e.message.includes('Got 1'))
			}
			collector.detach()
		})

		it('waits across any type when type is undefined', async () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [t] })
			const promise = collector.waitForRequests(undefined, 2, 1000)
			t.simulate({ url: 'https://e.com/a.mpd?CMCD=x', method: 'GET', headers: {} })
			t.simulate({ url: 'https://e.com/b.m4s?CMCD=x', method: 'GET', headers: {} })
			const result = await promise
			equal(result.length, 2)
			collector.detach()
		})
	})

	describe('onReport', () => {
		it('fires once per captured request, in capture order', () => {
			const t = new FakeTransport()
			const collector = new CmcdRequestCollector()
			const calls: CmcdCollectedRequest[] = []
			collector.attach({
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
			collector.detach()
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
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [createXhrTransport()] })

			const xhr = new MockXhr()
			xhr.open('GET', 'https://e.com/seg.m4s')
			xhr.setRequestHeader('CMCD-Request', 'sid="abc"')
			xhr.send()

			const captured = collector.getRequests(CmcdRequestType.SEGMENT)
			equal(captured.length, 1)
			equal(captured[0].reportingMode, 'header')
			equal(captured[0].request.url, 'https://e.com/seg.m4s')
			equal(captured[0].request.method, 'GET')
			equal(captured[0].request.headers?.['cmcd-request'], 'sid="abc"')
			collector.detach()
		} finally {
			restoreXhrShim()
		}
	})

	it('captures an XHR request with CMCD query parameter', () => {
		installXhrShim()
		try {
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [createXhrTransport()] })

			const xhr = new MockXhr()
			xhr.open('GET', 'https://e.com/seg.m4s?CMCD=sid%3D%22abc%22')
			xhr.send()

			const captured = collector.getRequests(CmcdRequestType.SEGMENT)
			equal(captured.length, 1)
			equal(captured[0].reportingMode, 'query')
			collector.detach()
		} finally {
			restoreXhrShim()
		}
	})

	it('detach restores the original XHR prototype methods', () => {
		installXhrShim()
		try {
			const origOpen = MockXhr.prototype.open
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [createXhrTransport()] })
			ok(MockXhr.prototype.open !== origOpen, 'open should have been patched')
			collector.detach()
			equal(MockXhr.prototype.open, origOpen, 'open should be restored')
		} finally {
			restoreXhrShim()
		}
	})

	it('does not capture non-CMCD XHR requests', () => {
		installXhrShim()
		try {
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [createXhrTransport()] })

			const xhr = new MockXhr()
			xhr.open('GET', 'https://e.com/seg.m4s')
			xhr.send()

			equal(collector.getRequests().length, 0)
			collector.detach()
		} finally {
			restoreXhrShim()
		}
	})

	it('completes the XHR with synthetic 204 when URL matches eventTargetUrls', async () => {
		installXhrShim()
		try {
			const collector = new CmcdRequestCollector()
			collector.attach({
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
			equal(collector.getRequests(CmcdRequestType.EVENT).length, 1)
			collector.detach()
		} finally {
			restoreXhrShim()
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
			const collector = new CmcdRequestCollector()
			collector.attach()

			const xhr = new MockXhr()
			xhr.open('GET', 'https://e.com/a.m4s?CMCD=sid%3D%22x%22')
			xhr.send()

			await fetch('https://e.com/b.m4s?CMCD=sid%3D%22y%22')

			equal(collector.getRequests(CmcdRequestType.SEGMENT).length, 2)
			collector.detach()
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
			const collector = new CmcdRequestCollector()
			collector.attach({ eventTargetUrls: ['https://events.example.com'] })

			// ... player runs, emits CMCD requests ...
			await fetch('https://cdn.example.com/seg1.m4s?CMCD=sid%3D%22abc%22')
			await fetch('https://cdn.example.com/seg2.m4s?CMCD=sid%3D%22abc%22')

			const segments = collector.getRequests(CmcdRequestType.SEGMENT)
			equal(segments.length, 2)

			collector.detach()
			//#endregion example
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
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [createFetchTransport()] })

			await fetch('https://e.com/seg.m4s?CMCD=sid%3D%22abc%22')

			const captured = collector.getRequests(CmcdRequestType.SEGMENT)
			equal(captured.length, 1)
			equal(captured[0].reportingMode, 'query')
			equal(captured[0].request.url, 'https://e.com/seg.m4s?CMCD=sid%3D%22abc%22')
			collector.detach()
		} finally {
			restoreFetchStub()
		}
	})

	it('captures a fetch request with CMCD-* headers and lowercases header names', async () => {
		installFetchStub()
		try {
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [createFetchTransport()] })

			await fetch('https://e.com/seg.m4s', {
				headers: { 'CMCD-Request': 'sid="abc"' },
			})

			const captured = collector.getRequests(CmcdRequestType.SEGMENT)
			equal(captured.length, 1)
			equal(captured[0].reportingMode, 'header')
			equal(captured[0].request.headers?.['cmcd-request'], 'sid="abc"')
			collector.detach()
		} finally {
			restoreFetchStub()
		}
	})

	it('normalizes a POST body to a string', async () => {
		installFetchStub()
		try {
			const collector = new CmcdRequestCollector()
			collector.attach({
				transports: [createFetchTransport()],
				eventTargetUrls: ['https://events.example.com'],
			})

			await fetch('https://events.example.com/cmcd', {
				method: 'POST',
				body: 'sid="abc",ts=1234',
			})

			const captured = collector.getRequests(CmcdRequestType.EVENT)
			equal(captured.length, 1)
			equal(captured[0].request.body, 'sid="abc",ts=1234')
			collector.detach()
		} finally {
			restoreFetchStub()
		}
	})

	it('detach restores the original fetch reference', () => {
		installFetchStub()
		try {
			const beforeAttach = globalThis.fetch
			const collector = new CmcdRequestCollector()
			collector.attach({ transports: [createFetchTransport()] })
			ok(globalThis.fetch !== beforeAttach, 'fetch should have been wrapped')
			collector.detach()
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
			const collector = new CmcdRequestCollector()
			collector.attach({
				transports: [createFetchTransport()],
				eventTargetUrls: ['https://events.example.com'],
			})

			const response = await fetch('https://events.example.com/cmcd', {
				method: 'POST',
				body: 'sid="abc"',
			})

			equal(response.status, 204)
			equal(underlyingCalls, 0, 'underlying fetch should not have been invoked')
			equal(collector.getRequests(CmcdRequestType.EVENT).length, 1)
			collector.detach()
		} finally {
			globalThis.fetch = origFetch
		}
	})
})
