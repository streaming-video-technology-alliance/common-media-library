import type { IsoInt64 } from '../IsoInt64.ts'
import type { EditBox } from './EditBox.ts'
import type { MediaBox } from './MediaBox.ts'
import type { TrackHeaderBox } from './TrackHeaderBox.ts'
import type { TrackReferenceBox } from './TrackReferenceBox.ts'
import type { UserDataBox } from './UserDataBox.ts'

/**
 * Child boxes of Track Box
 *
 * @public
 */
export type TrackBoxChild<V extends IsoInt64 = number> =
	| TrackHeaderBox<V>
	| TrackReferenceBox
	| EditBox<V>
	| MediaBox<V>
	| UserDataBox<V>

/**
 * Track Box (`trak`).
 *
 * ISO/IEC 14496-12:2015 - 8.3.1
 *
 * @public
 */
export type TrackBox<V extends IsoInt64 = number> = {
	type: 'trak'
	boxes: TrackBoxChild<V>[]
}
