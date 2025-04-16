import { serializeDict } from '@svta/common-media-library/structuredfield/serialize/serializeDict';
import assert from 'node:assert';
import test from 'node:test';

test('serializeDict', () => {
	assert.deepStrictEqual(serializeDict(new Map()), '');
	assert.deepStrictEqual(serializeDict(new Map([['a', 2]])), 'a=2');

	// @ts-expect-error
	assert.throws(() => serializeDict(0), /failed to serialize "0" as Dict/);
});
