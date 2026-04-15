import { CMCD_MIME_TYPE, validateCmcdEventReport } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'
import { deepStrictEqual, equal, ok } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateCmcdEventReport', () => {
	it('provides a valid example', () => {
		// #region example
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			method: 'POST',
			headers: {
				'Content-Type': 'application/cmcd',
			},
			body: `e=ps,sid="session-1",ts=1700000000000,sta=p,v=2
e=t,sid="session-1",ts=1700000001000,bl=(5000),v=2`,
		}

		const result = validateCmcdEventReport(request)
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
		// #endregion example
	})

	it('validates a valid HttpRequest', () => {
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			method: 'POST',
			headers: {
				'Content-Type': CMCD_MIME_TYPE,
			},
			body: 'e=ps,sid="session-1",ts=1700000000000,sta=p,v=2',
		}

		const result = validateCmcdEventReport(request)
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
	})

	it('reports error for non-POST method', () => {
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			method: 'GET',
			headers: {
				'Content-Type': CMCD_MIME_TYPE,
			},
			body: 'e=ps,sid="session-1",ts=1700000000000,sta=p,v=2',
		}

		const result = validateCmcdEventReport(request)
		equal(result.valid, false)
		ok(result.issues.some(i => i.message.includes('Invalid HTTP method')))
	})

	it('reports error for missing method (defaults to GET)', () => {
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			headers: {
				'Content-Type': CMCD_MIME_TYPE,
			},
			body: 'e=ps,sid="session-1",ts=1700000000000,sta=p,v=2',
		}

		const result = validateCmcdEventReport(request)
		equal(result.valid, false)
		ok(result.issues.some(i => i.message.includes('Invalid HTTP method')))
	})

	it('reports error for wrong Content-Type', () => {
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: 'e=ps,sid="session-1",ts=1700000000000,sta=p,v=2',
		}

		const result = validateCmcdEventReport(request)
		equal(result.valid, false)
		ok(result.issues.some(i => i.message.includes('Invalid Content-Type')))
	})

	it('reports error for missing Content-Type', () => {
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			method: 'POST',
			headers: {},
			body: 'e=ps,sid="session-1",ts=1700000000000,sta=p,v=2',
		}

		const result = validateCmcdEventReport(request)
		equal(result.valid, false)
		ok(result.issues.some(i => i.message.includes('Missing Content-Type')))
	})

	it('reports error for missing body', () => {
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			method: 'POST',
			headers: {
				'Content-Type': CMCD_MIME_TYPE,
			},
		}

		const result = validateCmcdEventReport(request)
		equal(result.valid, false)
		ok(result.issues.some(i => i.message.includes('Missing request body')))
	})

	it('accepts Content-Type with charset parameter', () => {
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			method: 'POST',
			headers: {
				'Content-Type': 'application/cmcd; charset=utf-8',
			},
			body: 'e=ps,sid="session-1",ts=1700000000000,sta=p,v=2',
		}

		const result = validateCmcdEventReport(request)
		equal(result.valid, true)
	})

	it('combines request validation errors with body validation errors', () => {
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			method: 'GET',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: 'br=3000,sid="abc",v=2', // Missing e and ts
		}

		const result = validateCmcdEventReport(request)
		equal(result.valid, false)
		ok(result.issues.some(i => i.message.includes('Invalid HTTP method')))
		ok(result.issues.some(i => i.message.includes('Invalid Content-Type')))
		ok(result.issues.some(i => i.key === 'e'))
		ok(result.issues.some(i => i.key === 'ts'))
	})

	it('returns decoded data from request body', () => {
		const request: HttpRequest = {
			url: 'https://analytics.example.com/cmcd',
			method: 'POST',
			headers: {
				'Content-Type': CMCD_MIME_TYPE,
			},
			body: `e=ps,sid="session-1",ts=1700000000000,sta=p,v=2
e=t,sid="session-1",ts=1700000001000,bl=(5000),v=2`,
		}

		const result = validateCmcdEventReport(request)
		equal(result.data.length, 2)

		const first = result.data[0] as Record<string, unknown>
		equal(first['e'], 'ps')
	})
})
