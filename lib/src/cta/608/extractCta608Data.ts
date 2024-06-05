
export function extractCta608Data(raw: DataView, cea608Range: Array<number>): Array<Array<number>> {
	let pos = cea608Range[0];
	const fieldData: number[][] = [[], []];

	pos += 8; // Skip the identifier up to userDataTypeCode
	const ccCount = raw.getUint8(pos) & 31;
	pos += 2; // Advance 1 and skip reserved byte

	for (let i = 0; i < ccCount; i++) {
		const byte = raw.getUint8(pos);
		const ccValid = byte & 4;
		const ccType = byte & 3;
		pos++;
		const ccData1: number = raw.getUint8(pos); // Keep parity bit
		pos++;
		const ccData2: number = raw.getUint8(pos); // Keep parity bit
		pos++;
		if (ccValid && ((ccData1 & 127) + (ccData2 & 127) !== 0)) { //Check validity and non-empty data
			if (ccType === 0) {
				fieldData[0].push(ccData1);
				fieldData[0].push(ccData2);
			}
			else if (ccType === 1) {
				fieldData[1].push(ccData1);
				fieldData[1].push(ccData2);
			}
		}
	}
	return fieldData;
}
