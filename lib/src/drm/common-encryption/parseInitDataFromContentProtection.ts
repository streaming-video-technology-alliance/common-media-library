import type { ContentProtection } from '../models/ContentProtection.js';

/**
 * Parse a standard common encryption PSSH which contains a simple
 * base64-encoding of the init data
 *
 * @param cpData - The ContentProtection element that may contain PSSH data.
 * @param BASE64 - The BASE64 reference.
 * @returns init data as an ArrayBuffer, or null if not found.
 *
 * @group DRM
 * @beta
 */
export function parseInitDataFromContentProtection(
	cpData: ContentProtection,
	BASE64: { decodeArray: (input: string) => Uint8Array },
): ArrayBuffer | null {
	if (cpData?.pssh && cpData.pssh.__text) {
		const cleanedText = cpData.pssh.__text.replace(/\r?\n|\r/g, '').replace(/\s+/g, '');
		return BASE64.decodeArray(cleanedText).buffer as ArrayBuffer;;
	}

	return null;
}
