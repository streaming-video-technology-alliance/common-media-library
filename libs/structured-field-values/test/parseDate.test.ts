import { parseDate } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import { test } from 'vite-plus/test'

test('parseDate', () => {
	assert.deepStrictEqual(parseDate(`@1659578233`), { value: new Date(1659578233000), src: `` })
	assert.deepStrictEqual(parseDate(`@-1659578233`), {
		value: new Date('1917-05-30 22:02:47Z'),
		src: ``,
	})
	assert.throws(() => parseDate(``), /failed to parse "" as Date/)
})

test('parseDate reads the first and the last second of a JS Date', () => {
	assert.deepStrictEqual(parseDate(`@8640000000000`), {
		value: new Date(8_640_000_000_000_000),
		src: ``,
	})
	assert.deepStrictEqual(parseDate(`@-8640000000000`), {
		value: new Date(-8_640_000_000_000_000),
		src: ``,
	})
})

test('parseDate throws for a Date outside the range of a JS Date', () => {
	assert.throws(() => parseDate(`@8640000000001`), /failed to parse "@8640000000001" as Date/)
	assert.throws(() => parseDate(`@-8640000000001`), /failed to parse "@-8640000000001" as Date/)
	assert.throws(() => parseDate(`@999999999999999`), /failed to parse "@999999999999999" as Date/)
	assert.throws(() => parseDate(`@-999999999999999`), /failed to parse "@-999999999999999" as Date/)
})
