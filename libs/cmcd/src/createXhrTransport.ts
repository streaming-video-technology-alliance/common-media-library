import type { HttpRequest } from '@svta/cml-utils'
import type { CmcdRequestDeliver, CmcdTransportAdapter } from './CmcdTransportAdapter.ts'

type XhrInstance = XMLHttpRequest & {
	_cmcdMethod?: string;
	_cmcdUrl?: string;
	_cmcdHeaders?: Record<string, string>;
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
					body: body ?? undefined,
				}

				deliver(httpRequest)

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
