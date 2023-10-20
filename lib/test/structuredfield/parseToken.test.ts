import assert from 'node:assert';
import test from 'node:test';
import { parseToken } from '../../src/structuredfield/parse/parseToken.js';

test('parseToken', () => {
	assert.deepStrictEqual(parseToken(`*foo123/456`), { value: Symbol.for(`*foo123/456`), src: `` });
	assert.deepStrictEqual(parseToken(`foo123;456`), { value: Symbol.for(`foo123`), src: `;456` });
	assert.deepStrictEqual(parseToken(`ABC!#$%&'*+-.^_'|~:/012`), { value: Symbol.for(`ABC!#$%&'*+-.^_'|~:/012`), src: `` });
	assert.throws(() => parseToken(``), /failed to parse "" as Token/);
});
