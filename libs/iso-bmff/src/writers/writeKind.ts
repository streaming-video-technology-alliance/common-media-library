import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { KindBox } from '../boxes/KindBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeTerminatedUtf8 } from '../cursor/writeTerminatedUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `kind` box (`KindBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `KindBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writeKind.test.ts#example}
 *
 * @public
 */
export function writeKind(cursor: IsoBoxWriteCursor, box: KindBox): void {
	const start = beginIsoFullBox(cursor, 'kind', box.version, box.flags)

	writeTerminatedUtf8(cursor, box.schemeUri)
	writeTerminatedUtf8(cursor, box.value)
	endIsoBox(cursor, start)
}
