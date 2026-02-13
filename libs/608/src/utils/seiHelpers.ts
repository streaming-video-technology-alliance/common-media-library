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
	if (payloadType !== 4 || payloadSize < 8) {
		return false
	}

	const countryCode = sei.getUint8(pos)
	if (countryCode !== 0xB5) {
		return false
	}

	const providerCode = sei.getUint16(pos + 1)
	if (providerCode !== 0x0031) {
		return false
	}

	const userIdentifier = sei.getUint32(pos + 3)
	if (userIdentifier !== 0x47413934) {
		return false
	}

	const userDataTypeCode = sei.getUint8(pos + 7)
	if (userDataTypeCode !== 0x03) {
		return false
	}

	return true
}

export function isCCType(type: number): boolean {
	return type === 0 || type === 1
}

export function isNonEmptyCCData(ccData1: number, ccData2: number): boolean {
	return (ccData1 & 0x7F) > 0 || (ccData2 & 0x7F) > 0
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
			const pos = cursor + 10
			const ccCount = pos + (sei.getUint8(pos - 2) & 0x1F) * 3
			for (let i = pos; i < ccCount; i += 3) {
				const byte = sei.getUint8(i)
				if (byte & 0x04) {
					const ccType = byte & 0x03
					if (isCCType(ccType)) {
						const ccData1 = sei.getUint8(i + 1)
						const ccData2 = sei.getUint8(i + 2)
						if (isNonEmptyCCData(ccData1, ccData2)) {
							fieldData[ccType].push(ccData1, ccData2)
						}
					}
				}
			}
		}
		cursor += payloadSize
	}
}
