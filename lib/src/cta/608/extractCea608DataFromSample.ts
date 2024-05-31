import {
	getSeiData,
	isSeiNalUnitType,
	parseCea608DataFromSei,
} from './utils/seiHelpers.js';

/**
 * Extracts CEA-608 data from a given sample.
 *
 * @param raw - The DataView with media data
 * @param startPos - The start position within the DataView
 * @param sampleSize - The size of the sample in bytes
 * @returns fieldData array containing field 1 and field 2 data arrays
 *
 * @beta
 */
export function extractCea608DataFromSample(raw: DataView, startPos: number, sampleSize: number): number[][] {
	let nalSize = 0;
	let nalType = 0;
	const fieldData: number[][] = [[], []];

	for (let cursor = startPos; cursor < startPos + sampleSize - 5; cursor += nalSize + 4) {
		nalSize = raw.getUint32(cursor, true);
		nalType = raw.getUint8(cursor + 4) & 0x1F;

		// Only process Supplemental Enhancement Information (SEI) NAL units
		if (isSeiNalUnitType(nalType)) {
			const seiData = getSeiData(raw, cursor + 5, cursor + nalSize + 4);
			parseCea608DataFromSei(seiData, fieldData);
		}
	}
	return fieldData;
}
