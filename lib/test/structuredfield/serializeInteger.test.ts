import assert from 'node:assert';
import test from 'node:test';
import { serializeInteger } from '../../src/structuredfield/serialize/serializeInteger.js';

test('serializeInteger', () => {
	assert.deepStrictEqual(serializeInteger(0), '0');
	assert.deepStrictEqual(serializeInteger(1), '1');
	assert.deepStrictEqual(serializeInteger(-1), '-1');
	assert.deepStrictEqual(serializeInteger(999_999_999_999_999), '999999999999999');
	assert.deepStrictEqual(serializeInteger(-999_999_999_999_999), '-999999999999999');
	assert.throws(() => serializeInteger(1_000_000_000_000_000), /failed to serialize "1000000000000000" as Integer/);
	assert.throws(() => serializeInteger(-1_000_000_000_000_000), /failed to serialize "-1000000000000000" as Integer/);
});
