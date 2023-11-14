import assert from 'node:assert';
import test from 'node:test';
import { serializeString } from '../../src/structuredfield/serialize/serializeString.js';

test('serializeString', () => {
	assert.deepStrictEqual(serializeString('string'), `"string"`);
	assert.deepStrictEqual(serializeString('str\\ing'), `"str\\\\ing"`);
	assert.deepStrictEqual(serializeString('str"ing'), `"str\\"ing"`);
	assert.throws(() => serializeString('str\x00ing'), /failed to serialize "str\x00ing" as String/); // eslint-disable-line no-control-regex
	assert.throws(() => serializeString('str\x1fing'), /failed to serialize "str\x1fing" as String/); // eslint-disable-line no-control-regex
	assert.throws(() => serializeString('str\x7fing'), /failed to serialize "str\x7fing" as String/);
});
