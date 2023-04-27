import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { CmcdValue } from './CmcdValue.js';
import { processCmcd } from './processCmcd.js';

/**
 * Convert a CMCD data object to JSON
 */
export function toJson(cmcd: Partial<Cmcd>, options?: CmcdEncodeOptions) {
	const toValue = (value: CmcdValue) => typeof value == 'symbol' ? value.description : value;
	const data = processCmcd(cmcd, (key, value) => [key, toValue(value)], options);
  
	return JSON.stringify(Object.fromEntries(data));
}
