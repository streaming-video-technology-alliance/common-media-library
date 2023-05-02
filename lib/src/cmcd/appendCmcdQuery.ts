import { Cmcd } from './Cmcd.js';
import { toCmcdQuery } from './toCmcdQuery.js';

/**
 * Append CMCD query args to a URL.
 */
export function appendCmcdQuery(url: string, cmcd: Cmcd) {
	const query = toCmcdQuery(cmcd);
	if (!query) {
		return url;
	}

	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}${query}`;
}
