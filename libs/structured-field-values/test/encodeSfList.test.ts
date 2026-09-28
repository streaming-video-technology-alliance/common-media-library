import { encodeSfList, SfItem } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import test from 'node:test'

test('encodeSfList', () => {
	assert.deepStrictEqual(encodeSfList([]), ``)
	assert.deepStrictEqual(encodeSfList([1, 2, 3]), `1, 2, 3`)
	assert.deepStrictEqual(encodeSfList([
		new SfItem(1),
		new SfItem(2),
		new SfItem(3),
	]), `1, 2, 3`)
	assert.deepStrictEqual(encodeSfList([
		new SfItem(1, { a: 2 }),
		new SfItem(2, { a: 2 }),
		new SfItem(3, { a: 2 }),
	]), `1;a=2, 2;a=2, 3;a=2`)
	assert.deepStrictEqual(encodeSfList([3, new SfItem([4], { a: 1 }), new SfItem(5, { b: true })]), '3, (4);a=1, 5;b')
	// @ts-expect-error - This is a test
	assert.deepStrictEqual(encodeSfList([[1, 2], 3]), '(1 2), 3')
	assert.deepStrictEqual(encodeSfList([true, false]), '?1, ?0')
})

test('encodeSfList keeps whitespace on unless it is explicitly disabled', () => {
	const list = [1, 2, 3]
	assert.deepStrictEqual(encodeSfList(list), `1, 2, 3`)
	assert.deepStrictEqual(encodeSfList(list, {}), `1, 2, 3`)
	assert.deepStrictEqual(encodeSfList(list, { whitespace: undefined }), `1, 2, 3`)
	assert.deepStrictEqual(encodeSfList(list, { whitespace: true }), `1, 2, 3`)
	assert.deepStrictEqual(encodeSfList(list, { whitespace: false }), `1,2,3`)
})
