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
