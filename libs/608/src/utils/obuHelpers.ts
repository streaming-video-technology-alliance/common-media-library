import { isCta608UserData } from './isCta608UserData.ts'
import { parseCcData } from './parseCcData.ts'

/**
 * AV1 `OBU_METADATA` unit type
 */
const OBU_METADATA = 5

/**
 * AV1 `METADATA_TYPE_ITUT_T35` metadata type
 */
const METADATA_TYPE_ITUT_T35 = 4

/**
 * The maximum number of bytes in an AV1 leb128() value
 */
const LEB128_MAX_BYTES = 8

/**
 * A decoded AV1 leb128() value and the number of bytes it occupied.
 */
type Leb128 = {
	readonly value: number
	readonly size: number
}

/**
 * Read an AV1 `leb128()` variable-length integer (AV1 spec section 4.10.5): up to 8
 * bytes, 7 value bits each, least significant group first, with the high bit marking
 * continuation.
 *
 * Groups are combined by multiplication rather than by `<<`, because a leb128 value may
 * exceed the 32 bits a JavaScript shift operates on.
 *
 * @param raw - The DataView to read from
 * @param pos - The position of the first leb128 byte
 * @param endPos - The exclusive upper bound to read within
 * @returns The value and its byte length, or null when it is truncated or overlong
 */
export function readLeb128(raw: DataView, pos: number, endPos: number): Leb128 | null {
	let value = 0

	for (let i = 0; i < LEB128_MAX_BYTES; i++) {
		if (pos + i >= endPos) {
			return null
		}

		const byte = raw.getUint8(pos + i)
		value += (byte & 0x7F) * 2 ** (i * 7)

		if (!(byte & 0x80)) {
			return { value, size: i + 1 }
		}
	}

	return null
}

/**
 * Detects whether an AV1 OBU header starts an `OBU_METADATA` unit and locates its
 * payload.
 *
 * The header is one byte — `obu_forbidden_bit` (1), `obu_type` (4),
 * `obu_extension_flag` (1), `obu_has_size_field` (1), `obu_reserved_1bit` (1) — followed
 * by an optional extension byte and, when `obu_has_size_field` is set, `obu_size` as a
 * leb128. An OBU without `obu_size` runs to the end of the temporal unit, which mp4
 * permits only for the final OBU in a sample.
 *
 * @param raw - The DataView containing the OBU
 * @param pos - The position of the OBU header byte
 * @param endPos - The exclusive end of the enclosing sample
 * @returns The payload bounds and whether this is a metadata OBU, or null if malformed
 */
export function readObu(raw: DataView, pos: number, endPos: number): { isMetadata: boolean; payloadStart: number; payloadEnd: number } | null {
	const header = raw.getUint8(pos)

	// obu_forbidden_bit must be zero; a set bit means this is not an OBU stream.
	if (header & 0x80) {
		return null
	}

	let payloadStart = pos + 1

	// obu_extension_flag adds a byte of temporal_id / spatial_id.
	if (header & 0x04) {
		payloadStart++
	}

	let payloadEnd = endPos

	// obu_has_size_field
	if (header & 0x02) {
		const obuSize = readLeb128(raw, payloadStart, endPos)
		if (!obuSize) {
			return null
		}

		payloadStart += obuSize.size
		payloadEnd = payloadStart + obuSize.value

		if (payloadEnd > endPos) {
			return null
		}
	}

	return {
		isMetadata: ((header >> 3) & 0x0F) === OBU_METADATA,
		payloadStart,
		payloadEnd,
	}
}

/**
 * Parse CTA-608 field data out of an AV1 metadata OBU payload, ignoring metadata OBUs
 * of any other type.
 *
 * The payload is `metadata_type` as a leb128, then — for ITU-T T.35 — the 8-byte A/53
 * user identifier and the `cc_data()` structure. Unlike an SEI NAL unit an OBU carries
 * no emulation prevention, so the bytes are read verbatim.
 *
 * @param raw - The DataView containing the OBU payload
 * @param pos - The position of `metadata_type`
 * @param endPos - The exclusive end of the OBU payload
 * @param fieldData - Field 1 and field 2 byte arrays, appended to in place
 */
export function parseCta608DataFromMetadataObu(raw: DataView, pos: number, endPos: number, fieldData: number[][]): void {
	const metadataType = readLeb128(raw, pos, endPos)
	if (!metadataType || metadataType.value !== METADATA_TYPE_ITUT_T35) {
		return
	}

	const userDataStart = pos + metadataType.size

	// The 8-byte identifier plus at least the cc_count and em_data bytes must be present.
	if (userDataStart + 10 > endPos || !isCta608UserData(raw, userDataStart)) {
		return
	}

	parseCcData(raw, userDataStart + 8, endPos, fieldData)
}
