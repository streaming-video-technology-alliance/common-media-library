import { base64decode } from '../../utils/base64decode.js';

/**
 * Decodes a FairPlay DRM license response.
 *
 * @param response - The license response, either a base64 string or ArrayBuffer
 * @returns A Uint8Array containing the decoded license
 *
 * @group DRM
 * @beta
 *
 * @example
 * {@includeCode ../../../test/drm/fairplay/decodeFairPlayLicense.test.ts#example}
 */

export function decodeFairPlayLicense(response: string | ArrayBuffer): Uint8Array {
	return typeof response === 'string'
		? base64decode(response)
		: new Uint8Array(response);
}
