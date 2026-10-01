import type { CmcdFormatterOptions } from '@svta/cml-cmcd'
import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import { deepEqual, equal, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { CMCD_KEY_SPECS } from '../src/CMCD_KEY_SPECS.ts'
import type { CmcdKeySpec } from '../src/CmcdKeySpec.ts'
import { getKeySpec } from '../src/getKeySpec.ts'
import { normalizeValue } from '../src/normalizeValue.ts'

const V1: CmcdFormatterOptions = { version: 1, reportingMode: 'request' }
const V2: CmcdFormatterOptions = { version: 2, reportingMode: 'request' }
const CUSTOM = getKeySpec('com.example-x') as CmcdKeySpec

function spec(key: string): CmcdKeySpec {
	return CMCD_KEY_SPECS[key]
}

function tokenOf(value: unknown): string | undefined {
	return value instanceof SfToken ? value.description : undefined
}

describe('normalizeValue', () => {
	it('rounds a number to the step of the row', () => {
		equal(normalizeValue(1249.6, spec('d'), V2), 1250)
		equal(normalizeValue(1249.6, spec('dl'), V2), 1200)
		equal(normalizeValue(1249.6, spec('pr'), V2), 1249.6)
	})

	it('drops a value that does not match the type of its key', () => {
		equal(normalizeValue('4000', spec('d'), V2), undefined)
		equal(normalizeValue([4000], spec('d'), V2), undefined)
		equal(normalizeValue('yes', spec('bs'), V2), undefined)
		equal(normalizeValue(123, spec('sid'), V2), undefined)
		equal(normalizeValue(new SfToken('abc'), spec('sid'), V2), undefined)
		equal(normalizeValue(5, spec('ot'), V2), undefined)
	})

	it('keeps the parameters of an SfItem', () => {
		const value = normalizeValue(new SfItem(4000.4, { x: true }), spec('d'), V2)
		ok(value instanceof SfItem)
		equal(value.value, 4000)
		deepEqual(value.params, { x: true })
	})

	it('drops a string longer than the maximum of its key', () => {
		equal(normalizeValue('a'.repeat(64), spec('sid'), V2), 'a'.repeat(64))
		equal(normalizeValue('a'.repeat(65), spec('sid'), V2), undefined)
		equal(normalizeValue('', spec('sid'), V2), undefined)
	})

	it('applies the version 1 length of cid and of a custom string', () => {
		equal(normalizeValue('a'.repeat(100), spec('cid'), V2), 'a'.repeat(100))
		equal(normalizeValue('a'.repeat(100), spec('cid'), V1), undefined)
		equal(normalizeValue('a'.repeat(65), CUSTOM, V2), undefined)
		equal(normalizeValue('a'.repeat(65), CUSTOM, V1), 'a'.repeat(65))
	})

	it('returns a token from the token list of the key', () => {
		equal(tokenOf(normalizeValue('v', spec('ot'), V2)), 'v')
		equal(tokenOf(normalizeValue(Symbol.for('v'), spec('ot'), V2)), 'v')
		equal(normalizeValue('x', spec('ot'), V2), undefined)
	})

	it('maps st=ll and sf=e to version 1 tokens', () => {
		equal(tokenOf(normalizeValue('ll', spec('st'), V1)), 'l')
		equal(tokenOf(normalizeValue('e', spec('sf'), V1)), 'o')
		equal(tokenOf(normalizeValue('ll', spec('st'), V2)), 'll')
		equal(tokenOf(normalizeValue('e', spec('sf'), V2)), 'e')
	})

	it('wraps one value of a list key in a list in version 2', () => {
		deepEqual(normalizeValue(3000, spec('br'), V2), [3000])
		deepEqual(normalizeValue('E1', spec('ec'), V2), ['E1'])
	})

	it('drops each list element that does not match the type', () => {
		deepEqual(normalizeValue([2500.4, 'abc', null], spec('pb'), V2), [2500])
		deepEqual(normalizeValue(['E1', 5, ''], spec('ec'), V2), ['E1'])
		equal(normalizeValue([NaN], spec('br'), V2), undefined)
		equal(normalizeValue([], spec('br'), V2), undefined)
	})

	it('keeps the parameters of an inner list', () => {
		const value = normalizeValue(new SfItem([1200.4, 3400], { p: 2 }), spec('br'), V2)
		ok(value instanceof SfItem)
		deepEqual(value.params, { p: 2 })
		deepEqual((value.value as unknown as SfItem[]).map(item => item.value), [1200, 3400])
	})

	it('returns one number for a list key in version 1', () => {
		equal(normalizeValue(1249.6, spec('bl'), V1), 1200)
	})

	it('accepts the custom value types of the current encoder', () => {
		equal(normalizeValue(1.5, CUSTOM, V2), 1.5)
		equal(normalizeValue(true, CUSTOM, V2), true)
		equal(normalizeValue(false, CUSTOM, V2), false)
		deepEqual(normalizeValue([1, 'a'], CUSTOM, V2), [1, 'a'])
		equal(normalizeValue([], CUSTOM, V2), undefined)
		equal(normalizeValue({ a: 1 }, CUSTOM, V2), undefined)
	})

	it('formats nor', () => {
		deepEqual(normalizeValue('a.m4s', spec('nor'), V2), ['a.m4s'])
	})
})
