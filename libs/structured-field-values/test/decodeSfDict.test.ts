import assert from 'node:assert'
import { describe, it } from 'node:test'

import { decodeSfDict, SfItem, SfToken } from '@svta/cml-structured-field-values'

describe('decodeSfDict', () => {
	it('handles blank string', () => {
		assert.deepStrictEqual(decodeSfDict(``), {})
	})

	it('handles valid input', () => {
		assert.deepStrictEqual(decodeSfDict(`a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid`), {
			'a': new SfItem([1, 2]),
			'b': new SfItem(3),
			'c': new SfItem(4, { 'aa': Symbol.for('bb') }),
			'd': new SfItem([5, 6], { 'valid': true }),
		})
	})

	it('handles valid input w/ useSymbol=false', () => {
		assert.deepStrictEqual(decodeSfDict(`a=b;cc=dd`, { useSymbol: false }), {
			'a': new SfItem(new SfToken('b'), { 'cc': new SfToken('dd') }),
		})
	})

	it('handles invalid input', () => {
		assert.throws(() => decodeSfDict(`a=1, b=2)`), (error: any) => {
			assert.deepStrictEqual(error.message, `failed to parse "a=1, b=2)" as Dict`)
			assert.deepStrictEqual(error.cause.message, `failed to parse ")" as Dict`)
			return true
		})
	})
})
