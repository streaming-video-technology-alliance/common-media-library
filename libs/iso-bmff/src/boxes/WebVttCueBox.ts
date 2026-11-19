import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'

/**
 * WebVTT Cue Box (`vttc`).
 *
 * ISO/IEC 14496-30:2014
 *
 * @public
 */
export type WebVttCueBox<V extends IsoInt64 = number> = {
	type: 'vttc'
	boxes: ParsedIsoBox<V>[]
}
