import { isSeiNalUnitType } from '../src/utils/seiHelpers.ts'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('isSeiNalUnitType Tests', () => {
	// #region example
	it('should return true for H.264 SEI NAL unit type (0x06)', () => {
		equal(isSeiNalUnitType(0x06), true)
	})

	it('should return true for H.265 prefix SEI NAL unit type (39)', () => {
		equal(isSeiNalUnitType(39), true)
	})

	it('should return true for H.265 suffix SEI NAL unit type (40)', () => {
		equal(isSeiNalUnitType(40), true)
	})

	it('should return true for H.266 prefix SEI NAL unit type (23)', () => {
		equal(isSeiNalUnitType(23), true)
	})

	it('should return true for H.266 suffix SEI NAL unit type (24)', () => {
		equal(isSeiNalUnitType(24), true)
	})
	// #endregion example

	it('should return false for non-SEI NAL unit types', () => {
		equal(isSeiNalUnitType(0), false)
		equal(isSeiNalUnitType(1), false)
		equal(isSeiNalUnitType(5), false)
		equal(isSeiNalUnitType(7), false)
		equal(isSeiNalUnitType(8), false)
		equal(isSeiNalUnitType(10), false)
		equal(isSeiNalUnitType(20), false)
		equal(isSeiNalUnitType(25), false)
		equal(isSeiNalUnitType(30), false)
		equal(isSeiNalUnitType(38), false)
		equal(isSeiNalUnitType(41), false)
		equal(isSeiNalUnitType(50), false)
	})
})
