import assert from 'node:assert';
import test from 'node:test';
import { parseString } from '../../src/structuredfield/parseString.js';

test('parseString', () => {
	assert.deepStrictEqual(parseString(`"asdf"`), { value: `asdf`, input_string: `` });
	assert.deepStrictEqual(parseString(`"!#[]"`), { value: `!#[]`, input_string: `` });
	assert.deepStrictEqual(parseString(`"a""`), { value: `a`, input_string: `"` });
	assert.deepStrictEqual(parseString(`"a\\""`), { value: `a"`, input_string: `` });
	assert.deepStrictEqual(parseString(`"a\\\\c"`), { value: `a\\c`, input_string: `` });
	assert.throws(() => parseString(`"a\\"`), /failed to parse ""a\\"" as String/);
	assert.throws(() => parseString(`"\\a"`), /failed to parse ""\\a"" as String/);
	assert.throws(() => parseString(``), /failed to parse "" as String/);
});
