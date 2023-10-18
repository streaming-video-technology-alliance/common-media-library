import assert from 'node:assert';
import test from 'node:test';
import { parseKey } from '../../src/structuredfield/parseKey.js';

test('parseKey', () => {
	assert.deepStrictEqual(parseKey(`a123_-.*`), { value: `a123_-.*`, input_string: `` });
	assert.deepStrictEqual(parseKey(`*a123`), { value: `*a123`, input_string: `` });

	assert.throws(() => parseKey(`&`), /failed to parse "&" as Key/);
});
