import type { IsoBox } from '../IsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Child boxes of Groups List Box
 *
 * @public
 */
export type GroupsListBoxChild<V extends IsoInt64 = number> = IsoBox<V>

/**
 * Groups List Box - 'grpl' - Container
 *
 * @public
 */
export type GroupsListBox<V extends IsoInt64 = number> = {
	type: 'grpl'
	boxes: GroupsListBoxChild<V>[]
}
