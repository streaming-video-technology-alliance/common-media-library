import { decodeSfList, SfItem } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import { describe, it } from 'node:test'

describe('decodeSfList', () => {
	it('handles an empty string', () => {
		assert.deepStrictEqual(decodeSfList(``), [])
	})

	it('parses valid input', () => {
		assert.deepStrictEqual(decodeSfList(`("foo"; a=1;b=2);lvl=5, ("bar" "baz");lvl=1`), [
			new SfItem([
				new SfItem('foo', { 'a': 1, 'b': 2 }),
			], { 'lvl': 5 }),
			new SfItem(['bar', 'baz'], { 'lvl': 1 }),
		])
	})

	it('throws an error on invalid input', () => {
		assert.throws(() => decodeSfList(`1,2,3)`), (error: any) => {
			assert.deepStrictEqual(error.message, `failed to parse "1,2,3)" as List`)
			assert.deepStrictEqual(error.cause.message, `failed to parse ")" as List`)
			return true
		})
		assert.throws(() => decodeSfList(`1,2,`), (error: any) => {
			assert.deepStrictEqual(error.message, `failed to parse "1,2," as List`)
			assert.deepStrictEqual(error.cause.message, `failed to parse "" as List`)
			return true
		})
	})
})
