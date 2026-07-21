import type { CmcdKey } from '@svta/cml-cmcd'
import { isCmcdCustomKey } from '@svta/cml-cmcd'
import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'

describe('isCmcdCustomKey', () => {
	it('provides a valid example', () => {
		//#region example
		equal(isCmcdCustomKey('com.example-key'), true)
		equal(isCmcdCustomKey('br'), false)
		//#endregion example
	})

	it('Accepts hyphenated keys', () => {
		equal(isCmcdCustomKey('com.hello.world-foo'), true)
		equal(isCmcdCustomKey('a-b'), true)
		equal(isCmcdCustomKey('a--b'), true)
		equal(isCmcdCustomKey('--b'), true)
		equal(isCmcdCustomKey('a--'), true)
	})

	it('Rejects keys without an interior hyphen', () => {
		equal(isCmcdCustomKey('sid'), false)
		equal(isCmcdCustomKey('-'), false)
		equal(isCmcdCustomKey('-b'), false)
		equal(isCmcdCustomKey('a-'), false)
	})

	it('Rejects keys with invalid characters', () => {
		equal(isCmcdCustomKey('com.example-key!'), false)
		equal(isCmcdCustomKey('a b-c'), false)
		equal(isCmcdCustomKey('a_b-c'), false)
	})

	it('Runs in linear time on adversarial input', () => {
		const evil = ('-'.repeat(50_000) + '!') as CmcdKey
		const start = performance.now()
		equal(isCmcdCustomKey(evil), false)
		ok(performance.now() - start < 500, 'isCmcdCustomKey took too long')
	})
})
