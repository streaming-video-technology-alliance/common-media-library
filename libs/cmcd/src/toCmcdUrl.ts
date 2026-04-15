import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import { encodeCmcd } from './encodeCmcd.ts'

/**
 * Convert a CMCD data object to a URL encoded string.
 *
 * @param cmcd - The CMCD object to convert.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The URL encoded CMCD data.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#query-argument-definition | CTA-5004-B Query Argument Definition}
 *
 * @public
 */
export function toCmcdUrl(cmcd: Cmcd, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return ''
	}

	const params = encodeCmcd(cmcd, options)

	return encodeURIComponent(params)
}
