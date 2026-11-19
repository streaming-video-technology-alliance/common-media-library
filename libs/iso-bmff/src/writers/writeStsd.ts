import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeChildBoxes } from '../writeChildBoxes.ts'

/**
 * Write the `stsd` box (`SampleDescriptionBox`).
 *
 * The writer writes the sample entries with the writers of the cursor.
 *
 * @param cursor - The write cursor
 * @param box - The `SampleDescriptionBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeStsd.test.ts#example}
 *
 * @public
 */
export function writeStsd(cursor: IsoBoxWriteCursor, box: SampleDescriptionBox<IsoInt64>): void {
	const start = beginIsoFullBox(cursor, 'stsd', box.version, box.flags)

	writeUint32(cursor, box.boxes.length)
	writeChildBoxes(cursor, box.boxes)
	endIsoBox(cursor, start)
}
