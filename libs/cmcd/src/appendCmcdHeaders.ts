import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import { toCmcdHeaders } from './toCmcdHeaders.ts'

/**
 * Append CMCD query args to a header object.
 *
 * @param headers - The headers to append to.
 * @param cmcd - The CMCD object to append.
 * @param options - Encode options.
 *
 * @returns The headers with the CMCD header shards appended.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/appendCmcdHeaders.test.ts#example}
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#header-field-definition | CTA-5004-A Header Field Definition}
 */
export function appendCmcdHeaders(headers: Record<string, string>, cmcd: Cmcd, options?: CmcdEncodeOptions): Record<string, string> {
	return Object.assign(headers, toCmcdHeaders(cmcd, options))
}
