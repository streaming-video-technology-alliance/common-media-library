export function isCCType(type: number): boolean {
	return type === 0 || type === 1
}

export function isNonEmptyCCData(ccData1: number, ccData2: number): boolean {
	return (ccData1 & 0x7F) > 0 || (ccData2 & 0x7F) > 0
}

/**
 * Parse an ATSC A/53 Part 4 `cc_data()` structure into per-field byte pairs.
 *
 * The payload is identical for every carriage format — an AVC/HEVC/VVC SEI message and
 * an AV1 `metadata_itu_t_t35` OBU carry the same bytes under the same T.35/GA94
 * identifier — so this is the single parser shared by all of them. Only the envelope
 * around it differs.
 *
 * `cc_data()` is self-delimiting: `cc_count` states how many 3-byte constructs follow,
 * so anything after them (SEI `rbsp_trailing_bits`, an AV1 OBU `trailing_bits` byte) is
 * ignored without needing to be recognized.
 *
 * @param raw - The DataView holding the `cc_data()` structure
 * @param pos - The position of the first `cc_data()` byte, holding `cc_count`
 * @param endPos - The exclusive upper bound to read within
 * @param fieldData - Field 1 and field 2 byte arrays, appended to in place
 */
export function parseCcData(raw: DataView, pos: number, endPos: number, fieldData: number[][]): void {
	// cc_count and em_data must both be within the enclosing structure. A T.35 payload
	// carrying nothing but the 8-byte identifier ends here, and reading on would run past
	// the end of the DataView.
	if (pos + 2 > endPos) {
		return
	}

	// process_cc_data_flag is not checked: a caption-bearing payload always sets it, and
	// honoring a cleared flag would silently drop pairs some packagers emit regardless.
	const ccCount = raw.getUint8(pos) & 0x1F

	// Skip cc_count and the em_data byte to reach the first cc construct.
	let cursor = pos + 2
	const ccEnd = Math.min(cursor + ccCount * 3, endPos)

	for (; cursor + 2 < ccEnd; cursor += 3) {
		const byte = raw.getUint8(cursor)

		// marker_bits (5) | cc_valid (1) | cc_type (2)
		if (!(byte & 0x04)) {
			continue
		}

		const ccType = byte & 0x03
		if (!isCCType(ccType)) {
			continue
		}

		// Keep the parity bit — the 608 parser validates it.
		const ccData1 = raw.getUint8(cursor + 1)
		const ccData2 = raw.getUint8(cursor + 2)

		if (isNonEmptyCCData(ccData1, ccData2)) {
			fieldData[ccType].push(ccData1, ccData2)
		}
	}
}
