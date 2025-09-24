import { serializeList } from '@svta/cml-structuredfield/serialize/serializeList';
import assert from 'node:assert';
import test from 'node:test';

test('serializeList', () => {
	assert.deepStrictEqual(serializeList([1, 2, 3]), '1, 2, 3');
	assert.deepStrictEqual(serializeList([]), '');

	// @ts-expect-error
	assert.throws(() => serializeList({}), /failed to serialize "{}" as List/);
});
