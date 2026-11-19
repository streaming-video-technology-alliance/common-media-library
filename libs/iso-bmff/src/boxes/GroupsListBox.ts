import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Groups List Box (`grpl`).
 *
 * ISO/IEC 14496-12
 *
 * @public
 */
export type GroupsListBox<V extends IsoInt64 = number> = {
	type: 'grpl'
	boxes: ParsedIsoBox<V>[]
}
