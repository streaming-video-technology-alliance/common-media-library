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
 * H.264 SEI NAL unit type.
 */
const H264_SEI = 0x06

/**
 * H.265 SEI prefix NAL unit type.
 */
const H265_PREFIX_SEI = 0x27

/**
 * H.265 SEI suffix NAL unit type.
 */
const H265_SUFFIX_SEI = 0x28

/**
 * H.266 SEI prefix NAL unit type.
 */
const H266_PREFIX_SEI = 0x17

/**
 * H.266 SEI suffix NAL unit type.
 */
const H266_SUFFIX_SEI = 0x18

/**
 * Determines the NAL unit type and header size from a raw data view at a given position.
 *
 * This function attempts to detect the codec format (H.264, H.265, or H.266) by
 * extracting the NAL unit type using each format's header layout and checking
 * whether it corresponds to an SEI NAL unit type for that format.
 *
 * @param raw - The DataView containing the NAL unit data
 * @param pos - The position of the first byte of the NAL unit header (after the length prefix)
 * @returns An object with `nalType` and `headerSize`, or `null` if no SEI type was detected
 *
 * @public
 */
export function detectSeiNalu(raw: DataView, pos: number): { nalType: number, headerSize: number } | null {
	const byte0 = raw.getUint8(pos)

	// H.264: 1-byte header, type in bits 0-4
	const h264Type = byte0 & 0x1F
	if (h264Type === H264_SEI) {
		return { nalType: h264Type, headerSize: 1 }
	}

	// H.265: 2-byte header, type in bits 1-6 of byte 0
	const h265Type = (byte0 >> 1) & 0x3F
	if (h265Type === H265_PREFIX_SEI || h265Type === H265_SUFFIX_SEI) {
		return { nalType: h265Type, headerSize: 2 }
	}

	// H.266: 2-byte header, type in bits 3-7 of byte 1
	const byte1 = raw.getUint8(pos + 1)
	const h266Type = (byte1 >> 3) & 0x1F
	if (h266Type === H266_PREFIX_SEI || h266Type === H266_SUFFIX_SEI) {
		return { nalType: h266Type, headerSize: 2 }
	}

	return null
}

export function isSeiNalUnitType(unitType: number): boolean {
	return unitType === H264_SEI
		|| unitType === H265_PREFIX_SEI || unitType === H265_SUFFIX_SEI
		|| unitType === H266_PREFIX_SEI || unitType === H266_SUFFIX_SEI
}

export function parseCta608DataFromSei(sei: DataView, fieldData: number[][]): void {
	let cursor = 0
	while (cursor < sei.byteLength) {
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
