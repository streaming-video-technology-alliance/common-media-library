import { validateCmcdRequest } from '@svta/cml-cmcd'
import { deepStrictEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateCmcdRequest', () => {
	it('provides a valid example', () => {
		// #region example
		const request = new Request('https://cdn.example.com/seg.mp4', {
			headers: {
				'CMCD-Object': 'br=3000,d=4004',
				'CMCD-Request': 'bl=21600',
			},
		})

		const result = validateCmcdRequest(request)
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
		// #endregion example
	})

	describe('Request input', () => {
		it('validates CMCD from headers', () => {
			const request = new Request('https://cdn.example.com/seg.mp4', {
				headers: {
					'CMCD-Object': 'br=3000,d=4004,ot=v',
					'CMCD-Request': 'bl=21600',
					'CMCD-Session': 'sid="abc"',
				},
			})
			const result = validateCmcdRequest(request)
			equal(result.valid, true)
		})

		it('detects shard placement errors from headers', () => {
			const request = new Request('https://cdn.example.com/seg.mp4', {
				headers: {
					'CMCD-Object': 'bl=21600',
				},
			})
			const result = validateCmcdRequest(request)
			equal(result.valid, false)
			equal(result.issues.some(i => i.key === 'bl'), true)
		})

		it('falls back to query parameter when no CMCD headers present', () => {
			const request = new Request('https://cdn.example.com/seg.mp4?CMCD=br%3D3000%2Cbl%3D21600')
			const result = validateCmcdRequest(request)
			equal(result.valid, true)
		})

		it('reports errors from query parameter data', () => {
			const request = new Request('https://cdn.example.com/seg.mp4?CMCD=br%3D3000%2Ce%3Dps')
			const result = validateCmcdRequest(request)
			equal(result.valid, false)
			equal(result.issues.some(i => i.key === 'e'), true)
		})

		it('forwards the version option with Request input', () => {
			const request = new Request('https://cdn.example.com/seg.mp4', {
				headers: {
					'CMCD-Session': 'v=2,sid="abc"',
					'CMCD-Status': 'bs',
				},
			})
			const result = validateCmcdRequest(request, { version: 2 })
			equal(result.valid, true)
		})
	})

	describe('HttpRequest input', () => {
		it('validates CMCD from headers', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4',
				headers: {
					'CMCD-Object': 'br=3000,d=4004,ot=v',
					'CMCD-Request': 'bl=21600',
					'CMCD-Session': 'sid="abc"',
				},
			})
			equal(result.valid, true)
		})

		it('detects shard placement errors from headers', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4',
				headers: {
					'CMCD-Object': 'bl=21600',
				},
			})
			equal(result.valid, false)
			equal(result.issues.some(i => i.key === 'bl'), true)
		})

		it('falls back to query parameter when no CMCD headers present', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4?CMCD=br%3D3000%2Cbl%3D21600',
			})
			equal(result.valid, true)
		})

		it('falls back to query parameter when headers lack CMCD fields', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4?CMCD=br%3D3000%2Cbl%3D21600',
				headers: { 'Content-Type': 'video/mp4' },
			})
			equal(result.valid, true)
		})

		it('reports errors from query parameter data', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4?CMCD=br%3D3000%2Ce%3Dps',
			})
			equal(result.valid, false)
			equal(result.issues.some(i => i.key === 'e'), true)
		})

		it('forwards the version option with HttpRequest input', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4',
				headers: {
					'CMCD-Session': 'v=2,sid="abc"',
					'CMCD-Status': 'bs',
				},
			}, { version: 2 })
			equal(result.valid, true)
		})

		it('handles lowercase header names', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4',
				headers: {
					'cmcd-object': 'br=3000,d=4004',
					'cmcd-request': 'bl=21600',
				},
			})
			equal(result.valid, true)
		})
	})

	describe('both transmission modes', () => {
		const message = 'CMCD data found in both request headers and the "CMCD" query parameter. A request must use only one transmission mode.'

		it('reports error for a Request with CMCD headers and a CMCD query parameter', () => {
			const request = new Request('https://cdn.example.com/seg.mp4?CMCD=br%3D5000', {
				headers: {
					'CMCD-Object': 'br=3000,d=4004',
				},
			})
			const result = validateCmcdRequest(request)
			equal(result.valid, false)
			equal(result.issues.some(i => i.severity === 'error' && i.message === message), true)
		})

		it('reports error for an HttpRequest with CMCD headers and a CMCD query parameter', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4?CMCD=br%3D5000',
				headers: {
					'CMCD-Object': 'br=3000,d=4004',
				},
			})
			equal(result.valid, false)
			equal(result.issues.some(i => i.severity === 'error' && i.message === message), true)
		})

		it('still validates the headers and returns their data', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4?CMCD=br%3D5000',
				headers: {
					'CMCD-Object': 'bl=21600',
				},
			})
			equal(result.issues.some(i => i.key === 'bl'), true)
			equal(result.data['bl'], 21600)
			equal('br' in result.data, false)
		})

		it('does not report the error when the query parameter is empty', () => {
			const result = validateCmcdRequest({
				url: 'https://cdn.example.com/seg.mp4?CMCD=',
				headers: {
					'CMCD-Object': 'br=3000,d=4004',
				},
			})
			equal(result.valid, true)
		})
	})

	describe('relative URLs', () => {
		it('validates headers on a relative URL', () => {
			const result = validateCmcdRequest({
				url: 'seg.mp4',
				headers: {
					'CMCD-Object': 'br=3000,d=4004',
				},
			})
			equal(result.valid, true)
		})

		it('validates the query parameter on a relative URL', () => {
			const result = validateCmcdRequest({
				url: 'seg.mp4?CMCD=br%3D3000%2Cbl%3D21600#t=10',
			})
			equal(result.valid, true)
			equal(result.data['bl'], 21600)
		})
	})

	describe('URL fragments', () => {
		const url = 'https://cdn.example.com/seg.mp4#t=10?CMCD=br%3D5000'

		it('ignores a CMCD parameter inside the fragment when headers are present', () => {
			const result = validateCmcdRequest({
				url,
				headers: {
					'CMCD-Object': 'br=3000,d=4004',
				},
			})
			equal(result.valid, true)
			deepStrictEqual(result.issues, [])
			equal(result.data['br'], 3000)
		})

		it('ignores a CMCD parameter inside the fragment of a Request', () => {
			const request = new Request(url, {
				headers: {
					'CMCD-Object': 'br=3000,d=4004',
				},
			})
			equal(validateCmcdRequest(request).valid, true)
		})

		it('reports no CMCD data and names the fragment when the parameter is only in the fragment', () => {
			const result = validateCmcdRequest({ url })
			equal(result.valid, false)
			equal(result.issues.length, 1)
			equal(result.issues[0].message, 'No CMCD data found in request headers or query parameters. The URL fragment contains a "CMCD" parameter. A server never receives the fragment.')
			deepStrictEqual(result.data, {})
		})

		it('keeps the plain message when the fragment has no CMCD parameter', () => {
			const result = validateCmcdRequest({ url: 'https://cdn.example.com/seg.mp4#t=10' })
			equal(result.valid, false)
			equal(result.issues[0].message, 'No CMCD data found in request headers or query parameters.')
		})
	})

	it('returns decoded data from headers path', () => {
		const result = validateCmcdRequest({
			url: 'https://cdn.example.com/seg.mp4',
			headers: {
				'CMCD-Object': 'br=3000,d=4004',
				'CMCD-Request': 'bl=21600',
			},
		})
		equal(result.data['br'], 3000)
		equal(result.data['bl'], 21600)
	})

	it('returns decoded data from query path', () => {
		const result = validateCmcdRequest({
			url: 'https://cdn.example.com/seg.mp4?CMCD=br%3D3000%2Cbl%3D21600',
		})
		equal(result.data['br'], 3000)
		equal(result.data['bl'], 21600)
	})
})
