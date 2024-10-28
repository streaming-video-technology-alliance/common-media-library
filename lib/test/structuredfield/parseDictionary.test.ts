import assert from 'node:assert';
import test from 'node:test';
import { SfItem } from '../../src/structuredfield/SfItem.js';
import { parseDict } from '../../src/structuredfield/parse/parseDict.js';

test('parseDictionary', () => {
	assert.deepStrictEqual(parseDict(
		`int=1, dec=1.23, token=a, str="a", bool=?1, bin=:AQID:, date=@1659578233`,
	), {
		value: {
			'int': new SfItem(1),
			'dec': new SfItem(1.23),
			'token': new SfItem(Symbol.for('a')),
			'str': new SfItem('a'),
			'bool': new SfItem(true),
			'bin': new SfItem(new Uint8Array([1, 2, 3])),
			'date': new SfItem(new Date(1659578233 * 1000)),
		},
		src: ``,
	});

	assert.deepEqual(parseDict(`a=?0, b, c; foo=bar`), {
		value: {
			'a': new SfItem(false),
			'b': new SfItem(true),
			'c': new SfItem(true, { 'foo': Symbol.for('bar') }),
		},
		src: ``,
	});

	assert.deepStrictEqual(parseDict(`rating=1.5, feelings=(joy sadness)`), {
		value: {
			'rating': new SfItem(1.5),
			'feelings': new SfItem([Symbol.for('joy'), Symbol.for('sadness')]),
		},
		src: ``,
	});

	assert.deepStrictEqual(parseDict(`a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid`), {
		value: {
			'a': new SfItem([1, 2]),
			'b': new SfItem(3),
			'c': new SfItem(4, { 'aa': Symbol.for('bb') }),
			'd': new SfItem([5, 6], { 'valid': true }),
		},
		src: ``,
	});

	assert.throws(() => parseDict(`a=1&`), /failed to parse "&" as Dict/);
	assert.throws(() => parseDict(`a=1,`), /failed to parse "" as Dict/);
});
