import { getBaseUrl } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('getBaseUrl', () => {
	it('returns the base URL from a string URL', () => {
		//#region example
		const baseUrl = getBaseUrl('https://example.com/path/to/file.mp4')
		equal(baseUrl, 'https://example.com/path/to/')
		//#endregion example
	})

	it('returns the base URL from a URL object', () => {
		equal(getBaseUrl(new URL('https://example.com/path/to/file.mp4')), 'https://example.com/path/to/')
	})

	it('returns origin with trailing slash when file is at root', () => {
		equal(getBaseUrl('https://example.com/file.mp4'), 'https://example.com/')
	})

	it('returns origin with trailing slash when pathname is just a slash', () => {
		equal(getBaseUrl('https://example.com/'), 'https://example.com/')
	})

	it('strips query parameters', () => {
		equal(getBaseUrl('https://example.com/path/to/file.mp4?param=foo&another=bar'), 'https://example.com/path/to/')
	})

	it('strips hash', () => {
		equal(getBaseUrl('https://example.com/path/to/file.mp4#hash=baz'), 'https://example.com/path/to/')
	})

	it('handles deeply nested paths', () => {
		equal(getBaseUrl('https://example.com/a/b/c/d/e/file.mp4'), 'https://example.com/a/b/c/d/e/')
	})

	it('handles paths with trailing slash', () => {
		equal(getBaseUrl('https://example.com/a/b/c/d/e/'), 'https://example.com/a/b/c/d/e/')
	})

	it('preserves non-default port in origin', () => {
		equal(getBaseUrl('https://example.com:8080/path/to/file.mp4'), 'https://example.com:8080/path/to/')
	})
})
