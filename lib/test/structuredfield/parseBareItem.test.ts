import assert from 'node:assert';
import test from 'node:test';
import { parseBareItem } from '../../src/structuredfield/parseBareItem.js';
import { base64encode } from '../../src/utils/base64encode.js';

test('parseBareItem', () => {
	assert.deepStrictEqual(parseBareItem(`"string"`), { value: 'string', input_string: `` });
	assert.deepStrictEqual(parseBareItem(`123`), { value: 123, input_string: `` });
	assert.deepStrictEqual(parseBareItem(`3.14`), { value: 3.14, input_string: `` });
	assert.deepStrictEqual(parseBareItem(`?1`), { value: true, input_string: `` });
	const binary = new Uint8Array([1, 2, 3, 4, 5]);
	assert.deepStrictEqual(parseBareItem(`:${base64encode(binary)}:`), { value: binary, input_string: `` });
	assert.deepStrictEqual(parseBareItem(`token`), { value: Symbol.for(`token`), input_string: `` });
	assert.deepStrictEqual(parseBareItem(`foo123;456`), { value: Symbol.for(`foo123`), input_string: `;456` });
	assert.deepStrictEqual(parseBareItem(`@1659578233`), { value: new Date(1659578233000), input_string: `` });

	assert.throws(() => parseBareItem(`&`), /failed to parse "&" as Bare Item/);
});
