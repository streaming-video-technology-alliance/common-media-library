/**
 * Logging levels for the CTA-608 parser.
 *
 * @group CTA-608
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
 * Logging levels for the CTA-608 parser.
 *
 * @group CTA-608
 * @see {@link VerboseLevel}
 * @beta
 */
export type VerboseLevel = typeof VerboseLevel[keyof typeof VerboseLevel];
