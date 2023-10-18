import assert from 'node:assert';
import test from 'node:test';
import { parseBoolean } from '../../src/structuredfield/parseBoolean.js';

test('parseBoolean', () => {
	assert.deepStrictEqual(parseBoolean(`?0`), { value: false, input_string: `` });
	assert.deepStrictEqual(parseBoolean(`?1`), { value: true, input_string: `` });
	assert.throws(() => parseBoolean(``), /failed to parse "" as Boolean/);
});
