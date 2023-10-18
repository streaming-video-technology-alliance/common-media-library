import assert from 'node:assert';
import test from 'node:test';
import { parseDate } from '../../src/structuredfield/parseDate.js';

test('parseDate', () => {
	assert.deepStrictEqual(parseDate(`@1659578233`), { value: new Date(1659578233000), input_string: `` });
	assert.deepStrictEqual(parseDate(`@-1659578233`), { value: new Date('1917-05-30 22:02:47Z'), input_string: `` });
	assert.throws(() => parseDate(``), /failed to parse "" as Date/);
});
