import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { extractCmcd } from '../src/extract.ts'

describe('extractCmcd', () => {
	// #region example
	it('should extract CMCD data from query parameters', () => {
		const url = new URL('http://localhost:3000/proxy/video.mp4?CMCD=br%3D1000%2Csid%3D%22abc-123%22')
		const headers = new Headers()

		const result = extractCmcd(url, headers)

		assert.ok(result)
		assert.equal(result.source, 'query')
		assert.equal(result.sessionId, 'abc-123')
		assert.equal(result.data.br, 1000)
		assert.equal(result.data.sid, 'abc-123')
	})
	// #endregion example

	it('should extract CMCD data from headers', () => {
		const url = new URL('http://localhost:3000/proxy/video.mp4')
		const headers = new Headers({
			'CMCD-Session': 'sid="def-456"',
			'CMCD-Object': 'br=2000',
		})

		const result = extractCmcd(url, headers)

		assert.ok(result)
		assert.equal(result.source, 'headers')
		assert.equal(result.sessionId, 'def-456')
		assert.equal(result.data.br, 2000)
		assert.equal(result.data.sid, 'def-456')
	})

	it('should return null when no CMCD data is present', () => {
		const url = new URL('http://localhost:3000/proxy/video.mp4')
		const headers = new Headers()

		const result = extractCmcd(url, headers)
		assert.equal(result, null)
	})

	it('should prefer query parameters over headers', () => {
		const url = new URL('http://localhost:3000/proxy/video.mp4?CMCD=br%3D1000%2Csid%3D%22query-sid%22')
		const headers = new Headers({
			'CMCD-Session': 'sid="header-sid"',
		})

		const result = extractCmcd(url, headers)

		assert.ok(result)
		assert.equal(result.source, 'query')
		assert.equal(result.sessionId, 'query-sid')
	})

	it('should handle CMCD data without a session ID', () => {
		const url = new URL('http://localhost:3000/proxy/video.mp4?CMCD=br%3D1000')
		const headers = new Headers()

		const result = extractCmcd(url, headers)

		assert.ok(result)
		assert.equal(result.sessionId, undefined)
		assert.equal(result.data.br, 1000)
	})
})
