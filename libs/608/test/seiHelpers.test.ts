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
	it('should extract H.264 SEI NAL unit type (6) with 1-byte header', () => {
		// Create a DataView with H.264 NAL unit: size (4 bytes) + header (1 byte with type 6)
		const buffer = new ArrayBuffer(10)
		const view = new DataView(buffer)
		view.setUint32(0, 5) // NAL size = 5
		view.setUint8(4, 0x06) // H.264 SEI type (bits 0-4 = 6)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 6, headerSize: 1 })
	})

	it('should extract H.265 prefix SEI NAL unit type (39) with 2-byte header', () => {
		// Create a DataView with H.265 NAL unit: size (4 bytes) + header (2 bytes with type 39)
		const buffer = new ArrayBuffer(10)
		const view = new DataView(buffer)
		view.setUint32(0, 6) // NAL size = 6
		// H.265 type 39 in bits 1-6: (39 << 9) = 0x4E00
		view.setUint16(4, 0x4E00)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 39, headerSize: 2 })
	})

	it('should extract H.265 suffix SEI NAL unit type (40) with 2-byte header', () => {
		// Create a DataView with H.265 NAL unit: size (4 bytes) + header (2 bytes with type 40)
		const buffer = new ArrayBuffer(10)
		const view = new DataView(buffer)
		view.setUint32(0, 6) // NAL size = 6
		// H.265 type 40 in bits 1-6: (40 << 9) = 0x5000
		view.setUint16(4, 0x5000)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 40, headerSize: 2 })
	})

	it('should extract H.266 prefix SEI NAL unit type (23) with 2-byte header', () => {
		// Create a DataView with H.266 NAL unit: size (4 bytes) + header (2 bytes with type 23)
		const buffer = new ArrayBuffer(10)
		const view = new DataView(buffer)
		view.setUint32(0, 6) // NAL size = 6
		// H.266 type 23 in bits 1-6: (23 << 9) = 0x2E00
		view.setUint16(4, 0x2E00)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 23, headerSize: 2 })
	})

	it('should extract H.266 suffix SEI NAL unit type (24) with 2-byte header', () => {
		// Create a DataView with H.266 NAL unit: size (4 bytes) + header (2 bytes with type 24)
		const buffer = new ArrayBuffer(10)
		const view = new DataView(buffer)
		view.setUint32(0, 6) // NAL size = 6
		// H.266 type 24 in bits 1-6: (24 << 9) = 0x3000
		view.setUint16(4, 0x3000)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 24, headerSize: 2 })
	})

	it('should extract non-SEI H.264 NAL unit type with 1-byte header', () => {
		// Create a DataView with H.264 NAL unit: type 5 (IDR slice)
		const buffer = new ArrayBuffer(10)
		const view = new DataView(buffer)
		view.setUint32(0, 5) // NAL size = 5
		view.setUint8(4, 0x05) // H.264 IDR type (bits 0-4 = 5)

		const result = extractNalUnitType(view, 0)
		deepEqual(result, { nalType: 5, headerSize: 1 })
	})
})
