import assert from 'node:assert';
import test from 'node:test';
import { parseToken } from '../../src/structuredfield/parseToken.js';

test('parseToken', () => {
	assert.deepStrictEqual(parseToken(`*foo123/456`), { value: Symbol.for(`*foo123/456`), input_string: `` });
	assert.deepStrictEqual(parseToken(`foo123;456`), { value: Symbol.for(`foo123`), input_string: `;456` });
	assert.deepStrictEqual(parseToken(`ABC!#$%&'*+-.^_'|~:/012`), { value: Symbol.for(`ABC!#$%&'*+-.^_'|~:/012`), input_string: `` });
	assert.throws(() => parseToken(``), /failed to parse "" as Token/);
});
