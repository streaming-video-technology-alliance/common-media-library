import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Loudness Box (`ludt`).
 *
 * ISO/IEC 14496-12:2015 - 12.2.7
 *
 * @public
 */
export type LoudnessBox<V extends IsoInt64 = number> = {
	type: 'ludt'
	boxes: ParsedIsoBox<V>[]
}
