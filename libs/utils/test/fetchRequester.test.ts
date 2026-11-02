import type { HttpRequester } from '@svta/cml-utils'
import { fetchRequester } from '@svta/cml-utils'
import { deepEqual, equal, rejects } from 'node:assert'
import { afterEach, describe, it, vi } from 'vite-plus/test'

function fakeResponse(body: string | null, init: ResponseInit, url: string): Response {
	const response = new Response(body, init)

	Object.defineProperty(response, 'url', { value: url })

	return response
}

describe('fetchRequester', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('resolves with the status, the final URL, the headers, and the text of the response', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			fakeResponse(
				'{"VERSION":1}',
				{ status: 200, headers: { 'Content-Type': 'application/json', 'Retry-After': '30' } },
				'https://steering.example.com/final.json',
			),
		)

		//#region example
		const response = await fetchRequester({ url: 'https://steering.example.com/manifest.json' })

		equal(response.status, 200)
		equal(response.url, 'https://steering.example.com/final.json')
		equal(response.headers?.['retry-after'], '30')
		equal(response.data, '{"VERSION":1}')
		//#endregion example
		equal(response.request.url, 'https://steering.example.com/manifest.json')
		deepEqual(response.headers, { 'content-type': 'application/json', 'retry-after': '30' })
	})

	it('passes the method, the headers, the body, the credentials, and the mode to fetch', async () => {
		const fetchMock = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(fakeResponse(null, { status: 204 }, 'https://collector.example.com/cmcd'))
		const request = {
			url: 'https://collector.example.com/cmcd',
			method: 'POST',
			headers: { 'Content-Type': 'text/plain' },
			body: 'sid="a",sn=0',
			credentials: 'include' as const,
			mode: 'cors' as const,
			responseType: 'text' as const,
			timeout: 5000,
			customData: { ignored: true },
		}

		const response = await fetchRequester(request)

		deepEqual(fetchMock.mock.calls, [
			[
				'https://collector.example.com/cmcd',
				{
					method: 'POST',
					headers: { 'Content-Type': 'text/plain' },
					body: 'sid="a",sn=0',
					credentials: 'include',
					mode: 'cors',
				},
			],
		])
		equal(response.status, 204)
		equal(response.data, '')
		equal(response.request, request)
	})

	it('keeps a response header named __proto__', async () => {
		const headers = new Headers({ 'Retry-After': '30' })

		headers.append('__proto__', 'x')
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			fakeResponse(null, { status: 200, headers }, 'https://collector.example.com/cmcd'),
		)

		const response = await fetchRequester({ url: 'https://collector.example.com/cmcd' })

		deepEqual(Object.entries(response.headers ?? {}).sort(), [
			['__proto__', 'x'],
			['retry-after', '30'],
		])
	})

	it('rejects when the response body cannot be read', async () => {
		const cause = new Error('aborted')
		vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			url: '',
			status: 200,
			headers: new Headers(),
			text: () => Promise.reject(cause),
		} as Response)

		await rejects(
			fetchRequester({ url: 'https://collector.example.com/cmcd' }),
			error => error === cause,
		)
	})

	it('rejects when fetch rejects', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

		await fetchRequester({ url: 'https://collector.example.com/cmcd' }).then(
			() => {
				throw new Error('resolved')
			},
			(error: unknown) => {
				equal((error as Error).message, 'Failed to fetch')
			},
		)
	})

	it('is an HttpRequester', () => {
		const requester: HttpRequester = fetchRequester

		equal(typeof requester, 'function')
	})
})
