import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * User Data Box (`udta`).
 *
 * ISO/IEC 14496-12:2015 - 8.10.1
 *
 * @public
 */
export type UserDataBox<V extends IsoInt64 = number> = {
	type: 'udta'
	boxes: ParsedIsoBox<V>[]
}
