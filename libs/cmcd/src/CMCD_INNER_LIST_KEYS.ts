/**
 * Keys that are inner lists in V2 but plain scalars in V1.
 *
 * Used by both encoding (down-conversion) and decoding (up-conversion).
 *
 * @internal
 */
export const CMCD_INNER_LIST_KEYS = new Set([
	'ab', 'bl', 'br', 'bsa', 'bsd', 'bsda', 'lab', 'lb', 'mtp', 'pb', 'tab', 'tb', 'tbl', 'tpb',
])
