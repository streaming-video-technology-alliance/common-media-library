import { parseDate } from '@svta/common-media-library/structuredfield/parse/parseDate';
import assert from 'node:assert';
import test from 'node:test';

test('parseDate', () => {
	assert.deepStrictEqual(parseDate(`@1659578233`), { value: new Date(1659578233000), src: `` });
	assert.deepStrictEqual(parseDate(`@-1659578233`), { value: new Date('1917-05-30 22:02:47Z'), src: `` });
	assert.throws(() => parseDate(``), /failed to parse "" as Date/);
});
