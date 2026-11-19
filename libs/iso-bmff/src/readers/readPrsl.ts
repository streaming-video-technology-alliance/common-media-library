import type { PreselectionGroupBox } from '../boxes/PreselectionGroupBox.ts'
import { UINT } from '../IsoBoxFields.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `prsl` box (`PreselectionGroupBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `PreselectionGroupBox`
 *
 * @public
 */
export function readPrsl<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): PreselectionGroupBox<V> {
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()
	const groupId = view.readUint(4)
	const numEntitiesInGroup = view.readUint(4)
	const entityId = view.readArray(UINT, 4, numEntitiesInGroup)
	const preselectionTag = flags & 0x1000 ? view.readUtf8(-1) : undefined
	const selectionPriority = flags & 0x2000 ? view.readUint(1) : undefined
	const interleavingTag = flags & 0x4000 ? view.readUtf8(-1) : undefined

	return {
		type: 'prsl',
		version,
		flags,
		groupId,
		numEntitiesInGroup,
		entityId,
		preselectionTag,
		selectionPriority,
		interleavingTag,
		boxes: view.readBoxes(),
	}
}
