import { decodeSfItem, SfItem } from '@svta/cml-structured-field-values';
import assert from 'node:assert';
import test from 'node:test';

test('decodeSfItem', () => {
	assert.deepStrictEqual(decodeSfItem(`"a"`), new SfItem('a'));
	assert.deepStrictEqual(decodeSfItem(`?1`), new SfItem(true));
	assert.deepStrictEqual(decodeSfItem(`1`), new SfItem(1));
	assert.deepStrictEqual(decodeSfItem(`a`), new SfItem(Symbol.for('a')));
	assert.deepStrictEqual(decodeSfItem(`:AQID:`), new SfItem(new Uint8Array([1, 2, 3])));
	assert.deepStrictEqual(decodeSfItem(`@1659578233`), new SfItem(new Date(1659578233 * 1000)));

	assert.throws(() => decodeSfItem(`1;`), (error: any) => {
		assert.deepStrictEqual(error.message, `failed to parse "1;" as Item`);
		assert.deepStrictEqual(error.cause.message, `failed to parse "" as Key`);
		return true;
	});
});
