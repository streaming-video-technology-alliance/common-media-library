export function getSeiData(raw: DataView, startPos: number, endPos: number): DataView {
	const data: number[] = [];

	for (let cursor = startPos; cursor < endPos; cursor++) {
		if (cursor + 2 < endPos && raw.getUint8(cursor) === 0x00 && raw.getUint8(cursor + 1) === 0x00 && raw.getUint8(cursor + 2) === 0x03) {
			data.push(0x00);
			data.push(0x00);
			cursor += 2;
		} 
		else {
			data.push(raw.getUint8(cursor));
		}
	}

	return new DataView(new Uint8Array(data).buffer);
}

export function isCea608Sei(payloadType: number, payloadSize: number, sei: DataView, pos: number): boolean {
	if (payloadType !== 4 || payloadSize < 8) {
		return false;
	}

	const countryCode = sei.getUint8(pos);
	if (countryCode !== 0xB5) {
		return false;
	}

	const providerCode = sei.getUint16(pos + 1);
	if (providerCode !== 0x0031) {
		return false;
	}

	const userIdentifier = sei.getUint32(pos + 3);
	if (userIdentifier !== 0x47413934) {
		return false;
	}

	const userDataTypeCode = sei.getUint8(pos + 7);
	if (userDataTypeCode !== 0x03) {
		return false;
	}

	return true;
}

export function isCCType(type: number): boolean {
	return type === 0 || type === 1;
}

export function isNonEmptyCCData(ccData1: number, ccData2: number): boolean {
	return (ccData1 & 0x7F) > 0 || (ccData2 & 0x7F) > 0;
}

export function isSeiNalUnitType(unitType: number): boolean {
	return unitType === 0x06;
}

export function parseCta608DataFromSei(sei: DataView, fieldData: number[][]): void {
	let cursor = 0;
	while (cursor < sei.byteLength) {
		let payloadType = 0;
		let payloadSize = 0;
		let now;

		do {
			payloadType += now = sei.getUint8(cursor++);
		} while (now === 0xFF);
		do {
			payloadSize += now = sei.getUint8(cursor++);
		} while (now === 0xFF);

		if (isCea608Sei(payloadType, payloadSize, sei, cursor)) {
			const pos = cursor + 10;
			const ccCount = pos + (sei.getUint8(pos - 2) & 0x1F) * 3;
			for (let i = pos; i < ccCount; i += 3) {
				const byte = sei.getUint8(i);
				if (byte & 0x04) {
					const ccType = byte & 0x03;
					if (isCCType(ccType)) {
						const ccData1 = sei.getUint8(i + 1);
						const ccData2 = sei.getUint8(i + 2);
						if (isNonEmptyCCData(ccData1, ccData2)) {
							fieldData[ccType].push(ccData1, ccData2);
						}
					}
				}
			}
		}
		cursor += payloadSize;
	}
}
