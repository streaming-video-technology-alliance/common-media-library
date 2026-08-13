import { parseCta608DataFromMetadataObu, readObu } from './utils/obuHelpers.ts'

/**
 * Extracts CTA-608 data from an AV1 (`av01`) sample.
 *
 * AV1 has no NAL units, so captions ride in an `metadata_itu_t_t35` OBU rather than in
 * an SEI message. The caption payload is unchanged — the same A/53 `cc_data()` under the
 * same T.35/GA94 identifier that {@link extractCta608DataFromSample} reads — so the
 * returned field data feeds {@link Cta608Parser} identically.
 *
 * This is a separate function rather than a codec branch inside
 * {@link extractCta608DataFromSample} because the two carriages are framed differently and
 * neither sample is self-identifying. A NAL unit sample puts a fixed-width big-endian
 * length in front of each unit, and that width is only known from `lengthSizeMinusOne` in
 * the `avcC`/`hvcC` config. An AV1 sample uses the low-overhead format, where each OBU
 * carries its own `obu_size` after the header — and may omit it on the last OBU. Select on
 * the sample entry type (`av01`) instead.
 *
 * @param raw - The DataView with media data
 * @param startPos - The start position of the sample within the DataView
 * @param sampleSize - The size of the sample in bytes
 * @returns fieldData array containing field 1 and field 2 data arrays
 *
 * @example
 * {@includeCode ../test/extractCta608DataFromAv1Sample.test.ts#example}
 *
 * @public
 */
export function extractCta608DataFromAv1Sample(raw: DataView, startPos: number, sampleSize: number): number[][] {
	const fieldData: number[][] = [[], []]

	// One mp4 sample is one temporal unit: OBUs in the low-overhead format, each sized by
	// its own obu_size rather than by an outer length prefix.
	const endPos = Math.min(startPos + sampleSize, raw.byteLength)
	let cursor = startPos

	while (cursor < endPos) {
		const obu = readObu(raw, cursor, endPos)
		if (!obu) {
			break
		}

		if (obu.isMetadata) {
			parseCta608DataFromMetadataObu(raw, obu.payloadStart, obu.payloadEnd, fieldData)
		}

		// A zero-length OBU (a temporal delimiter) must still advance past its header.
		cursor = Math.max(obu.payloadEnd, cursor + 1)
	}

	return fieldData
}
