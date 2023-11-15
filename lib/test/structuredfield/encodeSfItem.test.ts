import assert from 'node:assert';
import test from 'node:test';
import { SfItem } from '../../src/structuredfield/SfItem.js';
import { encodeSfItem } from '../../src/structuredfield/encodeSfItem.js';

test('encodeSfItem', () => {
	assert.deepStrictEqual(encodeSfItem('a'), `"a"`);
	assert.deepStrictEqual(encodeSfItem(true), `?1`);
	assert.deepStrictEqual(encodeSfItem(1), `1`);
	assert.deepStrictEqual(encodeSfItem(Symbol.for('a')), `a`);
	assert.deepStrictEqual(encodeSfItem(new Uint8Array([1, 2, 3])), `:AQID:`);

	assert.deepStrictEqual(encodeSfItem(new SfItem('a')), `"a"`);
	assert.deepStrictEqual(encodeSfItem(new SfItem(true)), `?1`);
	assert.deepStrictEqual(encodeSfItem(new SfItem(1)), `1`);
	assert.deepStrictEqual(encodeSfItem(new SfItem(Symbol.for('a'))), `a`);
	assert.deepStrictEqual(encodeSfItem(new SfItem(new Uint8Array([1, 2, 3]))), `:AQID:`);
	assert.deepStrictEqual(encodeSfItem(new SfItem(new Date(1659578233000))), `@1659578233`);

	// @ts-expect-error
	assert.throws(() => encodeSfItem(function () { }), /failed to serialize "function \(\) \{ \}" as Bare Item/);
	// @ts-expect-error
	assert.throws(() => encodeSfItem(() => { }), /failed to serialize "\(\) => \{ \}" as Bare Item/);
	assert.throws(() => encodeSfItem(999), /failed to serialize "999" as Bare Item/);
	// @ts-expect-error
	assert.throws(() => encodeSfItem([]), /failed to serialize "\[\]" as Bare Item/);
	// @ts-expect-error
	assert.throws(() => encodeSfItem(new Map()), /failed to serialize "Map{}" as Bare Item/);
	// @ts-expect-error
	assert.throws(() => encodeSfItem(new Set()), /failed to serialize "Set{}" as Bare Item/);
	// @ts-expect-error
	assert.throws(() => encodeSfItem(null), /failed to serialize "null" as Bare Item/);
	// @ts-expect-error
	assert.throws(() => encodeSfItem(undefined), /failed to serialize "undefined" as Bare Item/);
});
