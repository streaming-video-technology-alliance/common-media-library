import { extractCta608Data } from '@svta/cml-608'
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { parseCcData } from '../src/utils/parseCcData.ts'
import { parseCta608DataFromSei } from '../src/utils/seiHelpers.ts'

/**
 * The 8-byte ATSC A/53 user identifier that prefixes every `cc_data()` payload.
 */
const GA94 = [0xB5, 0x00, 0x31, 0x47, 0x41, 0x39, 0x34, 0x03]

/**
 * A cc construct header with cc_valid set and cc_type 0 (field 1).
 */
const VALID_FIELD_1 = 0xFC

function toView(bytes: number[]): DataView {
	return new DataView(new Uint8Array(bytes).buffer)
}

describe('parseCcData bounds', () => {
	// #region example
	it('should read no further than the cc constructs that fit within endPos', () => {
		// cc_count claims 5 constructs, but endPos admits only the first one.
		const raw = toView([
			0x05, 0xFF, // cc_count = 5, em_data
			VALID_FIELD_1, 0x41, 0x42, // "AB"
			VALID_FIELD_1, 0x43, 0x44, // "CD" — beyond endPos
		])
		const fieldData: number[][] = [[], []]

		parseCcData(raw, 0, 5, fieldData)

		deepEqual(fieldData, [[0x41, 0x42], []])
	})
	// #endregion example

	it('should return without reading when cc_count and em_data do not fit', () => {
		// A T.35 payload carrying nothing but the identifier: reading cc_count at pos 8
		// would run past the end of the DataView.
		const raw = toView(GA94)
		const fieldData: number[][] = [[], []]

		parseCcData(raw, 8, 8, fieldData)

		deepEqual(fieldData, [[], []])
	})
})

describe('parseCta608DataFromSei bounds', () => {
	it('should not read past the buffer for a payload holding only the identifier', () => {
		// payloadType 4, payloadSize 8 — the A/53 identifier and nothing else, ending flush
		// with the buffer, so cc_data() starts exactly at sei.byteLength.
		const sei = toView([0x04, 0x08, ...GA94])
		const fieldData: number[][] = [[], []]

		parseCta608DataFromSei(sei, fieldData)

		deepEqual(fieldData, [[], []])
	})

	it('should not let a wrong cc_count consume the SEI message that follows', () => {
		const sei = toView([
			0x04, 0x0D, // payloadType 4, payloadSize 13
			...GA94,
			0x05, 0xFF, // cc_count = 5, but only one construct is inside this payload
			VALID_FIELD_1, 0x41, 0x42, // "AB"
			0x05, 0x03, // next message: payloadType 5, payloadSize 3
			VALID_FIELD_1, 0x43, 0x44, // its payload, which is not caption data
			0x80, // rbsp_trailing_bits
		])
		const fieldData: number[][] = [[], []]

		parseCta608DataFromSei(sei, fieldData)

		// Unbounded, the next message's header reads as a valid field 2 construct.
		deepEqual(fieldData, [[0x41, 0x42], []])
	})
})

describe('extractCta608Data bounds', () => {
	it('should not read past the payload the range describes', () => {
		const raw = toView([
			...GA94,
			0x05, 0xFF, // cc_count = 5, but only one construct is inside the payload
			VALID_FIELD_1, 0x41, 0x42, // "AB"
			VALID_FIELD_1, 0x43, 0x44, // "CD" — outside the range
		])

		// findCta608Nalus returns [pos, payloadSize]; this payload is 13 bytes from 0.
		deepEqual(extractCta608Data(raw, [0, 13]), [[0x41, 0x42], []])
	})
})
