import assert from 'node:assert';
import test from 'node:test';
import { serializeBareItem } from '../../src/structuredfield/serialize/serializeBareItem.js';

test('serializeBareItem', () => {
	assert.throws(() => serializeBareItem([]), /failed to serialize "\[\]" as Bare Item/);
	assert.throws(() => serializeBareItem({}), /failed to serialize "{}" as Bare Item/);
	assert.throws(() => serializeBareItem(NaN), /failed to serialize "NaN" as Bare Item/);
	assert.throws(() => serializeBareItem(Infinity), /failed to serialize "Infinity" as Bare Item/);
});
