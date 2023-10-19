import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { processCmcd } from './processCmcd.js';
import { symbolToStr } from './symbolToStr.js';

/**
 * Convert a CMCD data object to JSON.
 * 
 * @param cmcd - The CMCD object to convert.
 * @param options - Options for encoding the CMCD object.
 * 
 * @returns The CMCD JSON.
 * 
 * @group CMCD
 */
export function toCmcdJson(cmcd: Cmcd, options?: CmcdEncodeOptions) {
	const data = processCmcd(cmcd, options);

	return JSON.stringify(data, (_, value) => typeof value === 'symbol' ? symbolToStr(value) : value);
}
