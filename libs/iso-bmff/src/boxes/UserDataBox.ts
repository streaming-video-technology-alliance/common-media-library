import type { IsoBox } from '../IsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Child boxes of User Data Box
 *
 * @public
 */
export type UserDataBoxChild<V extends IsoInt64 = number> = IsoBox<V>

/**
 * User Data Box (`udta`).
 *
 * ISO/IEC 14496-12:2015 - 8.10.1
 *
 * @public
 */
export type UserDataBox<V extends IsoInt64 = number> = {
	type: 'udta'
	boxes: UserDataBoxChild<V>[]
}
