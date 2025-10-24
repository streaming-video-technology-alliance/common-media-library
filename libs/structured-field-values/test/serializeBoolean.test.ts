import { serializeBoolean } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import test from 'node:test'

test('serializeBoolean', () => {
	assert.deepStrictEqual(serializeBoolean(true), `?1`)
	assert.deepStrictEqual(serializeBoolean(false), `?0`)

	// @ts-expect-error - This is a test
	assert.throws(() => serializeBoolean(0), /failed to serialize "0" as Boolean/)

	// @ts-expect-error - This is a test
	assert.throws(() => serializeBoolean(null), /failed to serialize "null" as Boolean/)

	// @ts-expect-error - This is a test
	assert.throws(() => serializeBoolean(undefined), /failed to serialize "undefined" as Boolean/)
})
