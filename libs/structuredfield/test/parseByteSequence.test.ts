import { parseByteSequence } from '@svta/common-media-library/structuredfield/parse/parseByteSequence';
import assert from 'node:assert';
import test from 'node:test';

test('parseByteSequence', () => {
	const value = Uint8Array.from([
		112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115, 32,
		105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99, 111, 110, 116,
		101, 110, 116, 46,
	]);
	assert.deepStrictEqual(parseByteSequence(`:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`), { value, src: `` });
	assert.throws(() => parseByteSequence(``), /failed to parse "" as Byte Sequence/);
});
