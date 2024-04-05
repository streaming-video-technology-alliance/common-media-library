
export function findCta608Nalus(raw: DataView, startPos: number, size: number): Array<Array<number>> {
	let nalSize = 0, cursor = startPos, nalType = 0;
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
		return countryCode == 181 && providerCode == 49 && userIdentifier == 1195456820 && userDataTypeCode == 3;
	};

	while (cursor < startPos + size) {
		nalSize = raw.getUint32(cursor);
		nalType = raw.getUint8(cursor + 4) & 31;
		//console.log(time + "  NAL " + nalType);
		if (nalType === 6) {
			// SEI NAL Unit. The NAL header is the first byte
			//console.log("SEI NALU of size " + nalSize + " at time " + time);
			let pos = cursor + 5;
			let payloadType = -1;
			while (pos < cursor + 4 + nalSize - 1) { // The last byte should be rbsp_trailing_bits
				payloadType = 0;
				let b = 255;
				while (b === 255) {
					b = raw.getUint8(pos);
					payloadType += b;
					pos++;
				}
				let payloadSize = 0;
				b = 255;
				while (b === 255) {
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
