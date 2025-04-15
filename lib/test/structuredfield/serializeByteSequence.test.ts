import { serializeByteSequence } from '@svta/common-media-library/structuredfield/serialize/serializeByteSequence';
import assert from 'node:assert';
import test from 'node:test';

test('serializeByteSequence', () => {
	const value = Uint8Array.from([
		112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115,
		32, 105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99,
		111, 110, 116, 101, 110, 116, 46,
	]);
	assert.deepStrictEqual(serializeByteSequence(value), `:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`);

	// @ts-expect-error
	assert.throws(() => serializeByteSequence([1, 2, 3]), /failed to serialize "\[1,2,3\]" as Byte Sequence/);
});
