import { isSerializableSfMember, SfItem, SfToken } from '@svta/cml-structured-field-values'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('isSerializableSfMember', () => {
	it('provides a valid example', () => {
		//#region example
		equal(isSerializableSfMember('hello'), true)
		equal(isSerializableSfMember('bad\u0000value'), false)
		equal(isSerializableSfMember(10 ** 15), false)
		//#endregion example
	})

	it('accepts every serializable bare item type', () => {
		equal(isSerializableSfMember('string'), true)
		equal(isSerializableSfMember(''), true)
		equal(isSerializableSfMember(42), true)
		equal(isSerializableSfMember(-999999999999999), true)
		equal(isSerializableSfMember(3.14), true)
		equal(isSerializableSfMember(true), true)
		equal(isSerializableSfMember(false), true)
		equal(isSerializableSfMember(new SfToken('token')), true)
		equal(isSerializableSfMember(Symbol.for('token')), true)
		equal(isSerializableSfMember(new Uint8Array([1, 2, 3])), true)
		equal(isSerializableSfMember(new Date(1_700_000_000_000)), true)
	})

	it('accepts items, inner lists and parameters', () => {
		equal(isSerializableSfMember(new SfItem('value', { p: 1 })), true)
		equal(isSerializableSfMember(['a', 'b']), true)
		equal(isSerializableSfMember([new SfItem(1, { p: 'x' }), 2]), true)
	})

	it('rejects values that fail bare item serialization', () => {
		equal(isSerializableSfMember('bad\u0000value'), false)
		equal(isSerializableSfMember(10 ** 15), false)
		equal(isSerializableSfMember(-(10 ** 15)), false)
		equal(isSerializableSfMember(1234567890123.5), false)
		equal(isSerializableSfMember(new SfToken('bad token')), false)
		equal(isSerializableSfMember(Symbol.for('bad token')), false)
		equal(isSerializableSfMember(null), false)
		equal(isSerializableSfMember(undefined), false)
		equal(isSerializableSfMember({}), false)
		equal(isSerializableSfMember(new SfItem(new SfItem('nested'))), false)
	})

	it('rejects unserializable values nested inside inner lists and parameters', () => {
		equal(isSerializableSfMember(['ok', 'bad\u0000value']), false)
		equal(isSerializableSfMember(new SfItem('value', { p: 'bad\u0000value' })), false)
		equal(isSerializableSfMember(new SfItem('value', { 'BAD-KEY': 1 })), false)
		equal(isSerializableSfMember([['nested', 'list']]), false)
	})
})
