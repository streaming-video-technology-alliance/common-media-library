import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { encodeCmcd } from './encodeCmcd.js';

/**
 * Convert a CMCD data object to query args
 */
export function toQuery(cmcd: Cmcd, options: CmcdEncodeOptions = {}) {
	if (!cmcd) {
		return '';
	}
	
	const params = encodeCmcd(cmcd, options);

	if (options?.searchParams) {
		options.searchParams.set('CMCD', params);
		return params;
	}

	return `CMCD=${encodeURIComponent(params)}`;
}
