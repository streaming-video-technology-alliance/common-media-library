import { parseCcData } from './utils/parseCcData.ts'

/**
 * Extract CTA-608 data from a DataView
 *
 * @param raw - The DataView to extract the data from
 * @param cta608Range - The range of the CTA-608 data
 * @returns The extracted CTA-608 data
 *
 * @public
 */
export function extractCta608Data(raw: DataView, cta608Range: number[]): number[][] {
	const fieldData: number[][] = [[], []]

	// Skip the 8-byte A/53 identifier up to userDataTypeCode to reach cc_data(), and bound
	// the read by the payload the range describes rather than by the whole DataView.
	parseCcData(raw, cta608Range[0] + 8, cta608Range[0] + cta608Range[1], fieldData)

	return fieldData
}
