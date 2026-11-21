import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { LabelBox } from '../boxes/LabelBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeTerminatedUtf8 } from '../cursor/writeTerminatedUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `labl` box (`LabelBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `LabelBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeLabl.test.ts#example}
 *
 * @public
 */
export function writeLabl(cursor: IsoBoxWriteCursor, box: LabelBox): void {
	const start = beginIsoFullBox(cursor, 'labl', box.version, box.flags)

	writeUint16(cursor, box.labelId)
	writeTerminatedUtf8(cursor, box.language)
	writeTerminatedUtf8(cursor, box.label)
	endIsoBox(cursor, start)
}
