import {
	detectSeiNalu,
	getSeiData,
	parseCta608DataFromSei,
} from './utils/seiHelpers.ts'

/**
 * Extracts CEA-608 data from a given sample.
 *
 * Supports H.264, H.265, and H.266 bitstreams by auto-detecting the NAL unit
 * header format and SEI type.
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

	for (let cursor = startPos; cursor < startPos + sampleSize - 5; cursor++) {
		nalSize = raw.getUint32(cursor)

		// Make sure that we don't go out of bounds
		if (cursor + 4 + nalSize > startPos + sampleSize) {
			break
		}

		// Detect SEI NAL unit type across H.264, H.265, and H.266
		const seiInfo = detectSeiNalu(raw, cursor + 4)

		if (seiInfo) {
			const seiStart = cursor + 4 + seiInfo.headerSize
			// Exclude the last byte (RBSP trailing bits) from the SEI payload
			const seiEnd = cursor + 4 + nalSize - 1
			if (seiEnd <= raw.byteLength && seiStart < seiEnd) {
				const seiData = getSeiData(raw, seiStart, seiEnd)
				parseCta608DataFromSei(seiData, fieldData)
			}
		}

		// Jump to the next NAL unit
		cursor += nalSize + 3
	}
	return fieldData
}
