import { decodeBase64 } from '@svta/cml-utils/decodeBase64.js';

/**
 * Decodes a FairPlay DRM license response.
 *
 * @param response - The license response, either a base64 string or ArrayBuffer
 * @returns A Uint8Array containing the decoded license
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/fairplay/decodeFairPlayLicense.test.ts#example}
 */

export function decodeFairPlayLicense(response: string | ArrayBuffer): Uint8Array {
	return typeof response === 'string'
		? decodeBase64(response)
		: new Uint8Array(response);
}
