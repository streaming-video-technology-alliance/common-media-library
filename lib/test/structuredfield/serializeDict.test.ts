import assert from 'node:assert';
import test from 'node:test';
import { serializeDict } from '../../src/structuredfield/serialize/serializeDict.js';

test('serializeDict', () => {
	assert.deepStrictEqual(serializeDict(new Map()), '');
	assert.deepStrictEqual(serializeDict(new Map([['a', 2]])), 'a=2');

	// @ts-expect-error
	assert.throws(() => serializeDict(0), /failed to serialize "0" as Dict/);
});
