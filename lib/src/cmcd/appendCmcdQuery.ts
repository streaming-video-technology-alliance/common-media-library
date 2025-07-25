import type { Cmcd } from './Cmcd.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { toCmcdQuery } from './toCmcdQuery.js';

const REGEX = /CMCD=[^&#]+/;

/**
 * Append CMCD query args to a URL.
 *
 * @param url - The URL to append to.
 * @param cmcd - The CMCD object to append.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The URL with the CMCD query args appended.
 *
 * @group CMCD
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/cmcd/appendCmcdQuery.test.ts#example}
 */
export function appendCmcdQuery(url: string, cmcd: Cmcd, options?: CmcdEncodeOptions): string {
	// TODO: Replace with URLSearchParams once we drop Safari < 10.1 & Chrome < 49 support.
	// https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams

	const query = toCmcdQuery(cmcd, options);
	if (!query) {
		return url;
	}

	if (REGEX.test(url)) {
		return url.replace(REGEX, query);
	}

	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}${query}`;
}
