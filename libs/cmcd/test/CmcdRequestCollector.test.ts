import type { CmcdTransportAdapter, CmcdRequestDeliver } from '@svta/cml-cmcd'
import { CmcdRequestCollector, CmcdRequestType } from '@svta/cml-cmcd'
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
})
