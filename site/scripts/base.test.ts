import { equal, throws } from 'node:assert/strict'
import { describe, it } from 'vite-plus/test'
import { siteBase } from './base.ts'

describe('siteBase', () => {
	it('defaults to the root', () => {
		equal(siteBase({}), '/')
	})

	it('returns a value with both slashes', () => {
		equal(siteBase({ SITE_BASE: '/common-media-library/' }), '/common-media-library/')
	})

	it('rejects a value without a trailing slash', () => {
		throws(() => siteBase({ SITE_BASE: '/common-media-library' }), /start and end with "\/"/)
	})

	it('rejects an empty value', () => {
		throws(() => siteBase({ SITE_BASE: '' }), /start and end with "\/"/)
	})
})
