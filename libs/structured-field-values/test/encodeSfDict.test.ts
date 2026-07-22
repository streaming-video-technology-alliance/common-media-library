import { encodeSfDict, SfItem, SfToken } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import { describe, it } from 'node:test'

describe('encodeSfDict', () => {
	it('handles empty objects', () => {
		assert.deepStrictEqual(encodeSfDict({}), ``)
		assert.deepStrictEqual(encodeSfDict(new Map()), ``)
	})

	it('encodes valid objects', () => {
		assert.deepStrictEqual(
			encodeSfDict({
				a: 10,
				b: 20,
				c: 30,
			}),
			`a=10, b=20, c=30`,
		)
		assert.deepStrictEqual(
			encodeSfDict(new Map([
				['a', 10],
				['b', 20],
				['c', 30],
			])),
			`a=10, b=20, c=30`,
		)

		//#region example
		assert.deepStrictEqual(
			encodeSfDict({
				a: 1,
				b: false,
				c: 'x',
				d: Symbol.for('y'),
				e: new Uint8Array([1, 2, 3]),
			}),
			`a=1, b=?0, c="x", d=y, e=:AQID:`,
		)
		//#endregion example

		assert.deepStrictEqual(
			encodeSfDict({
				a: new SfItem(1),
				b: new SfItem(false),
				c: new SfItem('x'),
				d: new SfItem(Symbol.for('y')),
				e: new SfItem(new Uint8Array([1, 2, 3])),
			}),
			`a=1, b=?0, c="x", d=y, e=:AQID:`,
		)
		assert.deepStrictEqual(
			encodeSfDict(new Map([
				['a', new SfItem(1)],
				['b', new SfItem(false)],
				['c', new SfItem('x')],
				['d', new SfItem(Symbol.for('y'))],
				['e', new SfItem(new Uint8Array([1, 2, 3]))],
			])),
			`a=1, b=?0, c="x", d=y, e=:AQID:`,
		)
	})

	it('handles SfToken and Symbol for tokens', () => {
		assert.deepStrictEqual(
			encodeSfDict(new Map([
				['a', new SfItem(Symbol.for('b'))],
				['c', new SfItem(new SfToken('d'))],
			])),
			`a=b, c=d`,
		)
	})

	it('fails on unserializable members by default', () => {
		assert.throws(() => encodeSfDict({ a: 1, big: 10 ** 15 }))
		assert.throws(() => encodeSfDict({ a: 1, tok: new SfToken('bad token') }))
	})

	it('omits unserializable members when skipUnserializable is set', () => {
		assert.deepStrictEqual(
			encodeSfDict({ a: 1, big: 10 ** 15, tok: new SfToken('bad token'), b: 'ok' }, { skipUnserializable: true }),
			`a=1, b="ok"`,
		)
	})

	it('omits members with unserializable keys or parameters when skipUnserializable is set', () => {
		assert.deepStrictEqual(
			encodeSfDict({ 'BAD-KEY': 1, a: 2 }, { skipUnserializable: true }),
			`a=2`,
		)
		assert.deepStrictEqual(
			encodeSfDict({ a: new SfItem(true, { p: 10 ** 15 }), b: 2 }, { skipUnserializable: true }),
			`b=2`,
		)
	})

	it('returns an empty string when every member is skipped', () => {
		assert.deepStrictEqual(encodeSfDict({ big: 10 ** 15 }, { skipUnserializable: true }), ``)
	})

})
