import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { CMCD_PARAM } from './CmcdParam.js';
import { encodeCmcd } from './encodeCmcd.js';

/**
 * Convert a CMCD data object to query args
 */
export function toCmcdQuery(cmcd: Cmcd, options: CmcdEncodeOptions = {}) {
	if (!cmcd) {
		return '';
	}
	
	const params = encodeCmcd(cmcd, options);

	return `${CMCD_PARAM}=${encodeURIComponent(params)}`;
}
