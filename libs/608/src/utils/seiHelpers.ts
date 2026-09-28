import { isCta608UserData } from './isCta608UserData.ts'
import { parseCcData } from './parseCcData.ts'

export function getSeiData(raw: DataView, startPos: number, endPos: number): DataView {
	const data: number[] = []

	for (let cursor = startPos; cursor < endPos; cursor++) {
		if (cursor + 2 < endPos && raw.getUint8(cursor) === 0x00 && raw.getUint8(cursor + 1) === 0x00 && raw.getUint8(cursor + 2) === 0x03) {
			data.push(0x00)
			data.push(0x00)
			cursor += 2
		} 
		else {
			data.push(raw.getUint8(cursor))
		}
	}

	return new DataView(new Uint8Array(data).buffer)
}

export function isCea608Sei(payloadType: number, payloadSize: number, sei: DataView, pos: number): boolean {
	// user_data_registered_itu_t_t35 is payload type 4, and the A/53 identifier is 8 bytes.
	if (payloadType !== 4 || payloadSize < 8) {
		return false
	}

	return isCta608UserData(sei, pos)
}

/**
 * H.264 SEI NAL unit type
 */
const H264_SEI_TYPE = 0x06

/**
 * H.265 prefix SEI NAL unit type
 */
const H265_PREFIX_SEI_TYPE = 39

/**
 * H.265 suffix SEI NAL unit type
 */
const H265_SUFFIX_SEI_TYPE = 40

/**
 * H.266 prefix SEI NAL unit type
 */
const H266_PREFIX_SEI_TYPE = 23

/**
 * H.266 suffix SEI NAL unit type
 */
const H266_SUFFIX_SEI_TYPE = 24

/**
 * Check if a NAL unit type is an SEI (Supplemental Enhancement Information) unit
 * for H.264, H.265, or H.266 codecs.
 *
 * @param unitType - The NAL unit type to check
 * @returns true if the unit type is an SEI NAL unit type for any supported codec
 */
export function isSeiNalUnitType(unitType: number): boolean {
	return unitType === H264_SEI_TYPE ||
		unitType === H265_PREFIX_SEI_TYPE ||
		unitType === H265_SUFFIX_SEI_TYPE ||
		unitType === H266_PREFIX_SEI_TYPE ||
		unitType === H266_SUFFIX_SEI_TYPE
}

/**
 * Detects whether a NAL unit is an SEI (Supplemental Enhancement Information) unit
 * and returns its type and header size.
 *
 * This function supports auto-detection across H.264, H.265, and H.266 codecs:
 * - H.264: 1-byte NAL header, type in bits 0-4
 * - H.265: 2-byte NAL header, type in bits 1-6 of byte 0
 * - H.266: 2-byte NAL header, type in bits 3-7 of byte 1
 *
 * @param raw - The DataView containing the NAL unit data
 * @param pos - The position of the first NAL header byte
 * @returns An object containing the NAL unit type and header size, or null if not an SEI NAL unit
 */
export function extractNalUnitType(raw: DataView, pos: number): { nalType: number; headerSize: number } | null {
	const byte0 = raw.getUint8(pos)

	// H.264: 1-byte header, type in bits 0-4
	const h264Type = byte0 & 0x1F
	if (h264Type === H264_SEI_TYPE) {
		return { nalType: h264Type, headerSize: 1 }
	}

	// H.265: 2-byte header, type in bits 1-6 of byte 0
	const h265Type = (byte0 >> 1) & 0x3F
	if (h265Type === H265_PREFIX_SEI_TYPE || h265Type === H265_SUFFIX_SEI_TYPE) {
		return { nalType: h265Type, headerSize: 2 }
	}

	// H.266: 2-byte header, type in bits 3-7 of byte 1
	if (pos + 1 >= raw.byteLength) {
		return null
	}
	const byte1 = raw.getUint8(pos + 1)
	const h266Type = (byte1 >> 3) & 0x1F
	if (h266Type === H266_PREFIX_SEI_TYPE || h266Type === H266_SUFFIX_SEI_TYPE) {
		return { nalType: h266Type, headerSize: 2 }
	}

	return null
}

export function parseCta608DataFromSei(sei: DataView, fieldData: number[][]): void {
	let cursor = 0
	// The last byte is rbsp_trailing_bits, so stop before it
	while (cursor < sei.byteLength - 1) {
		let payloadType = 0
		let payloadSize = 0
		let now

		do {
			payloadType += now = sei.getUint8(cursor++)
		} while (now === 0xFF)
		do {
			payloadSize += now = sei.getUint8(cursor++)
		} while (now === 0xFF)

		if (isCea608Sei(payloadType, payloadSize, sei, cursor)) {
			// Skip the 8-byte A/53 identifier to reach cc_data(). The read is bounded by this
			// SEI message, so a wrong cc_count cannot consume the message that follows it.
			parseCcData(sei, cursor + 8, cursor + payloadSize, fieldData)
		}
		cursor += payloadSize
	}
}
