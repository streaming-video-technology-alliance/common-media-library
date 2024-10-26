import { CMSD_DYNAMIC } from './CMSD_DYNAMIC.js';
import { CMSD_STATIC } from './CMSD_STATIC.js';

/**
 * CMSD header fields.
 *
 * @group CMSD
 *
 * @beta
 */
export const CmsdHeaderField = {
	/**
	 * Keys whose values persist over multiple requests for the object.
	 */
	STATIC: CMSD_STATIC as typeof CMSD_STATIC,

	/**
	 * Keys whose values apply only to the next transmission hop. Typically a
	 * new CMSD-Dynamic header instance will be added by each intermediary
	 * participating in the delivery.
	 */
	DYNAMIC: CMSD_DYNAMIC as typeof CMSD_DYNAMIC,
} as const;

/**
 * CMSD header fields.
 *
 * @group CMSD
 *
 * @see {@link CmsdHeaderField}
 *
 * @beta
 */
export type CmsdHeaderField = typeof CmsdHeaderField[keyof typeof CmsdHeaderField];
