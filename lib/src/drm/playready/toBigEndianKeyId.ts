/**
 * Converts a 16-byte key ID from little-endian to big-endian format.
 *
 * @param keyId - The little-endian key ID to convert.
 * @returns The big-endian representation of the key ID.
 *
 * @group DRM
 * @beta
 *
 * @example
 * {@includeCode ../../../test/drm/playready/toBigEndianKeyId.test.ts#example}
 */
export function toBigEndianKeyId(keyId: ArrayBuffer): ArrayBuffer {
	if (keyId.byteLength !== 16) {
		return keyId;
	}

	const buffer = keyId.slice(0);
	const dataView = new DataView(buffer);
	dataView.setUint32(0, dataView.getUint32(0, true), false);
	dataView.setUint16(4, dataView.getUint16(4, true), false);
	dataView.setUint16(6, dataView.getUint16(6, true), false);

	return buffer;
}
