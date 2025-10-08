import { parseParameters } from '@svta/cml-structured-field-values/parse/parseParameters';
import assert from 'node:assert';
import test from 'node:test';

test('parseParameters', () => {
	assert.deepStrictEqual(parseParameters(`;a=0`), { value: { 'a': 0 }, src: `` });
	assert.deepStrictEqual(parseParameters(`;a`), { value: { 'a': true }, src: `` });
	assert.deepStrictEqual(parseParameters(`;  a;  b=?0`), { value: { 'a': true, 'b': false }, src: `` });
	assert.deepStrictEqual(parseParameters(`;a;b=?0;c=10`), { value: { 'a': true, 'b': false, 'c': 10 }, src: `` });
});
