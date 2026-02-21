/**
 * Maps CMCD keys to their maximum string length.
 *
 * @internal
 */
export const CMCD_STRING_LENGTH_LIMITS: Record<string, number> = {
	sid: 64,
	cid: 128,
	cdn: 128,
	h: 128,
	cen: 64,
}

/**
 * Maximum length for custom key values.
 *
 * @internal
 */
export const CMCD_CUSTOM_KEY_VALUE_MAX_LENGTH = 64
