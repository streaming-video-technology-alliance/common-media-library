import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { encodeCmcd } from './encodeCmcd.js';

/**
 * Convert a CMCD data object to query args
 */
export function toCmcdQuery(cmcd: Cmcd, options: CmcdEncodeOptions = {}) {
	if (!cmcd) {
		return '';
	}
	
	const params = encodeCmcd(cmcd, options);

	return `CMCD=${encodeURIComponent(params)}`;
}
