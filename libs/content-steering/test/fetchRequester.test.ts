import {
	createSteeringEngine,
	fetchRequester,
	SteeringErrorType,
	type SteeringError,
} from '@svta/cml-content-steering'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, rejects } from 'node:assert'
import { describe, it, vi } from 'vite-plus/test'

const MANIFEST = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }

const REQUEST: HttpRequest = {
	url: 'https://steering.example.com/manifest.json',
	method: 'GET',
	responseType: 'text',
}

type RequestError = Exclude<SteeringError, { type: typeof SteeringErrorType.CALLBACK }>

function stubFetch(response: Response) {
	return vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)
}

describe('fetchRequester', () => {
	it('provides a valid example', async () => {
		stubFetch(new Response(JSON.stringify(MANIFEST), { status: 200 }))

		//#region example
		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: 'https://steering.example.com/manifest.json',
			pathways: ['CDN-A', 'CDN-B'],
			pathway: 'CDN-A',
			requester: fetchRequester,
		})
		//#endregion example

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})

	it('passes the request fields to fetch and returns the response text and headers', async () => {
		const fetchMock = stubFetch(
			new Response('{}', {
				status: 200,
				headers: { 'Content-Type': 'application/json', 'Retry-After': '5' },
			}),
		)
		const request: HttpRequest = {
			...REQUEST,
			headers: { Accept: 'application/json' },
			credentials: 'include',
			mode: 'cors',
		}

		const response = await fetchRequester(request)

		deepEqual(fetchMock.mock.calls[0], [
			REQUEST.url,
			{
				method: 'GET',
				headers: { Accept: 'application/json' },
				credentials: 'include',
				mode: 'cors',
			},
		])
		equal(response.request, request)
		equal(response.status, 200)
		equal(response.data, '{}')
		deepEqual(response.headers, { 'content-type': 'application/json', 'retry-after': '5' })
	})

	it('returns the URL of the response', async () => {
		const final = 'https://cdn.example.com/steering/final.json'
		stubFetch({
			url: final,
			status: 200,
			headers: new Headers(),
			text: () => Promise.resolve('{}'),
		} as Response)

		const response = await fetchRequester(REQUEST)

		equal(response.url, final)
	})

	it('passes a 429 response with Retry-After to the engine', async () => {
		stubFetch(new Response(null, { status: 429, headers: { 'Retry-After': '120' } }))
		const errors: RequestError[] = []
		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: REQUEST.url,
			pathways: ['CDN-A', 'CDN-B'],
			pathway: 'CDN-A',
			requester: fetchRequester,
			onError: error => {
				if (error.type !== SteeringErrorType.CALLBACK) {
					errors.push(error)
				}
			},
		})

		await engine.start()
		engine.stop()

		equal(errors.length, 1)
		equal(errors[0].type, SteeringErrorType.LOAD)
		equal(errors[0].status, 429)
		equal(errors[0].retryDelay, 120000)
	})

	it('rejects when fetch rejects', async () => {
		const cause = new TypeError('offline')
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(cause)

		await rejects(fetchRequester(REQUEST), error => error === cause)
	})

	it('rejects when the response body cannot be read', async () => {
		const cause = new Error('aborted')
		stubFetch({
			url: '',
			status: 200,
			headers: new Headers(),
			text: () => Promise.reject(cause),
		} as Response)

		await rejects(fetchRequester(REQUEST), error => error === cause)
	})
})
