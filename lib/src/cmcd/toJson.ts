import { Cmcd } from './Cmcd.js';
import { CmcdValue } from './CmcdValue.js';
import { processCmcd } from './processCmcd.js';

/**
 * Convert a CMCD data object to JSON
 */
export function toJson(cmcd: Partial<Cmcd>) {
	const toValue = (value: CmcdValue) => typeof value == 'symbol' ? value.description : value;
	const data = processCmcd(cmcd, (value, key) => [key, toValue(value)]);
  
	return JSON.stringify(Object.fromEntries(data));
}
