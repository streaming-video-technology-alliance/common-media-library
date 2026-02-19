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
	})
})
