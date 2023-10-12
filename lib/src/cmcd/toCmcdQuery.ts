import { CMCD_PARAM } from './CMCD_PARAM.js';
import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { encodeCmcd } from './encodeCmcd.js';

/**
 * Convert a CMCD data object to a query arg.
 * 
 * @param cmcd - The CMCD object to convert.
 * @param options - Options for encoding the CMCD object.
 * 
 * @returns The CMCD query arg.
 * 
 * @group CMCD
 */
export function toCmcdQuery(cmcd: Cmcd, options: CmcdEncodeOptions = {}) {
	if (!cmcd) {
		return '';
	}
	
	const params = encodeCmcd(cmcd, options);

	return `${CMCD_PARAM}=${encodeURIComponent(params)}`;
}
