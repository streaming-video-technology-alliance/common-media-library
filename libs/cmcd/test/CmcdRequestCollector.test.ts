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
			// Both stubbed as UNKNOWN until Task 5; this test will be updated
			// once classification lands. For now, assert filter mechanics work:
			equal(collector.getRequests(CmcdRequestType.UNKNOWN).length, 2)
			equal(collector.getRequests(CmcdRequestType.SEGMENT).length, 0)
			collector.detach()
		})
	})
})
