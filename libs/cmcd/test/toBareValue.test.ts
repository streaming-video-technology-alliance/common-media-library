import { SfItem } from '@svta/cml-structured-field-values'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { toBareValue } from '../src/toBareValue.ts'

describe('toBareValue', () => {
	it('provides a valid example', () => {
		// #region example
		const value = toBareValue(new SfItem(1000, { x: true }))
		equal(value, 1000)
		// #endregion example
	})

	it('returns the list inside an SfItem that wraps a list', () => {
		const list = toBareValue(new SfItem([1200, 3400], { p: 2 })) as SfItem<number>[]
		deepEqual(list.map(item => item.value), [1200, 3400])
	})

	it('returns any other value unchanged', () => {
		const list = [1200]
		equal(toBareValue(list), list)
		equal(toBareValue('abc'), 'abc')
		equal(toBareValue(undefined), undefined)
	})
})
