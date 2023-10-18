import assert from 'node:assert';
import test from 'node:test';
import { parseParameters } from '../../src/structuredfield/parseParameters.js';

test('parseParameters', () => {
	assert.deepStrictEqual(parseParameters(`;a=0`), { value: { 'a': 0 }, input_string: `` });
	assert.deepStrictEqual(parseParameters(`;a`), { value: { 'a': true }, input_string: `` });
	assert.deepStrictEqual(parseParameters(`;  a;  b=?0`), { value: { 'a': true, 'b': false }, input_string: `` });
	assert.deepStrictEqual(parseParameters(`;a;b=?0;c=10`), { value: { 'a': true, 'b': false, 'c': 10 }, input_string: `` });
});
