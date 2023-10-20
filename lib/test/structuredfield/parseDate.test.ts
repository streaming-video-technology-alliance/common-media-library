import assert from 'node:assert';
import test from 'node:test';
import { parseDate } from '../../src/structuredfield/parse/parseDate.js';

test('parseDate', () => {
	assert.deepStrictEqual(parseDate(`@1659578233`), { value: new Date(1659578233000), src: `` });
	assert.deepStrictEqual(parseDate(`@-1659578233`), { value: new Date('1917-05-30 22:02:47Z'), src: `` });
	assert.throws(() => parseDate(``), /failed to parse "" as Date/);
});
