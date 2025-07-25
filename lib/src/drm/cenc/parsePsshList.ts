/**
 * Parses a list of PSSH boxes into keysystem-specific PSSH data.
 *
 * @param data - The concatenated list of PSSH boxes as provided by
 * the CDM as initialization data when CommonEncryption content is detected
 * @returns An object that has a property named according to each of
 * the detected key system UUIDs (e.g. 00000000-0000-0000-0000-0000000000)
 * and a ArrayBuffer (the entire PSSH box) as the property value
 *
 * @group DRM
 * @beta
 *
 * @example
 * {@includeCode ../../../test/drm/cenc/parsePsshList.test.ts#example}
 */
export function parsePsshList(data: ArrayBuffer): Record<string, ArrayBuffer> {
	if (!data) {
		return {};
	}

	// data.buffer first for Uint8Array support
	const dv = new DataView(data instanceof ArrayBuffer ? data : (data as Uint8Array).buffer);
	const pssh: Record<string, ArrayBuffer> = {};
	let byteCursor = 0;

	while (true) {
		if (byteCursor >= dv.byteLength) {
			break;
		}

		const boxStart = byteCursor;

		// Box size
		const size = dv.getUint32(byteCursor);
		const nextBox = byteCursor + size;
		byteCursor += 4;

		// Verify PSSH
		if (dv.getUint32(byteCursor) !== 0x70737368) {
			byteCursor = nextBox;
			continue;
		}
		byteCursor += 4;

		// Version must be 0 or 1
		const version = dv.getUint8(byteCursor);
		if (version !== 0 && version !== 1) {
			byteCursor = nextBox;
			continue;
		}

		byteCursor += 1; // Move past version
		byteCursor += 3; // Skip flags

		// 16-byte UUID/SystemID
		let systemID = '';
		let val: string;

		for (let i = 0; i < 4; i++) {
			val = dv.getUint8(byteCursor + i).toString(16);
			systemID += val.length === 1 ? '0' + val : val;
		}
		byteCursor += 4;
		systemID += '-';

		for (let i = 0; i < 2; i++) {
			val = dv.getUint8(byteCursor + i).toString(16);
			systemID += val.length === 1 ? '0' + val : val;
		}
		byteCursor += 2;
		systemID += '-';

		for (let i = 0; i < 2; i++) {
			val = dv.getUint8(byteCursor + i).toString(16);
			systemID += val.length === 1 ? '0' + val : val;
		}
		byteCursor += 2;
		systemID += '-';

		for (let i = 0; i < 2; i++) {
			val = dv.getUint8(byteCursor + i).toString(16);
			systemID += val.length === 1 ? '0' + val : val;
		}
		byteCursor += 2;
		systemID += '-';

		for (let i = 0; i < 6; i++) {
			val = dv.getUint8(byteCursor + i).toString(16);
			systemID += val.length === 1 ? '0' + val : val;
		}
		byteCursor += 6;

		systemID = systemID.toLowerCase();

		// PSSH Data Size
		byteCursor += 4;

		// PSSH boxdata
		pssh[systemID] = data.slice(boxStart, nextBox);

		byteCursor = nextBox;
	}

	return pssh;
}

