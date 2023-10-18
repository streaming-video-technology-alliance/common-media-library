import assert from 'node:assert';
import test from 'node:test';
import { serializeBoolean } from '../../src/structuredfield/serializeBoolean.js';

test('serializeBoolean', () => {
	assert.deepStrictEqual(serializeBoolean(true), `?1`);
	assert.deepStrictEqual(serializeBoolean(false), `?0`);

	// @ts-expect-error
	assert.throws(() => serializeBoolean(0), /failed to serialize "0" as boolean/);

	// @ts-expect-error
	assert.throws(() => serializeBoolean(null), /failed to serialize "null" as boolean/);

	// @ts-expect-error
	assert.throws(() => serializeBoolean(undefined), /failed to serialize "undefined" as boolean/);
});
