import type { Entity } from './Entity.ts'
import type { FullBox } from './FullBox.ts'

// TODO: Find documentation on what children are allowed
/**
 * Child boxes of Preselection Group Box
 *
 * @public
 */
export type PreselectionGroupBoxChild = any

/**
 * Preselection Group Box (`prsl`).
 *
 * ISO/IEC 14496-12
 *
 * @public
 */
export type PreselectionGroupBox = FullBox & {
	type: 'prsl'

	/** Group ID */
	groupId: number

	/** Number of entities in group */
	numEntitiesInGroup: number

	/** Entities */
	entities: Entity[]

	preselectionTag?: string
	selectionPriority?: number
	interleavingTag?: string
	boxes: PreselectionGroupBoxChild[]
}
