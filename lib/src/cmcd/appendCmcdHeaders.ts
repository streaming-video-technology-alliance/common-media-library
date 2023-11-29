import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { toCmcdHeaders } from './toCmcdHeaders.js';

/**
 * Append CMCD query args to a header object.
 *
 * @param headers - The headers to append to.
 * @param cmcd - The CMCD object to append.
 * @param customHeaderMap - A map of custom CMCD keys to header fields.
 *
 * @returns The headers with the CMCD header shards appended.
 *
 * @group CMCD
 *
 * @beta
 */
export function appendCmcdHeaders(headers: Record<string, string>, cmcd: Cmcd, options?: CmcdEncodeOptions) {
	return Object.assign(headers, toCmcdHeaders(cmcd, options));
}
