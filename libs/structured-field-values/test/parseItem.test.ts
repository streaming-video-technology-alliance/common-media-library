import { parseItem, SfItem } from '@svta/cml-structured-field-values';
import assert from 'node:assert';
import test from 'node:test';

test('test parseItem', () => {
	assert.deepStrictEqual(parseItem(`123;a=1;b`), { value: new SfItem(123, { 'a': 1, 'b': true }), src: `` });
	assert.throws(() => parseItem(``), /failed to parse "" as Token/);
});
