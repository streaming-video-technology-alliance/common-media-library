import { CMCD_PARAM } from './CMCD_PARAM.js';
import type { Cmcd } from './Cmcd.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { toCmcdUrl } from './toCmcdUrl.js';

/**
 * Convert a CMCD data object to a query arg.
 *
 * @param cmcd - The CMCD object to convert.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The CMCD query arg.
 *
 * @group CMCD
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/cmcd/toCmcdQuery.test.ts#example}
 */
export function toCmcdQuery(cmcd: Cmcd, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return '';
	}

	const value = toCmcdUrl(cmcd, options);

	return `${CMCD_PARAM}=${value}`;
}
