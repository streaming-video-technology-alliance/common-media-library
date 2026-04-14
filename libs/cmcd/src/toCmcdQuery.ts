import { CMCD_PARAM } from './CMCD_PARAM.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import { toCmcdUrl } from './toCmcdUrl.ts'

/**
 * Convert a CMCD data object to a query arg.
 *
 * @param cmcd - The CMCD object to convert.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The CMCD query arg.
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#query-argument-definition | CTA-5004-A Query Argument Definition}
 *
 * @public
 *
 * @example
 * {@includeCode ../test/toCmcdQuery.test.ts#example}
 */
export function toCmcdQuery(cmcd: Cmcd, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return ''
	}

	const value = toCmcdUrl(cmcd, options)

	return `${CMCD_PARAM}=${value}`
}
