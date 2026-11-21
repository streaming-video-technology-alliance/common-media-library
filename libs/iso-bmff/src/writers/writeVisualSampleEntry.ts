import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { VisualSampleEntryType } from '../boxes/VisualSampleEntryType.ts'
import { writeTemplate32 } from '../cursor/writeTemplate32.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeCompressorName } from '../cursor/writeCompressorName.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeChildBoxes } from '../writeChildBoxes.ts'

/**
 * Write a visual sample entry box (`VisualSampleEntry`) of the type in its `type` field.
 *
 * ISO/IEC 14496-12:2015 - 12.1.3
 *
 * The writer writes the child boxes with the writers of the cursor.
 *
 * @param cursor - The write cursor
 * @param box - The `VisualSampleEntry` fields to write
 *
 * @public
 */
export function writeVisualSampleEntry<T extends VisualSampleEntryType = VisualSampleEntryType>(
	cursor: IsoBoxWriteCursor,
	box: VisualSampleEntry<T, IsoInt64>,
): void {
	const start = beginIsoBox(cursor, box.type)

	writeUint32(cursor, 0) // reserved
	writeUint16(cursor, 0) // reserved
	writeUint16(cursor, box.dataReferenceIndex)
	writeUint16(cursor, box.preDefined1 ?? 0)
	writeUint16(cursor, 0) // reserved

	for (let i = 0; i < 3; i++) {
		writeUint32(cursor, box.preDefined2?.[i] ?? 0)
	}

	writeUint16(cursor, box.width)
	writeUint16(cursor, box.height)
	writeTemplate32(cursor, box.horizResolution)
	writeTemplate32(cursor, box.vertResolution)
	writeUint32(cursor, 0) // reserved
	writeUint16(cursor, box.frameCount)

	writeCompressorName(cursor, box.compressorName)

	writeUint16(cursor, box.depth)
	writeUint16(cursor, (box.preDefined3 ?? -1) & 0xffff)
	writeChildBoxes(cursor, box.boxes)
	endIsoBox(cursor, start)
}
