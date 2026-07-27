import { isCmsdCustomKey } from '@svta/cml-cmsd'
import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'

describe('isCmsdCustomKey', () => {
	it('provides a valid example', () => {
		//#region example
		equal(isCmsdCustomKey('com.example-key'), true)
		equal(isCmsdCustomKey('br'), false)
		//#endregion example
	})

	it('Accepts hyphenated keys', () => {
		equal(isCmsdCustomKey('com.hello.world-foo'), true)
		equal(isCmsdCustomKey('a-b'), true)
		equal(isCmsdCustomKey('a--b'), true)
		equal(isCmsdCustomKey('a1-b2'), true)
		equal(isCmsdCustomKey('a--'), true)
	})

	it('Rejects keys without an interior hyphen', () => {
		equal(isCmsdCustomKey('du'), false)
		equal(isCmsdCustomKey('-'), false)
		equal(isCmsdCustomKey('-b'), false)
		equal(isCmsdCustomKey('a-'), false)
	})

	it('Rejects keys that fail RFC 8941 key serialization', () => {
		equal(isCmsdCustomKey('Com.Example-key'), false)
		equal(isCmsdCustomKey('com.example-KEY'), false)
		equal(isCmsdCustomKey('2com.example-x'), false)
		equal(isCmsdCustomKey('.a-b'), false)
		equal(isCmsdCustomKey('--b'), false)
	})

	it('Rejects keys with invalid characters', () => {
		equal(isCmsdCustomKey('com.example-key!'), false)
		equal(isCmsdCustomKey('a b-c'), false)
		equal(isCmsdCustomKey('a_b-c'), false)
		equal(isCmsdCustomKey('*a-b'), false)
	})

	it('Runs in linear time on adversarial input', () => {
		const evil = '-'.repeat(50_000) + '!'
		const start = performance.now()
		equal(isCmsdCustomKey(evil), false)
		ok(performance.now() - start < 500, 'isCmsdCustomKey took too long')
	})
})
