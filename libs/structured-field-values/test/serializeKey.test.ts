import { serializeKey } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import test from 'node:test'

test('serializeKey', () => {
	assert.deepStrictEqual(serializeKey(`a`), 'a')
	assert.deepStrictEqual(serializeKey(`*`), '*')
	assert.deepStrictEqual(serializeKey(`*-_.*`), '*-_.*')
	assert.deepStrictEqual(serializeKey(`****`), '****')
	assert.deepStrictEqual(serializeKey(`a*`), 'a*')
	assert.deepStrictEqual(serializeKey(`a*0-_.*`), 'a*0-_.*')
	assert.throws(() => serializeKey(`#`), /failed to serialize "#" as Key/)
	assert.throws(() => serializeKey(`?`), /failed to serialize "\?" as Key/)
	assert.throws(() => serializeKey(''), /failed to serialize "" as Key/)
	assert.throws(() => serializeKey('A'), /failed to serialize "A" as Key/)
	assert.throws(() => serializeKey('0a'), /failed to serialize "0a" as Key/)
	assert.throws(() => serializeKey('-a'), /failed to serialize "-a" as Key/)
	assert.throws(() => serializeKey('a b'), /failed to serialize "a b" as Key/)
	assert.throws(() => serializeKey('aé'), /failed to serialize "aé" as Key/)

	// @ts-expect-error - This is a test
	assert.throws(() => serializeKey(0), /failed to serialize "0" as Key/)
})
