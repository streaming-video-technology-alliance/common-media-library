import type { PreselectionGroupBox } from '../boxes/PreselectionGroupBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readTerminatedUtf8 } from '../cursor/readTerminatedUtf8.ts'
import { readChildBoxes } from '../readChildBoxes.ts'

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
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const groupId = readUint32(cursor)
	const numEntitiesInGroup = readUint32(cursor)
	const entityId: number[] = []

	for (let i = 0; i < numEntitiesInGroup; i++) {
		entityId.push(readUint32(cursor))
	}

	const preselectionTag = flags & 0x1000 ? readTerminatedUtf8(cursor) : undefined
	const selectionPriority = flags & 0x2000 ? readUint8(cursor) : undefined
	const interleavingTag = flags & 0x4000 ? readTerminatedUtf8(cursor) : undefined

	return {
		type: 'prsl',
		version,
		flags,
		groupId,
		entityId,
		preselectionTag,
		selectionPriority,
		interleavingTag,
		boxes: readChildBoxes(cursor),
	}
}
