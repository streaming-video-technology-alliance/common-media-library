import type { IsoInt64 } from '../IsoInt64.ts'
import { encodeText } from '@svta/cml-utils'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import type { PreselectionGroupBox } from '../boxes/PreselectionGroupBox.ts'
import { writeBytes } from '../cursor/writeBytes.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeUint8 } from '../cursor/writeUint8.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeChildBoxes } from '../writeChildBoxes.ts'

/**
 * Write the `prsl` box (`PreselectionGroupBox`).
 *
 * The writer writes `preselectionTag` when flag `0x1000` is set and `interleavingTag` when flag `0x4000` is set.
 * The writer writes an empty string for a missing tag. The writer writes the child boxes with the writers of the cursor.
 *
 * @param cursor - The write cursor
 * @param box - The `PreselectionGroupBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writePrsl.test.ts#example}
 *
 * @public
 */
export function writePrsl(cursor: IsoBoxWriteCursor, box: PreselectionGroupBox<IsoInt64>): void {
	const { flags } = box
	const start = beginIsoFullBox(cursor, 'prsl', box.version, flags)

	writeUint32(cursor, box.groupId)
	writeUint32(cursor, box.numEntitiesInGroup)

	for (const entityId of box.entityId) {
		writeUint32(cursor, entityId)
	}

	if (flags & 0x1000) {
		writeBytes(cursor, encodeText(box.preselectionTag ?? ''))
		writeUint8(cursor, 0)
	}

	if (flags & 0x2000) {
		writeUint8(cursor, box.selectionPriority ?? 0)
	}

	if (flags & 0x4000) {
		writeBytes(cursor, encodeText(box.interleavingTag ?? ''))
		writeUint8(cursor, 0)
	}

	writeChildBoxes(cursor, box.boxes)
	endIsoBox(cursor, start)
}
