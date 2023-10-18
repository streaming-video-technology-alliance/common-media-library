import assert from 'node:assert';
import test from 'node:test';
import { SfItem } from '../../src/structuredfield/SfItem.js';
import { encodeSfList } from '../../src/structuredfield/encodeSfList.js';

test('encodeSfList', () => {
	assert.deepStrictEqual(encodeSfList([]), ``);
	assert.deepStrictEqual(encodeSfList([1, 2, 3]), `1, 2, 3`);
	assert.deepStrictEqual(encodeSfList([
		new SfItem(1),
		new SfItem(2),
		new SfItem(3),
	]), `1, 2, 3`);
	assert.deepStrictEqual(encodeSfList([
		new SfItem(1, { a: 2 }),
		new SfItem(2, { a: 2 }),
		new SfItem(3, { a: 2 }),
	]), `1;a=2, 2;a=2, 3;a=2`);
});
