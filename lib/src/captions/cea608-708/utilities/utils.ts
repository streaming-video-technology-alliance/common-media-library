import { specialCea608CharsCodes } from './constants.js';
import { CmdHistory } from './types.js';

export const getCharForByte = function (byte: number) {
	let charCode = byte;
	if (Object.prototype.hasOwnProperty.call(specialCea608CharsCodes, byte)) {
		charCode = specialCea608CharsCodes[byte];
	}

	return String.fromCharCode(charCode);
};

export const numArrayToHexArray = function (numArray: number[]): string[] {
	const hexArray: string[] = [];
	for (let j = 0; j < numArray.length; j++) {
		hexArray.push(numArray[j].toString(16));
	}

	return hexArray;
};

export function setLastCmd(
	a: number | null,
	b: number | null,
	cmdHistory: CmdHistory,
) {
	cmdHistory.a = a;
	cmdHistory.b = b;
}

export function hasCmdRepeated(a: number, b: number, cmdHistory: CmdHistory) {
	return cmdHistory.a === a && cmdHistory.b === b;
}

export function createCmdHistory(): CmdHistory {
	return {
		a: null,
		b: null,
	};
}


export function extractCea608DataFromRange(raw: any, cea608Range: any) {
	let pos = cea608Range[0];
	const fieldData: number[][] = [[], []];

	pos += 8; // Skip the identifier up to userDataTypeCode
	const ccCount = raw.getUint8(pos) & 0x1f;
	pos += 2; // Advance 1 and skip reserved byte
    
	for (let i = 0; i < ccCount; i++) {
		const byte = raw.getUint8(pos);
		const ccValid = byte & 0x4;
		const ccType = byte & 0x3;
		pos++;
		const ccData1: number = raw.getUint8(pos); // Keep parity bit
		pos++;
		const ccData2: number = raw.getUint8(pos); // Keep parity bit
		pos++;
		if (ccValid && ((ccData1 & 0x7f) + (ccData2 & 0x7f) !== 0)) { //Check validity and non-empty data
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

export function findCea608Nalus(raw: DataView, startPos: number, size: number) {
	let nalSize = 0,
		cursor = startPos,
		nalType = 0;
	const cea608NaluRanges = [];

	// Check SEI data according to ANSI-SCTE 128
	const isCEA608SEI = function (payloadType: number, payloadSize: number, raw: DataView, pos: number) {
		if (payloadType !== 4 || payloadSize < 8) {
			return null;
		}
		const countryCode = raw.getUint8(pos);
		const providerCode = raw.getUint16(pos + 1);
		const userIdentifier = raw.getUint32(pos + 3);
		const userDataTypeCode = raw.getUint8(pos + 7);
		return countryCode == 0xB5 && providerCode == 0x31 && userIdentifier == 0x47413934 && userDataTypeCode == 0x3;
	};
	while (cursor < startPos + size) {
		nalSize = raw.getUint32(cursor);
		nalType = raw.getUint8(cursor + 4) & 0x1F;
		//console.log(time + "  NAL " + nalType);
		if (nalType === 6) {
			// SEI NAL Unit. The NAL header is the first byte
			//console.log("SEI NALU of size " + nalSize + " at time " + time);
			let pos = cursor + 5;
			let payloadType = -1;
			while (pos < cursor + 4 + nalSize - 1) { // The last byte should be rbsp_trailing_bits
				payloadType = 0;
				let b = 0xFF;
				while (b === 0xFF) {
					b = raw.getUint8(pos);
					payloadType += b;
					pos++;
				}
				let payloadSize = 0;
				b = 0xFF;
				while (b === 0xFF) {
					b = raw.getUint8(pos);
					payloadSize += b;
					pos++;
				}
				if (isCEA608SEI(payloadType, payloadSize, raw, pos)) {
					//console.log("CEA608 SEI " + time + " " + payloadSize);
					cea608NaluRanges.push([pos, payloadSize]);
				}
				pos += payloadSize;
			}
		}
		cursor += nalSize + 4;
	}
	return cea608NaluRanges;
}

