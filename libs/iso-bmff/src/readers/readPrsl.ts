import type { Entity } from '../boxes/Entity.ts'
import type { PreselectionGroupBox, PreselectionGroupBoxChild } from '../boxes/PreselectionGroupBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `PreselectionGroupBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `PreselectionGroupBox`
 *
 * @public
 */
export function readPrsl(view: IsoBoxReadView): PreselectionGroupBox {
	const { version, flags } = view.readFullBox()
	const groupId = view.readUint(4)
	const numEntitiesInGroup = view.readUint(4)
	const entities = view.readEntries<Entity>(numEntitiesInGroup, () => ({
		entityId: view.readUint(4),
	}))
	const preselectionTag = flags & 0x1000 ? view.readUtf8(-1) : undefined
	const selectionPriority = flags & 0x2000 ? view.readUint(1) : undefined
	const interleavingTag = flags & 0x4000 ? view.readUtf8(-1) : undefined

	return {
		type: 'prsl',
		version,
		flags,
		groupId,
		numEntitiesInGroup,
		entities,
		preselectionTag,
		selectionPriority,
		interleavingTag,
		boxes: view.readBoxes<PreselectionGroupBoxChild>(),
	}
}
