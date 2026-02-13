import {
	getSeiData,
	isSeiNalUnitType,
	parseCta608DataFromSei,
} from './utils/seiHelpers.ts'

/**
 * Extracts CEA-608 data from a given sample.
 *
 * @param raw - The DataView with media data
 * @param startPos - The start position within the DataView
 * @param sampleSize - The size of the sample in bytes
 * @returns fieldData array containing field 1 and field 2 data arrays
 *
 * @public
 */
export function extractCta608DataFromSample(raw: DataView, startPos: number, sampleSize: number): number[][] {
	let nalSize: number = 0
	let nalType: number = 0
	const fieldData: number[][] = [[], []]

	for (let cursor = startPos; cursor < startPos + sampleSize - 5; cursor++) {
		nalSize = raw.getUint32(cursor)
		
		// Try H.264 format first (1-byte header): type is in bits 0-4
		nalType = raw.getUint8(cursor + 4) & 0x1F
		
		// If not an H.264 SEI, try H.265/H.266 format (2-byte header): type is in bits 1-6 of first byte
		if (!isSeiNalUnitType(nalType) && cursor + 5 < raw.byteLength) {
			const naluHeader = raw.getUint16(cursor + 4)
			nalType = (naluHeader >> 9) & 0x3F
		}

		// Make sure that we don't go out of bounds
		if (cursor + 5 + nalSize > startPos + sampleSize) {
			break
		}

		// Only process Supplemental Enhancement Information (SEI) NAL units
		if (isSeiNalUnitType(nalType)) {
			if (cursor + 5 + nalSize <= raw.byteLength) {
				const seiData = getSeiData(raw, cursor + 5, cursor + 5 + nalSize)
				parseCta608DataFromSei(seiData, fieldData)
			}
		}

		// Jump to the next NAL unit
		cursor += nalSize + 3
	}
	return fieldData
}
