import type { Entity } from './Entity.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Child boxes of Preselection Group Box
 *
 * @public
 */
// TODO: Find documentation on what children are allowed
export type PreselectionGroupBoxChild = any;

/**
 * ISO/IEC 14496-12:202x - 8.18.4.1 Preselection group box
 *
 * @public
 */
export type PreselectionGroupBox = FullBox & {
	type: 'prsl';

	/** Group ID */
	groupId: number;

	/** Number of entities in group */
	numEntitiesInGroup: number;

	/** Entities */
	entities: Entity[];

	preselectionTag?: string;
	selectionPriority?: number;
	interleavingTag?: string;
	boxes: PreselectionGroupBoxChild[];
};
