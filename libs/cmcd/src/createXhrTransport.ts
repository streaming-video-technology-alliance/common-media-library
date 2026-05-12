import type { HttpRequest } from '@svta/cml-utils'
import type { CmcdRequestDeliver, CmcdTransportAdapter } from './CmcdTransportAdapter.ts'

type XhrInstance = XMLHttpRequest & {
	_cmcdMethod?: string;
	_cmcdUrl?: string;
	_cmcdHeaders?: Record<string, string>;
}

async function completeXhrWith(xhr: XhrInstance, response: Response): Promise<void> {
	const text = await response.clone().text().catch(() => '')
	const ProgressEventCtor: typeof ProgressEvent | typeof Event =
		typeof ProgressEvent !== 'undefined' ? ProgressEvent : Event

	queueMicrotask(() => {
		try {
			Object.defineProperty(xhr, 'status', { value: response.status, configurable: true })
			Object.defineProperty(xhr, 'statusText', { value: response.statusText, configurable: true })
			Object.defineProperty(xhr, 'readyState', { value: 4, configurable: true })
			Object.defineProperty(xhr, 'responseURL', { value: xhr._cmcdUrl ?? '', configurable: true })
			Object.defineProperty(xhr, 'response', { value: text, configurable: true })
			Object.defineProperty(xhr, 'responseText', { value: text, configurable: true })

			if (typeof xhr.onload === 'function') {
				xhr.onload.call(xhr, new ProgressEventCtor('load') as ProgressEvent<EventTarget>)
			}
			if (typeof xhr.onloadend === 'function') {
				xhr.onloadend.call(xhr, new ProgressEventCtor('loadend') as ProgressEvent<EventTarget>)
			}
		} catch {
			// MockXhr may not allow defineProperty on some properties;
			// for shim simplicity we set them directly as a fallback.
			const target = xhr as unknown as Record<string, unknown>
			target['status'] = response.status
			target['statusText'] = response.statusText
			target['readyState'] = 4
			target['responseURL'] = xhr._cmcdUrl ?? ''
			target['response'] = text
			target['responseText'] = text
			if (typeof xhr.onload === 'function') {
				xhr.onload.call(xhr as unknown as XMLHttpRequest, new ProgressEventCtor('load') as ProgressEvent<EventTarget>)
			}
			if (typeof xhr.onloadend === 'function') {
				xhr.onloadend.call(xhr as unknown as XMLHttpRequest, new ProgressEventCtor('loadend') as ProgressEvent<EventTarget>)
			}
		}
	})
}

/**
 * Create a transport adapter that patches `XMLHttpRequest.prototype` to
 * capture CMCD-bearing requests. Returns the adapter object expected by
 * `CmcdRequestCollector`.
 *
 * @example
 * {@includeCode ../test/CmcdRequestCollector.test.ts#example-xhr}
 *
 * @public
 */
export function createXhrTransport(): CmcdTransportAdapter {
	return {
		attach(deliver: CmcdRequestDeliver): () => void {
			const Xhr = globalThis.XMLHttpRequest
			const origOpen = Xhr.prototype.open
			const origSetRequestHeader = Xhr.prototype.setRequestHeader
			const origSend = Xhr.prototype.send

			Xhr.prototype.open = function (this: XhrInstance, method: string, url: string | URL): void {
				this._cmcdMethod = method
				this._cmcdUrl = typeof url === 'string' ? url : url.toString()
				this._cmcdHeaders = {}
				// eslint-disable-next-line prefer-rest-params
				return origOpen.apply(this, arguments as unknown as Parameters<typeof origOpen>)
			}

			Xhr.prototype.setRequestHeader = function (this: XhrInstance, name: string, value: string): void {
				if (this._cmcdHeaders) {
					this._cmcdHeaders[name.toLowerCase()] = value
				}
				return origSetRequestHeader.apply(this, [name, value])
			}

			Xhr.prototype.send = function (this: XhrInstance, body?: Document | XMLHttpRequestBodyInit | null): void {
				const httpRequest: HttpRequest = {
					url: this._cmcdUrl ?? '',
					method: (this._cmcdMethod ?? 'GET').toUpperCase(),
					headers: this._cmcdHeaders ?? {},
					body: (typeof Document !== 'undefined' && body instanceof Document ? undefined : body as BodyInit | null | undefined) ?? undefined,
				}

				const synthetic = deliver(httpRequest)

				if (synthetic) {
					completeXhrWith(this, synthetic)
					return
				}

				return origSend.apply(this, [body])
			}

			return () => {
				Xhr.prototype.open = origOpen
				Xhr.prototype.setRequestHeader = origSetRequestHeader
				Xhr.prototype.send = origSend
			}
		},
	}
}
