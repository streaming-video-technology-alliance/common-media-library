import { serializeInnerList, SfItem, SfToken } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import test from 'node:test'

test('serializeInnerList', () => {
	assert.deepStrictEqual(serializeInnerList({ value: [1, 2], params: { a: 1 } }), '(1 2);a=1')
	assert.deepStrictEqual(serializeInnerList({ value: [new SfItem(1, { q: true }), new SfItem('x')], params: {} }), '(1;q "x")')
	assert.deepStrictEqual(serializeInnerList([1, 2]), '(1 2)')
	assert.deepStrictEqual(serializeInnerList([1, 2], { a: new SfToken('t') }), '(1 2);a=t')
	assert.deepStrictEqual(serializeInnerList([]), '()')
})
