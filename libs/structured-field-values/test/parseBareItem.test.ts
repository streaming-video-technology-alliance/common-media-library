import { parseBareItem } from '@svta/cml-structured-field-values';
import { base64encode } from '@svta/cml-utils';
import assert from 'node:assert';
import test from 'node:test';

test('parseBareItem', () => {
	assert.deepStrictEqual(parseBareItem(`"string"`), { value: 'string', src: `` });
	assert.deepStrictEqual(parseBareItem(`123`), { value: 123, src: `` });
	assert.deepStrictEqual(parseBareItem(`3.14`), { value: 3.14, src: `` });
	assert.deepStrictEqual(parseBareItem(`?1`), { value: true, src: `` });
	const binary = new Uint8Array([1, 2, 3, 4, 5]);
	assert.deepStrictEqual(parseBareItem(`:${base64encode(binary)}:`), { value: binary, src: `` });
	assert.deepStrictEqual(parseBareItem(`token`), { value: Symbol.for(`token`), src: `` });
	assert.deepStrictEqual(parseBareItem(`foo123;456`), { value: Symbol.for(`foo123`), src: `;456` });
	assert.deepStrictEqual(parseBareItem(`@1659578233`), { value: new Date(1659578233000), src: `` });

	assert.throws(() => parseBareItem(`&`), /failed to parse "&" as Bare Item/);
});
