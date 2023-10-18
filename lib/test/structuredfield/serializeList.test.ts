import assert from 'node:assert';
import test from 'node:test';
import { serializeList } from '../../src/structuredfield/serializeList.js';

test('serializeList', () => {
	assert.deepStrictEqual(serializeList([1, 2, 3]), '1, 2, 3');
	assert.deepStrictEqual(serializeList([]), '');

	// @ts-expect-error
	assert.throws(() => serializeList({}), /failed to serialize "{}" as List/);
});
