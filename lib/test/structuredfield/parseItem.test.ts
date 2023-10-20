import assert from 'node:assert';
import test from 'node:test';
import { SfItem } from '../../src/structuredfield/SfItem.js';
import { parseItem } from '../../src/structuredfield/parse/parseItem.js';

test('test parseItem', () => {
	assert.deepStrictEqual(parseItem(`123;a=1;b`), { value: new SfItem(123, { 'a': 1, 'b': true }), src: `` });
	assert.throws(() => parseItem(``), /failed to parse "" as Token/);
});
