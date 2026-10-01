import { SfItem } from '@svta/cml-structured-field-values'
import { deepEqual, equal, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { formatNor } from '../src/formatNor.ts'

const BASE_URL = 'https://a.test/x/seg1.m4s'

describe('formatNor', () => {
	it('converts each path relative to baseUrl', () => {
		deepEqual(formatNor(['https://a.test/x/seg2.m4s', 'https://b.test/seg3.m4s'], { version: 2, baseUrl: BASE_URL }), ['seg2.m4s', 'https://b.test/seg3.m4s'])
	})

	it('wraps one path in a list in version 2', () => {
		deepEqual(formatNor('seg2.m4s', { version: 2 }), ['seg2.m4s'])
	})

	it('keeps the parameters of an entry and of an inner list', () => {
		const value = formatNor(new SfItem([new SfItem('https://a.test/x/seg2.m4s', { r: '0-99' }), 'b.m4s'], { p: 2 }), { version: 2, baseUrl: BASE_URL })
		ok(value instanceof SfItem)
		deepEqual(value.params, { p: 2 })
		const [first, second] = value.value as unknown as SfItem[]
		equal(first.value, 'seg2.m4s')
		deepEqual(first.params, { r: '0-99' })
		equal(second.value, 'b.m4s')
	})

	it('encodes the path with encodeURIComponent in version 1', () => {
		equal(formatNor('../seg/3.m4v', { version: 1 }), '..%2Fseg%2F3.m4v')
		equal(formatNor('next%20seg.mp4', { version: 1 }), 'next%2520seg.mp4')
	})

	it('ignores a baseUrl that is not a valid URL', () => {
		deepEqual(formatNor(['https://a.test/x/seg2.m4s'], { version: 2, baseUrl: 'not a url' }), ['https://a.test/x/seg2.m4s'])
	})

	it('drops an entry that is not a non-empty string', () => {
		deepEqual(formatNor(['a.m4s', '', 5, null], { version: 2 }), ['a.m4s'])
		equal(formatNor([''], { version: 2 }), undefined)
		equal(formatNor('', { version: 1 }), undefined)
	})
})
