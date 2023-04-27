import { Cmcd } from './Cmcd.js';
import { toQuery } from './toQuery.js';

/**
 * Append CMCD query args to a URL.
 */
export function appendToUrl(cmcd: Cmcd, url: string) {
	const query = toQuery(cmcd);
	if (!query) {
		return url;
	}

	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}${query}`;
}
