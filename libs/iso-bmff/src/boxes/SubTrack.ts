import type { IsoBox } from '../IsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Child boxes of Sub Track Box
 *
 * @public
 */
export type SubTrackChild<V extends IsoInt64 = number> = IsoBox<V>

/**
 * Sub Track Box (`strk`).
 *
 * ISO/IEC 14496-12:2015 - 8.14.3
 *
 * @public
 */
export type SubTrack<V extends IsoInt64 = number> = {
	type: 'strk'
	boxes: SubTrackChild<V>[]
}
