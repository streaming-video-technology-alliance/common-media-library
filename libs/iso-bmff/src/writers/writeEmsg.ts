import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { EventMessageBox } from '../boxes/EventMessageBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { writeTerminatedUtf8 } from '../cursor/writeTerminatedUtf8.ts'
import { writeBytes } from '../cursor/writeBytes.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `emsg` box (`EventMessageBox`).
 *
 * ISO/IEC 23009-1:2022 - 5.10.3.3
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * For a version other than 0 or 1, the writer writes the full box fields and `messageData` only.
 *
 * @param cursor - The write cursor
 * @param box - The `EventMessageBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeEmsg(cursor: IsoBoxWriteCursor, box: EventMessageBox<IsoInt64>): void {
	const start = beginIsoFullBox(cursor, 'emsg', box.version, box.flags)

	if (box.version === 0) {
		writeTerminatedUtf8(cursor, box.schemeIdUri)
		writeTerminatedUtf8(cursor, box.value)
		writeUint32(cursor, box.timescale)
		writeUint32(cursor, box.presentationTimeDelta as number)
		writeUint32(cursor, box.eventDuration)
		writeUint32(cursor, box.id)
	} else if (box.version === 1) {
		writeUint32(cursor, box.timescale)
		writeWideUint(cursor, box.presentationTime as IsoInt64, 8)
		writeUint32(cursor, box.eventDuration)
		writeUint32(cursor, box.id)
		writeTerminatedUtf8(cursor, box.schemeIdUri)
		writeTerminatedUtf8(cursor, box.value)
	}

	writeBytes(cursor, box.messageData)
	endIsoBox(cursor, start)
}
