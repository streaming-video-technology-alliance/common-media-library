import type { IsoBox } from '../IsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Child boxes of Sub Track Box
 *
 * @public
 */
export type SubTrackBoxChild<V extends IsoInt64 = number> = IsoBox<V>

/**
 * Sub track box - 'strk'
 *
 * @public
 */
export type SubTrackBox<V extends IsoInt64 = number> = {
	type: 'strk'
	boxes: SubTrackBoxChild<V>[]
}
