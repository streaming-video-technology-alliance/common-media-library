import { parseToken } from '@svta/cml-structuredfield/parse/parseToken';
import assert from 'node:assert';
import test from 'node:test';

test('parseToken', () => {
	assert.deepStrictEqual(parseToken(`*foo123/456`), { value: Symbol.for(`*foo123/456`), src: `` });
	assert.deepStrictEqual(parseToken(`foo123;456`), { value: Symbol.for(`foo123`), src: `;456` });
	assert.deepStrictEqual(parseToken(`ABC!#$%&'*+-.^_'|~:/012`), { value: Symbol.for(`ABC!#$%&'*+-.^_'|~:/012`), src: `` });
	assert.throws(() => parseToken(``), /failed to parse "" as Token/);
});
