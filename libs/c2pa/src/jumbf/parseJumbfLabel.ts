const JUMD_UUID_SIZE = 16
const JUMD_TOGGLES_OFFSET = 16
const JUMD_LABEL_START = 17
const LABEL_FLAG_MASK = 0x03
const LABEL_FLAG_EXPECTED = 0x03

/**
 * Extracts the label from a JUMBF Description Box (`jumd`) data payload.
 *
 * The `jumd` format is: 16-byte UUID + 1-byte toggles + null-terminated label string.
 * A label is only present when bits 0 and 1 of the toggles byte are both set.
 *
 * @param jumdData - Raw bytes of the `jumd` box data (payload after the box header)
 * @returns The label string, or `null` if no label is present
 *
 * @example
 * {@includeCode ../../test/jumbf/parseJumbfLabel.test.ts#example}
 *
 * @public
 */
export function parseJumbfLabel(jumdData: Uint8Array): string | null {
	if (jumdData.length < JUMD_UUID_SIZE + 1) return null

	const toggles = jumdData[JUMD_TOGGLES_OFFSET]
	if ((toggles & LABEL_FLAG_MASK) !== LABEL_FLAG_EXPECTED) return null

	let end = JUMD_LABEL_START
	while (end < jumdData.length && jumdData[end] !== 0) end++
	if (end >= jumdData.length) return null

	return new TextDecoder().decode(jumdData.subarray(JUMD_LABEL_START, end))
}
