import type { IsoInt64 } from '../IsoInt64.ts'
import type { EditListBox } from './EditListBox.ts'

/**
 * Child boxes of Edit Box
 *
 * @public
 */
export type EditBoxChild<V extends IsoInt64 = number> = EditListBox<V>

/**
 * Edit Box - 'edts' - Container
 *
 * @public
 */
export type EditBox<V extends IsoInt64 = number> = {
	type: 'edts'
	boxes: EditBoxChild<V>[]
}
