/**
 * Inner-list keys in version 2 that are scalars in version 1.
 *
 * Used by both encoding (down-conversion) and decoding (up-conversion).
 *
 * @internal
 */
export const CMCD_INNER_LIST_KEYS: Set<string> = new Set<string>([
	'ab', 'bl', 'br', 'bsa', 'bsd', 'bsda', 'lab', 'lb', 'mtp', 'pb', 'tab', 'tb', 'tbl', 'tpb',
])
