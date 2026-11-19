import { beginIsoBox } from '../beginIsoBox.ts'
import { endIsoBox } from '../endIsoBox.ts'
import type { IsoBoxContainer } from '../IsoBoxContainer.ts'
import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeChildBoxes } from '../writeChildBoxes.ts'

/**
 * Writes a container box: the header, then the `boxes` field with the writers of the cursor.
 *
 * @param cursor - The write cursor.
 * @param box - The container box.
 *
 * @internal
 */
export function writeContainerBox(cursor: IsoBoxWriteCursor, box: IsoBoxContainer<IsoInt64>): void {
	const start = beginIsoBox(cursor, box.type)

	writeChildBoxes(cursor, box.boxes)
	endIsoBox(cursor, start)
}
