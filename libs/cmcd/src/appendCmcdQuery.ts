import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import { encodeCmcd } from './encodeCmcd.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'

/**
 * Append CMCD query args to a URL.
 *
 * If the URL has a `CMCD` parameter, the new value replaces it in place. The
 * other parameters and the fragment stay as they are. If the data has no keys
 * to send, the function returns the URL unchanged.
 *
 * @param url - The URL to append to.
 * @param cmcd - The CMCD object to append.
 * @param options - Options for encoding.
 *
 * @returns The URL with the CMCD query args appended.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/appendCmcdQuery.test.ts#example}
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#query-argument-definition | CTA-5004-B Query Argument Definition}
 */
export function appendCmcdQuery(url: string, cmcd: Cmcd, options?: CmcdEncodeOptions): string {
	const value = cmcd ? encodeCmcd(cmcd, options) : ''

	return value ? replaceCmcdParam(url, value) : url
}
