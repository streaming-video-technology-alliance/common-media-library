import type { CmcdTransportAdapter, CmcdRequestDeliver } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
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
	it('test scaffolding compiles', () => {
		// placeholder; real tests follow in later tasks
	})
})
