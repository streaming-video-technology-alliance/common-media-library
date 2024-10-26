import { CMCD_HEADERS } from './CMCD_HEADERS';
import { CMCD_JSON } from './CMCD_JSON';
import { CMCD_QUERY } from './CMCD_QUERY';

/**
 * CMCD encoding types.
 *
 * @group CMCD
 *
 * @readonly
 * @beta
 */
export const CmcdEncoding = {
	/**
	 * JSON
	 */
	JSON: CMCD_JSON as typeof CMCD_JSON,

	/**
	 * Query string
	 */
	QUERY: CMCD_QUERY as typeof CMCD_QUERY,

	/**
	 * Request headers
	 */
	HEADERS: CMCD_HEADERS as typeof CMCD_HEADERS,

} as const;

/**
 * CMCD encoding types.
 *
 * @group CMCD
 *
 * @see {@link CmcdEncoding}
 *
 * @beta
 */
export type CmcdEncoding = typeof CmcdEncoding[keyof typeof CmcdEncoding];
