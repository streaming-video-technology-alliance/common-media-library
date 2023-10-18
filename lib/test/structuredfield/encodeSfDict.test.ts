import assert from 'node:assert';
import test from 'node:test';
import { SfItem } from '../../src/structuredfield/SfItem.js';
import { encodeSfDict } from '../../src/structuredfield/encodeSfDict.js';


test('encodeSfDict', () => {
	assert.deepStrictEqual(encodeSfDict({}), ``);
	assert.deepStrictEqual(encodeSfDict(new Map()), ``);
	assert.deepStrictEqual(
		encodeSfDict({
			a: 10,
			b: 20,
			c: 30,
		}),
		`a=10, b=20, c=30`
	);
	assert.deepStrictEqual(
		encodeSfDict(new Map([
			['a', 10],
			['b', 20],
			['c', 30],
		])),
		`a=10, b=20, c=30`
	);
	assert.deepStrictEqual(
		encodeSfDict({
			a: 1,
			b: false,
			c: 'x',
			d: Symbol.for('y'),
			e: new Uint8Array([1, 2, 3]),
		}),
		`a=1, b=?0, c="x", d=y, e=:AQID:`
	);
	assert.deepStrictEqual(
		encodeSfDict({
			a: new SfItem(1),
			b: new SfItem(false),
			c: new SfItem('x'),
			d: new SfItem(Symbol.for('y')),
			e: new SfItem(new Uint8Array([1, 2, 3])),
		}),
		`a=1, b=?0, c="x", d=y, e=:AQID:`
	);
	assert.deepStrictEqual(
		encodeSfDict(new Map([
			['a', new SfItem(1)],
			['b', new SfItem(false)],
			['c', new SfItem('x')],
			['d', new SfItem(Symbol.for('y'))],
			['e', new SfItem(new Uint8Array([1, 2, 3]))],
		])),
		`a=1, b=?0, c="x", d=y, e=:AQID:`
	);
});
