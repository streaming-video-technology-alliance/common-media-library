import type { Encoding } from '@svta/cml-utils'
import { decodeText, UTF_16 } from '@svta/cml-utils'

/**
 * Extracts the content ID from InitData using skd:// URI or query parameters.
 *
 * @param initData - The initialization data (PSSH box)
 * @returns The extracted content ID
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/fairplay/extractContentId.test.ts#example}
 */
export function extractContentId(initData: ArrayBuffer, encoding: Encoding = UTF_16): string {
	const initDataString = decodeText(initData, { encoding })

	// Try extracting skd:// content ID
	return initDataString.split('skd://')[1] || ''
}
