import { parseItem } from '@svta/cml-structuredfield/parse/parseItem';
import { SfItem } from '@svta/cml-structuredfield/SfItem';
import assert from 'node:assert';
import test from 'node:test';

test('test parseItem', () => {
	assert.deepStrictEqual(parseItem(`123;a=1;b`), { value: new SfItem(123, { 'a': 1, 'b': true }), src: `` });
	assert.throws(() => parseItem(``), /failed to parse "" as Token/);
});
