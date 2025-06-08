import type { FullBox } from './FullBox.js';

/**
 * Entity
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type Entity = {
	/** Entity ID */
	entityId: number;
};

/**
 * ISO/IEC 14496-12:202x - 8.18.4.1 Preselection group box
 *
 * @group ISOBMFF
 *
 * @beta
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
};
