import { encodeSfItem, serializeDate } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import { test } from 'vite-plus/test'

test('serializeDate', () => {
	assert.deepStrictEqual(serializeDate(new Date(1659578233000)), `@1659578233`)
	assert.deepStrictEqual(serializeDate(new Date(-1659578233000)), `@-1659578233`)
	assert.deepStrictEqual(serializeDate(new Date(8_640_000_000_000_000)), `@8640000000000`)
	assert.deepStrictEqual(serializeDate(new Date(-8_640_000_000_000_000)), `@-8640000000000`)
})

test('serializeDate throws for an Invalid Date', () => {
	assert.throws(() => serializeDate(new Date(NaN)), /failed to serialize "Invalid Date" as Date/)
	assert.throws(
		() => encodeSfItem(new Date(8_640_000_000_000_001)),
		/failed to serialize "Invalid Date" as Date/,
	)
})
