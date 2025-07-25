/**
 * Returns the data portion of a single PSSH box.
 *
 * @param pssh - The PSSH ArrayBuffer.
 * @returns The data portion of the PSSH.
 *
 * @group DRM
 * @beta
 *
 * @example
 * {@includeCode ../../../test/drm/cenc/getPsshData.test.ts#example}
 */
export function getPsshData(pssh: ArrayBuffer): ArrayBuffer {
	const offset = 8; // Box size and type fields
	const view = new DataView(pssh);

	const version = view.getUint8(offset); // Read version
	let dataOffset = offset + 20;

	if (version > 0) {
		const kidCount = view.getUint32(dataOffset);
		dataOffset += 4 + (16 * kidCount);
	}

	dataOffset += 4; // Data size
	return pssh.slice(dataOffset);
}

