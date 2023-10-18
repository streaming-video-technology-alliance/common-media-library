import assert from 'node:assert';
import test from 'node:test';
import { SfItem } from '../../src/structuredfield/SfItem.js';
import { parseItem } from '../../src/structuredfield/parseItem.js';

test('test parseItem', () => {
	assert.deepStrictEqual(parseItem(`123;a=1;b`), { value: new SfItem(123, { 'a': 1, 'b': true }), input_string: `` });
	assert.throws(() => parseItem(``), /failed to parse "" as Token/);
});
