import { decodeText } from '../../utils/decodeText.js';
import type { Encoding } from '../../utils/Encoding.js';
import { UTF_16 } from '../../utils/UTF_16.js';

/**
 * Extracts the content ID from InitData using skd:// URI or query parameters.
 *
 * @param initData - The initialization data (PSSH box)
 * @returns The extracted content ID
 *
 * @group DRM
 * @beta
 *
 * @example
 * {@includeCode ../../../test/drm/fairplay/extractContentId.test.ts#example}
 */
export function extractContentId(initData: ArrayBuffer, encoding: Encoding = UTF_16): string {
	const initDataString = decodeText(initData, { encoding });

	// Try extracting skd:// content ID
	return initDataString.split('skd://')[1] || '';
}
