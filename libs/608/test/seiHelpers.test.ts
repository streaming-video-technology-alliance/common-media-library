import { extractNalUnitType, isSeiNalUnitType } from '../src/utils/seiHelpers.ts'
import { equal, deepEqual } from 'node:assert'
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

describe('extractNalUnitType Tests', () => {
	// #region example
	it('should detect H.264 SEI NAL unit type (6) with 1-byte header', () => {
		// H.264 NAL header: type in bits 0-4 of byte 0
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)
		view.setUint8(0, 0x06) // H.264 SEI type = 6

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 6, headerSize: 1 })
	})

	it('should detect H.265 prefix SEI NAL unit type (39) with 2-byte header', () => {
		// H.265 NAL header: type in bits 1-6 of byte 0
		// Type 39 shifted left 1 bit: (39 << 1) = 0x4E
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)
		view.setUint8(0, 0x4E)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 39, headerSize: 2 })
	})

	it('should detect H.265 suffix SEI NAL unit type (40) with 2-byte header', () => {
		// H.265 NAL header: type in bits 1-6 of byte 0
		// Type 40 shifted left 1 bit: (40 << 1) = 0x50
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)
		view.setUint8(0, 0x50)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 40, headerSize: 2 })
	})
	// #endregion example

	it('should detect H.266 prefix SEI NAL unit type (23) with 2-byte header', () => {
		// H.266 NAL header: type in bits 3-7 of byte 1
		// Type 23 shifted left 3 bits: (23 << 3) = 0xB8
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)
		view.setUint8(0, 0x00)
		view.setUint8(1, 0xB8)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 23, headerSize: 2 })
	})

	it('should detect H.266 suffix SEI NAL unit type (24) with 2-byte header', () => {
		// H.266 NAL header: type in bits 3-7 of byte 1
		// Type 24 shifted left 3 bits: (24 << 3) = 0xC0
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)
		view.setUint8(0, 0x00)
		view.setUint8(1, 0xC0)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 24, headerSize: 2 })
	})

	it('should return null for non-SEI NAL unit types', () => {
		// H.264 NAL header with type 5 (IDR slice) — not an SEI
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)
		view.setUint8(0, 0x05)

		const result = extractNalUnitType(view, 0)
		equal(result, null)
	})
})
