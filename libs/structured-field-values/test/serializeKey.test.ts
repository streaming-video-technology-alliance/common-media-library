import { serializeKey } from '@svta/cml-structured-field-values/serialize/serializeKey';
import assert from 'node:assert';
import test from 'node:test';

test('serializeKey', () => {
	assert.deepStrictEqual(serializeKey(`a`), 'a');
	assert.deepStrictEqual(serializeKey(`*`), '*');
	assert.deepStrictEqual(serializeKey(`*-_.*`), '*-_.*');
	assert.deepStrictEqual(serializeKey(`****`), '****');
	assert.deepStrictEqual(serializeKey(`a*`), 'a*');
	assert.deepStrictEqual(serializeKey(`a*0-_.*`), 'a*0-_.*');
	assert.throws(() => serializeKey(`#`), /failed to serialize "#" as Key/);
	assert.throws(() => serializeKey(`?`), /failed to serialize "\?" as Key/);

	// @ts-expect-error
	assert.throws(() => serializeKey(0), /failed to serialize "0" as Key/);
});
