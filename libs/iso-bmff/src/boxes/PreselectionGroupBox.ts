import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Preselection Group Box (`prsl`).
 *
 * ISO/IEC 14496-12
 *
 * @public
 */
export type PreselectionGroupBox<V extends IsoInt64 = number> = FullBox & {
	type: 'prsl'

	/** Group ID */
	groupId: number

	/** Number of entities in group */
	numEntitiesInGroup: number

	/** The IDs of the entities in the group. */
	entityId: number[]

	preselectionTag?: string
	selectionPriority?: number
	interleavingTag?: string
	boxes: ParsedIsoBox<V>[]
}
