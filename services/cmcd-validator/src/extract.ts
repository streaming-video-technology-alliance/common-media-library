import type { Cmcd } from '@svta/cml-cmcd'
import { CMCD_PARAM, fromCmcdHeaders, fromCmcdQuery, CMCD_OBJECT, CMCD_REQUEST, CMCD_SESSION, CMCD_STATUS } from '@svta/cml-cmcd'

/**
 * Result of extracting CMCD data from a request.
 */
export type ExtractedCmcd = {
	data: Cmcd;
	sessionId: string | undefined;
	source: 'query' | 'headers';
}

const CMCD_HEADER_NAMES = [CMCD_OBJECT, CMCD_REQUEST, CMCD_SESSION, CMCD_STATUS]

/**
 * Extract CMCD data from an incoming request's URL and headers.
 */
export function extractCmcd(url: URL, headers: Headers): ExtractedCmcd | null {
	if (url.searchParams.has(CMCD_PARAM)) {
		const data = fromCmcdQuery(url.searchParams)
		return {
			data,
			sessionId: typeof data.sid === 'string' ? data.sid : undefined,
			source: 'query',
		}
	}

	if (CMCD_HEADER_NAMES.some(name => headers.has(name))) {
		const data = fromCmcdHeaders(headers)
		return {
			data,
			sessionId: typeof data.sid === 'string' ? data.sid : undefined,
			source: 'headers',
		}
	}

	return null
}
