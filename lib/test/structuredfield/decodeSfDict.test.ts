import assert from 'node:assert';
import test from 'node:test';
import { SfItem } from '../../src/structuredfield/SfItem.js';
import { decodeSfDict } from '../../src/structuredfield/decodeSfDict.js';

test('decodeSfDict', () => {
	assert.deepStrictEqual(decodeSfDict(``), {});
	assert.deepStrictEqual(decodeSfDict(`a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid`), {
		'a': new SfItem([1, 2]),
		'b': new SfItem(3),
		'c': new SfItem(4, { 'aa': Symbol.for('bb') }),
		'd': new SfItem([5, 6], { 'valid': true }),
	});
	assert.throws(() => decodeSfDict(`a=1, b=2)`), (error: any) => {
		assert.deepStrictEqual(error.message, `failed to parse "a=1, b=2)" as Dict`);
		assert.deepStrictEqual(error.cause.message, `failed to parse ")" as Dict`);
		return true;
	});
});
