import type { Box } from '../Box.js';
import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

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
export type PreselectionGroupBox = FullBox & Array<Box> & {
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

/**
 * Parse a PreselectionGroupBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed PreselectionGroupBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function prsl(view: IsoView): PreselectionGroupBox {
	const { version, flags } = view.readFullBox();
	const groupId = view.readUint(4);
	const numEntitiesInGroup = view.readUint(4);
	const entities = view.readEntries<Entity>(numEntitiesInGroup, () => ({
		entityId: view.readUint(4),
	}));
	const preselectionTag = flags & 0x1000 ? view.readUtf8(-1) : undefined;
	const selectionPriority = flags & 0x2000 ? view.readUint(1) : undefined;
	const interleavingTag = flags & 0x4000 ? view.readUtf8(-1) : undefined;
	const boxes = view.readBoxes(-1);

	return Object.assign(boxes, {
		version,
		flags,
		groupId,
		numEntitiesInGroup,
		entities,
		preselectionTag,
		selectionPriority,
		interleavingTag,
	});
}
