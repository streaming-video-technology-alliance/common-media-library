import assert from 'node:assert';
import test from 'node:test';
import { parseByteSequence } from '../../src/structuredfield/parse/parseByteSequence.js';

test('parseByteSequence', () => {
	const value = Uint8Array.from([
		112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115, 32,
		105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99, 111, 110, 116,
		101, 110, 116, 46,
	]);
	assert.deepStrictEqual(parseByteSequence(`:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`), { value, src: `` });
	assert.throws(() => parseByteSequence(``), /failed to parse "" as Byte Sequence/);
});
