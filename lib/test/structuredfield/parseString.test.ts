import assert from 'node:assert';
import test from 'node:test';
import { parseString } from '../../src/structuredfield/parse/parseString.js';

test('parseString', () => {
	assert.deepStrictEqual(parseString(`"asdf"`), { value: `asdf`, src: `` });
	assert.deepStrictEqual(parseString(`"!#[]"`), { value: `!#[]`, src: `` });
	assert.deepStrictEqual(parseString(`"a""`), { value: `a`, src: `"` });
	assert.deepStrictEqual(parseString(`"a\\""`), { value: `a"`, src: `` });
	assert.deepStrictEqual(parseString(`"a\\\\c"`), { value: `a\\c`, src: `` });
	assert.throws(() => parseString(`"a\\"`), /failed to parse ""a\\"" as String/);
	assert.throws(() => parseString(`"\\a"`), /failed to parse ""\\a"" as String/);
	assert.throws(() => parseString(``), /failed to parse "" as String/);
});
