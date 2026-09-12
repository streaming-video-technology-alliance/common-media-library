import { serializeParams, SfToken } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import test from 'node:test'

test('serializeParams', () => {
	assert.deepStrictEqual(serializeParams(undefined), '')
	assert.deepStrictEqual(serializeParams({}), '')
	assert.deepStrictEqual(serializeParams({ a: 1, b: true, c: 'x', d: new SfToken('t'), e: false }), `;a=1;b;c="x";d=t;e=?0`)
	assert.throws(() => serializeParams({ A: 1 }), /failed to serialize "A" as Key/)
})
