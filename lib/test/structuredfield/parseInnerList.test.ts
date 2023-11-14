import assert from 'node:assert';
import test from 'node:test';
import { SfItem } from '../../src/structuredfield/SfItem.js';
import { parseInnerList } from '../../src/structuredfield/parse/parseInnerList.js';
import { parseList } from '../../src/structuredfield/parse/parseList.js';

test('parseInnerList', () => {
	assert.deepStrictEqual(parseInnerList(`( 1 2 3 )`), {
		value: new SfItem([1, 2, 3]),
		src: ``,
	});
	assert.deepStrictEqual(parseInnerList(`(1)`), {
		value: new SfItem([1]),
		src: ``,
	});
	assert.deepStrictEqual(parseInnerList(`()`), {
		value: new SfItem([]),
		src: ``,
	});
	assert.deepStrictEqual(parseList(`(1 1.23 a "a" ?1 :AQID: @1659578233)`), {
		value: [
			new SfItem([
				1,
				1.23,
				Symbol.for('a'),
				'a',
				true,
				new Uint8Array([1, 2, 3]),
				new Date(1659578233 * 1000),
			]),
		], src: ``,
	}
	);
	assert.throws(() => parseInnerList(`[1 2 3)`), /failed to parse "\[1 2 3\)" as Inner List/);
	assert.throws(() => parseInnerList(`(1 2 3]`), /failed to parse "\]" as Inner List/);
	assert.throws(() => parseInnerList(`(`), /failed to parse "" as Inner List/);
});
