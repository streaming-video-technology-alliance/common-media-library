import type { ValueOf } from '@svta/cml-utils/ValueOf.js';

/**
 * Logging levels for the CTA-608 parser.
 *
 * @group CTA-608
 *
 * @enum
 *
 * @beta
 */
export const VerboseLevel = {
	ERROR: 0,
	TEXT: 1,
	WARNING: 2,
	INFO: 2,
	DEBUG: 3,
	DATA: 3,
} as const;

/**
 * @beta
 */
export type VerboseLevel = ValueOf<typeof VerboseLevel>;
