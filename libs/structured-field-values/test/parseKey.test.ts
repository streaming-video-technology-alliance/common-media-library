import { parseKey } from '@svta/cml-structured-field-values/parse/parseKey';
import assert from 'node:assert';
import test from 'node:test';

test('parseKey', () => {
	assert.deepStrictEqual(parseKey(`a123_-.*`), { value: `a123_-.*`, src: `` });
	assert.deepStrictEqual(parseKey(`*a123`), { value: `*a123`, src: `` });

	assert.throws(() => parseKey(`&`), /failed to parse "&" as Key/);
});
