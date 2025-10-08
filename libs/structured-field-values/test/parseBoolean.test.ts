import { parseBoolean } from '@svta/cml-structured-field-values/parse/parseBoolean';
import assert from 'node:assert';
import test from 'node:test';

test('parseBoolean', () => {
	assert.deepStrictEqual(parseBoolean(`?0`), { value: false, src: `` });
	assert.deepStrictEqual(parseBoolean(`?1`), { value: true, src: `` });
	assert.throws(() => parseBoolean(``), /failed to parse "" as Boolean/);
});
