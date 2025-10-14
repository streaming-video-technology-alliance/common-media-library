import type { ValueOf } from '@svta/cml-utils'

/**
 * Logging levels for the CTA-608 parser.
 *
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
} as const

/**
 * @beta
 */
export type VerboseLevel = ValueOf<typeof VerboseLevel>;
