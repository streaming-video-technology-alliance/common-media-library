import {
	extractNalUnitType,
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
	const fieldData: number[][] = [[], []]

	// Loop needs to account for maximum NALU header size (H.265/H.266 = 6 bytes: 4-byte size + 2-byte header)
	for (let cursor = startPos; cursor < startPos + sampleSize - 6; cursor++) {
		nalSize = raw.getUint32(cursor)

		const nalUnitInfo = extractNalUnitType(raw, cursor)
		if (!nalUnitInfo) {
			continue
		}

		const { nalType, headerSize } = nalUnitInfo

		// Make sure that we don't go out of bounds
		if (cursor + 4 + headerSize + nalSize > startPos + sampleSize) {
			break
		}

		// Only process Supplemental Enhancement Information (SEI) NAL units
		if (isSeiNalUnitType(nalType)) {
			const seiStart = cursor + 4 + headerSize
			if (seiStart + nalSize <= raw.byteLength) {
				const seiData = getSeiData(raw, seiStart, seiStart + nalSize)
				parseCta608DataFromSei(seiData, fieldData)
			}
		}

		// Jump to the next NAL unit
		cursor += nalSize + 3
	}
	return fieldData
}
