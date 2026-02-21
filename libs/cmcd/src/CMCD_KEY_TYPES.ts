/**
 * CMCD key value type: inner list of numbers with token identifiers.
 *
 * @internal
 */
export const CMCD_KEY_TYPE_NUMBER_LIST = 'number[]' as const

/**
 * CMCD key value type: inner list of strings.
 *
 * @internal
 */
export const CMCD_KEY_TYPE_STRING_LIST = 'string[]' as const

/**
 * CMCD key value type: integer.
 *
 * @internal
 */
export const CMCD_KEY_TYPE_INTEGER = 'integer' as const

/**
 * CMCD key value type: number (decimal).
 *
 * @internal
 */
export const CMCD_KEY_TYPE_NUMBER = 'number' as const

/**
 * CMCD key value type: boolean.
 *
 * @internal
 */
export const CMCD_KEY_TYPE_BOOLEAN = 'boolean' as const

/**
 * CMCD key value type: string.
 *
 * @internal
 */
export const CMCD_KEY_TYPE_STRING = 'string' as const

/**
 * CMCD key value type: token.
 *
 * @internal
 */
export const CMCD_KEY_TYPE_TOKEN = 'token' as const

/**
 * Maps each CMCD spec key to its expected value type for v2.
 * Keys that differ between v1 and v2 are handled by CMCD_V1_KEY_TYPE_OVERRIDES.
 *
 * @internal
 */
export const CMCD_KEY_TYPES: Record<string, string> = {
	// List keys (inner list of integers/numbers with token identifiers)
	ab: CMCD_KEY_TYPE_NUMBER_LIST,
	bl: CMCD_KEY_TYPE_NUMBER_LIST,
	br: CMCD_KEY_TYPE_NUMBER_LIST,
	bsa: CMCD_KEY_TYPE_NUMBER_LIST,
	bsd: CMCD_KEY_TYPE_NUMBER_LIST,
	bsda: CMCD_KEY_TYPE_NUMBER_LIST,
	lab: CMCD_KEY_TYPE_NUMBER_LIST,
	lb: CMCD_KEY_TYPE_NUMBER_LIST,
	mtp: CMCD_KEY_TYPE_NUMBER_LIST,
	pb: CMCD_KEY_TYPE_NUMBER_LIST,
	tab: CMCD_KEY_TYPE_NUMBER_LIST,
	tb: CMCD_KEY_TYPE_NUMBER_LIST,
	tbl: CMCD_KEY_TYPE_NUMBER_LIST,
	tpb: CMCD_KEY_TYPE_NUMBER_LIST,

	// String array keys (inner list of strings)
	ec: CMCD_KEY_TYPE_STRING_LIST,
	nor: CMCD_KEY_TYPE_STRING_LIST,

	// Integer keys
	d: CMCD_KEY_TYPE_INTEGER,
	dfa: CMCD_KEY_TYPE_INTEGER,
	dl: CMCD_KEY_TYPE_INTEGER,
	ltc: CMCD_KEY_TYPE_INTEGER,
	msd: CMCD_KEY_TYPE_INTEGER,
	pt: CMCD_KEY_TYPE_INTEGER,
	rc: CMCD_KEY_TYPE_INTEGER,
	rtp: CMCD_KEY_TYPE_INTEGER,
	sn: CMCD_KEY_TYPE_INTEGER,
	ts: CMCD_KEY_TYPE_INTEGER,
	ttfb: CMCD_KEY_TYPE_INTEGER,
	ttfbb: CMCD_KEY_TYPE_INTEGER,
	ttlb: CMCD_KEY_TYPE_INTEGER,
	v: CMCD_KEY_TYPE_INTEGER,

	// Number keys
	pr: CMCD_KEY_TYPE_NUMBER,

	// Boolean keys
	bg: CMCD_KEY_TYPE_BOOLEAN,
	bs: CMCD_KEY_TYPE_BOOLEAN,
	nr: CMCD_KEY_TYPE_BOOLEAN,
	su: CMCD_KEY_TYPE_BOOLEAN,

	// String keys
	cdn: CMCD_KEY_TYPE_STRING,
	cen: CMCD_KEY_TYPE_STRING,
	cid: CMCD_KEY_TYPE_STRING,
	cmsdd: CMCD_KEY_TYPE_STRING,
	cmsds: CMCD_KEY_TYPE_STRING,
	cs: CMCD_KEY_TYPE_STRING,
	h: CMCD_KEY_TYPE_STRING,
	nrr: CMCD_KEY_TYPE_STRING,
	sid: CMCD_KEY_TYPE_STRING,
	smrt: CMCD_KEY_TYPE_STRING,
	url: CMCD_KEY_TYPE_STRING,

	// Token keys
	e: CMCD_KEY_TYPE_TOKEN,
	ot: CMCD_KEY_TYPE_TOKEN,
	sf: CMCD_KEY_TYPE_TOKEN,
	st: CMCD_KEY_TYPE_TOKEN,
	sta: CMCD_KEY_TYPE_TOKEN,
}

/**
 * Maps keys to their v1-specific types when they differ from v2.
 *
 * @internal
 */
export const CMCD_V1_KEY_TYPE_OVERRIDES: Record<string, string> = {
	bl: CMCD_KEY_TYPE_INTEGER,
	br: CMCD_KEY_TYPE_NUMBER,
	mtp: CMCD_KEY_TYPE_INTEGER,
	tb: CMCD_KEY_TYPE_NUMBER,
	nor: CMCD_KEY_TYPE_STRING,
}
