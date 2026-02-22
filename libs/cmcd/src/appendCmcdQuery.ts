import type { Cmcd } from './Cmcd.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import { toCmcdQuery } from './toCmcdQuery.ts'

const REGEX = /CMCD=[^&#]+/

/**
 * Append CMCD query args to a URL.
 *
 * @param url - The URL to append to.
 * @param cmcd - The CMCD object to append.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The URL with the CMCD query args appended.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/appendCmcdQuery.test.ts#example}
 */
export function appendCmcdQuery(url: string, cmcd: Cmcd, options?: CmcdEncodeOptions): string {
	const query = toCmcdQuery(cmcd, options)
	if (!query) {
		return url
	}

	if (REGEX.test(url)) {
		return url.replace(REGEX, query)
	}

	const separator = url.includes('?') ? '&' : '?'
	return `${url}${separator}${query}`
}
