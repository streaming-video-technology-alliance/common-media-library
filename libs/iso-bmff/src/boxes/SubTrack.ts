import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Sub Track Box (`strk`).
 *
 * ISO/IEC 14496-12:2015 - 8.14.3
 *
 * @public
 */
export type SubTrack<V extends IsoInt64 = number> = {
	type: 'strk'
	boxes: ParsedIsoBox<V>[]
}
