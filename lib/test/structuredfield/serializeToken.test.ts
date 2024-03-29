import assert from 'node:assert';
import test from 'node:test';
import { serializeToken } from '../../src/structuredfield/serialize/serializeToken.js';

test('serializeToken', () => {
	assert.deepStrictEqual(serializeToken(Symbol.for('token')), `token`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to!ken`)), `to!ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to#ken`)), `to#ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to$ken`)), `to$ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to%ken`)), `to%ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to&ken`)), `to&ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to'ken`)), `to'ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to*ken`)), `to*ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to+ken`)), `to+ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to-ken`)), `to-ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to.ken`)), `to.ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to^ken`)), `to^ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to_ken`)), `to_ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for('to`ken')), 'to`ken');
	assert.deepStrictEqual(serializeToken(Symbol.for(`to|ken`)), `to|ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to~ken`)), `to~ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`towken`)), `towken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to:ken`)), `to:ken`);
	assert.deepStrictEqual(serializeToken(Symbol.for(`to/ken`)), `to/ken`);

	assert.throws(() => serializeToken(Symbol.for(`to"ken`)), /failed to serialize "to"ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to(ken`)), /failed to serialize "to\(ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to)ken`)), /failed to serialize "to\)ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to,ken`)), /failed to serialize "to,ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to;ken`)), /failed to serialize "to;ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to<ken`)), /failed to serialize "to<ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to=ken`)), /failed to serialize "to=ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to>ken`)), /failed to serialize "to>ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to?ken`)), /failed to serialize "to\?ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to@ken`)), /failed to serialize "to@ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to[ken`)), /failed to serialize "to\[ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to\\ken`)), /failed to serialize "to\\ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to]ken`)), /failed to serialize "to\]ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to{ken`)), /failed to serialize "to\{ken" as Token/);
	assert.throws(() => serializeToken(Symbol.for(`to}ken`)), /failed to serialize "to\}ken" as Token/);
});
