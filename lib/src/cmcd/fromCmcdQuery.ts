import { Cmcd } from './Cmcd.js';
import { CMCD_PARAM } from './CmcdParam.js';
import { decodeCmcd } from './decodeCmcd.js';

export function fromCmcdQuery(query: string | URLSearchParams): Cmcd {
	if (typeof query === 'string') {
		query = new URLSearchParams(query);
	}
  
	const value = query.get(CMCD_PARAM);
  
	return decodeCmcd(value as string);
}
